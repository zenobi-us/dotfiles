use std::ffi::{OsStr, OsString};
use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

use wait_timeout::ChildExt;

use crate::error::{Error, Result};

#[derive(Clone, Debug)]
pub struct ProcessRunner {
    timeout: Duration,
}

impl ProcessRunner {
    pub fn new(timeout: Duration) -> Self {
        Self { timeout }
    }

    pub fn run<I, S>(&self, program: &str, args: I, cwd: Option<&Path>) -> Result<String>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        let args: Vec<OsString> = args
            .into_iter()
            .map(|argument| argument.as_ref().to_owned())
            .collect();
        let display = display_command(program, &args);

        let mut command = Command::new(program);
        command
            .args(&args)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(cwd) = cwd {
            command.current_dir(cwd);
        }

        let mut child = command.spawn().map_err(|source| Error::ProcessSpawn {
            program: display.clone(),
            source,
        })?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let stdout_reader = thread::spawn(move || read_pipe(stdout));
        let stderr_reader = thread::spawn(move || read_pipe(stderr));

        let status = match child
            .wait_timeout(self.timeout)
            .map_err(|source| Error::ProcessIo {
                program: display.clone(),
                source,
            })? {
            Some(status) => status,
            None => {
                let _ = child.kill();
                let _ = child.wait();
                let _ = stdout_reader.join();
                let _ = stderr_reader.join();
                return Err(Error::ProcessTimeout {
                    program: display,
                    timeout_ms: self.timeout.as_millis() as u64,
                });
            }
        };

        let stdout = stdout_reader.join().unwrap_or_default();
        let stderr = stderr_reader.join().unwrap_or_default();
        if !status.success() {
            return Err(Error::ProcessFailed {
                program: display,
                status: status
                    .code()
                    .map_or_else(|| "signal".to_owned(), |code| code.to_string()),
                stderr: String::from_utf8_lossy(&stderr).trim().to_owned(),
            });
        }

        Ok(String::from_utf8_lossy(&stdout).trim().to_owned())
    }

    pub fn run_json<T, I, S>(&self, program: &str, args: I, cwd: Option<&Path>) -> Result<Option<T>>
    where
        T: serde::de::DeserializeOwned,
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        let output = self.run(program, args, cwd)?;
        if output.is_empty() {
            return Ok(None);
        }

        serde_json::from_str(&output)
            .map(Some)
            .map_err(|source| Error::Json {
                source_name: program.to_owned(),
                source,
            })
    }
}

fn read_pipe<R: Read>(pipe: Option<R>) -> Vec<u8> {
    let mut bytes = Vec::new();
    if let Some(mut pipe) = pipe {
        let _ = pipe.read_to_end(&mut bytes);
    }
    bytes
}

fn display_command(program: &str, args: &[OsString]) -> String {
    std::iter::once(OsStr::new(program))
        .chain(args.iter().map(OsString::as_os_str))
        .map(|part| part.to_string_lossy())
        .collect::<Vec<_>>()
        .join(" ")
}
