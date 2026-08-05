use std::env;
use std::fs;
use std::os::unix::fs::{MetadataExt, PermissionsExt};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{UnixListener, UnixStream};
use tokio::sync::{mpsc, oneshot};
use tokio::time::{sleep, timeout};

use crate::app::Action;
use crate::error::{Error, Result};

const IPC_PROTOCOL_VERSION: u16 = 1;
const CLIENT_CONNECT_ATTEMPTS: usize = 20;
const CLIENT_CONNECT_DELAY: Duration = Duration::from_millis(100);
const CLIENT_RESPONSE_TIMEOUT: Duration = Duration::from_secs(300);
const DAEMON_HANDOVER_ATTEMPTS: usize = 20;

pub struct IncomingCommand {
    pub action: Action,
    pub response: oneshot::Sender<CommandResult>,
}

pub type CommandResult = std::result::Result<String, String>;

pub enum BindOutcome {
    Ready {
        listener: UnixListener,
        guard: SocketGuard,
    },
    AlreadyRunning,
}

pub struct SocketGuard {
    path: PathBuf,
    inode: u64,
}

impl Drop for SocketGuard {
    fn drop(&mut self) {
        if fs::metadata(&self.path).is_ok_and(|metadata| metadata.ino() == self.inode) {
            let _ = fs::remove_file(&self.path);
        }
    }
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Request {
    protocol_version: u16,
    action: String,
}

#[derive(Deserialize, Serialize)]
struct Response {
    ok: bool,
    message: String,
}

pub async fn bind() -> Result<BindOutcome> {
    let path = socket_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|source| Error::DaemonIo {
            path: parent.to_path_buf(),
            source,
        })?;
    }

    if path.exists() {
        let mut existing_daemon_running = false;
        for _ in 0..DAEMON_HANDOVER_ATTEMPTS {
            existing_daemon_running =
                timeout(Duration::from_millis(250), UnixStream::connect(&path))
                    .await
                    .is_ok_and(|result| result.is_ok());
            if !existing_daemon_running {
                break;
            }
            sleep(CLIENT_CONNECT_DELAY).await;
        }
        if existing_daemon_running {
            return Ok(BindOutcome::AlreadyRunning);
        }
        sleep(CLIENT_CONNECT_DELAY).await;
        if let Err(source) = fs::remove_file(&path)
            && source.kind() != std::io::ErrorKind::NotFound
        {
            return Err(Error::DaemonIo {
                path: path.clone(),
                source,
            });
        }
    }

    let listener = UnixListener::bind(&path).map_err(|source| Error::DaemonIo {
        path: path.clone(),
        source,
    })?;
    fs::set_permissions(&path, fs::Permissions::from_mode(0o600)).map_err(|source| {
        Error::DaemonIo {
            path: path.clone(),
            source,
        }
    })?;
    let inode = fs::metadata(&path)
        .map_err(|source| Error::DaemonIo {
            path: path.clone(),
            source,
        })?
        .ino();
    Ok(BindOutcome::Ready {
        listener,
        guard: SocketGuard { path, inode },
    })
}

pub async fn serve(listener: UnixListener, commands: mpsc::Sender<IncomingCommand>) {
    loop {
        let (stream, _) = match listener.accept().await {
            Ok(connection) => connection,
            Err(error) => {
                eprintln!("mergr: daemon IPC accept failed: {error}");
                break;
            }
        };
        let commands = commands.clone();
        tokio::spawn(async move {
            if let Err(error) = serve_connection(stream, commands).await {
                eprintln!("mergr: daemon IPC request failed: {error}");
            }
        });
    }
}

