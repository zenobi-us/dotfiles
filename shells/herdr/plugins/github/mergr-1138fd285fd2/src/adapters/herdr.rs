use std::collections::BTreeMap;
use std::env;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::context::Snapshot;
use crate::error::{Error, Result};
use crate::sidebar::metadata_token_names;

static REQUEST_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Debug)]
pub struct HerdrClient {
    socket_path: PathBuf,
    plugin_id: String,
    source: String,
}

impl HerdrClient {
    pub fn from_environment() -> Result<Self> {
        let socket_path = match env::var_os("HERDR_SOCKET_PATH") {
            Some(path) => PathBuf::from(path),
            None => {
                let home = env::var_os("HOME")
                    .map(PathBuf::from)
                    .ok_or(Error::HomeDirectory)?;
                home.join(".config").join("herdr").join("herdr.sock")
            }
        };
        let plugin_id = env::var("HERDR_PLUGIN_ID").unwrap_or_else(|_| "mergr".to_owned());
        Ok(Self {
            socket_path,
            plugin_id: plugin_id.clone(),
            source: format!("plugin:{plugin_id}"),
        })
    }

    pub fn snapshot(&self) -> Result<Snapshot> {
        let response: SnapshotResponse = self.request("session.snapshot", json!({}))?;
        Ok(response.snapshot)
    }

    pub fn worktree_root(&self, cwd: &Path) -> Result<Option<PathBuf>> {
        let response = self.request::<WorktreeListResponse>("worktree.list", json!({ "cwd": cwd }));
        match response {
            Ok(response) => {
                let canonical_cwd = cwd.canonicalize().unwrap_or_else(|_| cwd.to_path_buf());
                let root = response
                    .worktrees
                    .into_iter()
                    .map(|worktree| worktree.path)
                    .filter(|path| canonical_cwd.starts_with(path))
                    .max_by_key(|path| path.components().count())
                    .unwrap_or(response.source.source_checkout_path);
                Ok(Some(root))
            }
            Err(Error::HerdrResponse { code, .. }) if code == "not_git_worktree" => Ok(None),
            Err(error) => Err(error),
        }
    }

    pub fn report_metadata(
        &self,
        workspace_id: &str,
        metadata: &BTreeMap<String, String>,
    ) -> Result<()> {
        let token_names = metadata_token_names();
        for token_chunk in token_names.chunks(16) {
            let tokens: BTreeMap<_, _> = token_chunk
                .iter()
                .map(|token| (token.clone(), metadata.get(token).cloned()))
                .collect();
            let _: Value = self.request(
                "workspace.report_metadata",
                json!({
                    "workspace_id": workspace_id,
                    "source": self.source,
                    "tokens": tokens,
                }),
            )?;
        }
        Ok(())
    }

    pub fn notify(&self, title: &str, body: &str) -> Result<()> {
        let _: Value = self.request(
            "notification.show",
            json!({
                "title": title,
                "body": body,
            }),
        )?;
        Ok(())
    }

    pub fn is_plugin_enabled(&self) -> Result<bool> {
        let response: PluginListResponse = self.request(
            "plugin.list",
            json!({
                "plugin_id": self.plugin_id,
            }),
        )?;
        Ok(response
            .plugins
            .iter()
            .any(|plugin| plugin.plugin_id == self.plugin_id && plugin.enabled))
    }

    fn request<T>(&self, method: &str, params: Value) -> Result<T>
    where
        T: DeserializeOwned,
    {
        let request_id = format!("mergr:{}", REQUEST_ID.fetch_add(1, Ordering::Relaxed));
        let request = Request {
            id: &request_id,
            method,
            params,
        };
        let mut request_bytes = serde_json::to_vec(&request).map_err(|source| Error::Json {
            source_name: "Herdr request".to_owned(),
            source,
        })?;
        request_bytes.push(b'\n');

        let mut stream =
            UnixStream::connect(&self.socket_path).map_err(|source| Error::HerdrConnect {
                path: self.socket_path.clone(),
                source,
            })?;
        stream
            .set_read_timeout(Some(Duration::from_secs(20)))
            .map_err(Error::HerdrIo)?;
        stream
            .set_write_timeout(Some(Duration::from_secs(20)))
            .map_err(Error::HerdrIo)?;
        stream.write_all(&request_bytes).map_err(Error::HerdrIo)?;

        let mut line = String::new();
        BufReader::new(stream)
            .read_line(&mut line)
            .map_err(Error::HerdrIo)?;
        if line.is_empty() {
            return Err(Error::HerdrIncompleteResponse);
        }

        let response: Response<T> = serde_json::from_str(&line).map_err(|source| Error::Json {
            source_name: "Herdr response".to_owned(),
            source,
        })?;
        if let Some(error) = response.error {
            return Err(Error::HerdrResponse {
                code: error.code,
                message: error.message,
            });
        }
        response.result.ok_or(Error::HerdrIncompleteResponse)
    }
}

#[derive(Serialize)]
struct Request<'a> {
    id: &'a str,
    method: &'a str,
    params: Value,
}

#[derive(Deserialize)]
struct Response<T> {
    #[allow(dead_code)]
    id: Option<String>,
    result: Option<T>,
    error: Option<ResponseError>,
}

#[derive(Deserialize)]
struct ResponseError {
    code: String,
    message: String,
}

#[derive(Deserialize)]
struct SnapshotResponse {
    snapshot: Snapshot,
}

#[derive(Deserialize)]
struct WorktreeListResponse {
    source: WorktreeSourceInfo,
    worktrees: Vec<WorktreeInfo>,
}

#[derive(Deserialize)]
struct WorktreeSourceInfo {
    source_checkout_path: PathBuf,
}

#[derive(Deserialize)]
struct WorktreeInfo {
    path: PathBuf,
}

#[derive(Deserialize)]
struct PluginListResponse {
    plugins: Vec<PluginInfo>,
}

#[derive(Deserialize)]
struct PluginInfo {
    plugin_id: String,
    enabled: bool,
}
