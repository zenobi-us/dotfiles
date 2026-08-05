use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("invalid mergr config: {0}")]
    InvalidConfig(String),

    #[error("could not read {path}: {source}")]
    ReadFile {
        path: PathBuf,
        source: std::io::Error,
    },

    #[error("could not write {path}: {source}")]
    WriteFile {
        path: PathBuf,
        source: std::io::Error,
    },

    #[error("could not parse JSON from {source_name}: {source}")]
    Json {
        source_name: String,
        source: serde_json::Error,
    },

    #[error("could not start {program}: {source}")]
    ProcessSpawn {
        program: String,
        source: std::io::Error,
    },

    #[error("{program} I/O failed: {source}")]
    ProcessIo {
        program: String,
        source: std::io::Error,
    },

    #[error("{program} timed out after {timeout_ms}ms")]
    ProcessTimeout { program: String, timeout_ms: u64 },

    #[error("{program} exited with status {status}: {stderr}")]
    ProcessFailed {
        program: String,
        status: String,
        stderr: String,
    },

    #[error("could not connect to Herdr at {path}: {source}")]
    HerdrConnect {
        path: PathBuf,
        source: std::io::Error,
    },

    #[error("Herdr socket I/O failed: {0}")]
    HerdrIo(std::io::Error),

    #[error("Herdr returned {code}: {message}")]
    HerdrResponse { code: String, message: String },

    #[error("Herdr returned an incomplete response")]
    HerdrIncompleteResponse,

    #[error("could not use mergr daemon socket at {path}: {source}")]
    DaemonIo {
        path: PathBuf,
        source: std::io::Error,
    },

    #[error("mergr daemon is not running at {0}; restart Herdr to start it")]
    DaemonUnavailable(PathBuf),

    #[error("mergr daemon rejected the request: {0}")]
    DaemonResponse(String),

    #[error("could not install daemon signal handler: {0}")]
    DaemonSignal(std::io::Error),

    #[error("could not resolve the home directory")]
    HomeDirectory,

    #[error("unknown command: {0}")]
    UnknownCommand(String),

    #[error("could not determine the GitHub repository name for {0}")]
    RepositoryName(PathBuf),
}

pub type Result<T> = std::result::Result<T, Error>;