pub async fn invoke(action: Action) -> Result<String> {
    let path = socket_path()?;
    let mut stream = None;
    for _ in 0..CLIENT_CONNECT_ATTEMPTS {
        match UnixStream::connect(&path).await {
            Ok(connection) => {
                stream = Some(connection);
                break;
            }
            Err(_) => sleep(CLIENT_CONNECT_DELAY).await,
        }
    }
    let mut stream = stream.ok_or_else(|| Error::DaemonUnavailable(path.clone()))?;
    let request = Request {
        protocol_version: IPC_PROTOCOL_VERSION,
        action: action.as_str().to_owned(),
    };
    let mut bytes = serde_json::to_vec(&request).map_err(|source| Error::Json {
        source_name: "mergr daemon request".to_owned(),
        source,
    })?;
    bytes.push(b'\n');
    stream
        .write_all(&bytes)
        .await
        .map_err(|source| Error::DaemonIo {
            path: path.clone(),
            source,
        })?;

    let mut reader = BufReader::new(stream);
    let mut line = String::new();
    timeout(CLIENT_RESPONSE_TIMEOUT, reader.read_line(&mut line))
        .await
        .map_err(|_| Error::DaemonResponse("request timed out".to_owned()))?
        .map_err(|source| Error::DaemonIo {
            path: path.clone(),
            source,
        })?;
    if line.is_empty() {
        return Err(Error::DaemonResponse(
            "daemon closed the connection without a response".to_owned(),
        ));
    }
    let response: Response = serde_json::from_str(&line).map_err(|source| Error::Json {
        source_name: "mergr daemon response".to_owned(),
        source,
    })?;
    if response.ok {
        Ok(response.message)
    } else {
        Err(Error::DaemonResponse(response.message))
    }
}

async fn serve_connection(
    stream: UnixStream,
    commands: mpsc::Sender<IncomingCommand>,
) -> std::result::Result<(), String> {
    let mut reader = BufReader::new(stream);
    let mut line = String::new();
    reader
        .read_line(&mut line)
        .await
        .map_err(|error| error.to_string())?;
    let request: Request = serde_json::from_str(&line).map_err(|error| error.to_string())?;
    if request.protocol_version != IPC_PROTOCOL_VERSION {
        return write_response(
            reader.get_mut(),
            Response {
                ok: false,
                message: format!(
                    "incompatible IPC protocol {}; expected {}",
                    request.protocol_version, IPC_PROTOCOL_VERSION
                ),
            },
        )
        .await;
    }
    let action = match Action::from_str(&request.action) {
        Ok(action) => action,
        Err(error) => {
            return write_response(
                reader.get_mut(),
                Response {
                    ok: false,
                    message: error.to_string(),
                },
            )
            .await;
        }
    };
    let (response_tx, response_rx) = oneshot::channel();
    commands
        .send(IncomingCommand {
            action,
            response: response_tx,
        })
        .await
        .map_err(|_| "daemon command queue closed".to_owned())?;
    let result = response_rx
        .await
        .map_err(|_| "daemon stopped before completing the request".to_owned())?;
    let response = match result {
        Ok(message) => Response { ok: true, message },
        Err(message) => Response { ok: false, message },
    };
    write_response(reader.get_mut(), response).await
}

async fn write_response(
    stream: &mut UnixStream,
    response: Response,
) -> std::result::Result<(), String> {
    let mut bytes = serde_json::to_vec(&response).map_err(|error| error.to_string())?;
    bytes.push(b'\n');
    stream
        .write_all(&bytes)
        .await
        .map_err(|error| error.to_string())
}

fn socket_path() -> Result<PathBuf> {
    let state_directory = match env::var_os("HERDR_PLUGIN_STATE_DIR") {
        Some(path) => PathBuf::from(path),
        None => {
            let home = env::var_os("HOME")
                .map(PathBuf::from)
                .ok_or(Error::HomeDirectory)?;
            let plugin_id = env::var("HERDR_PLUGIN_ID").unwrap_or_else(|_| "mergr".to_owned());
            home.join(".local")
                .join("state")
                .join("herdr")
                .join("plugins")
                .join(plugin_id)
        }
    };
    let herdr_socket = env::var_os("HERDR_SOCKET_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(default_herdr_socket);
    Ok(state_directory.join(format!(
        "daemon-{:016x}.sock",
        stable_path_hash(&herdr_socket)
    )))
}

fn default_herdr_socket() -> PathBuf {
    env::var_os("HOME").map_or_else(
        || PathBuf::from("herdr.sock"),
        |home| {
            PathBuf::from(home)
                .join(".config")
                .join("herdr")
                .join("herdr.sock")
        },
    )
}

fn stable_path_hash(path: &Path) -> u64 {
    let mut hash = 0xcbf29ce484222325_u64;
    for byte in path.as_os_str().as_encoded_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}
