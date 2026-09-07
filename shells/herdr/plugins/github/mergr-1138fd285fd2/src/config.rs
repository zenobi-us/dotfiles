use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Deserializer, Serialize, Serializer};

use crate::error::{Error, Result};

const DEFAULT_MAX_ROWS: u8 = 3;
const DEFAULT_REFRESH_INTERVAL_SECONDS: u32 = 60;
const MAX_REFRESH_INTERVAL_SECONDS: u32 = 86_400;

#[derive(Clone, Debug, Default, Eq, Hash, PartialEq)]
pub enum AuthorFilter {
    Any,
    #[default]
    Me,
    User(String),
}

impl AuthorFilter {
    pub fn parse(value: &str) -> Result<Self> {
        Self::from_config_value(value).map_err(Error::InvalidConfig)
    }

    fn from_config_value(value: &str) -> std::result::Result<Self, String> {
        match value {
            "any" => Ok(Self::Any),
            "@me" => Ok(Self::Me),
            username if valid_github_login(username) => Ok(Self::User(username.to_owned())),
            _ => Err("filters.author must be \"any\", \"@me\", or a GitHub username".to_owned()),
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Any => "any",
            Self::Me => "@me",
            Self::User(username) => username,
        }
    }
}

impl Serialize for AuthorFilter {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for AuthorFilter {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        Self::from_config_value(&value).map_err(serde::de::Error::custom)
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BranchFilter {
    #[default]
    All,
    Current,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct MaxRows(u8);

impl MaxRows {
    pub fn new(value: u8) -> Result<Self> {
        Self::from_config_value(value).map_err(Error::InvalidConfig)
    }

    fn from_config_value(value: u8) -> std::result::Result<Self, String> {
        if (1..=5).contains(&value) {
            Ok(Self(value))
        } else {
            Err("maxRows must be an integer from 1 to 5".to_owned())
        }
    }

    pub fn get(self) -> usize {
        usize::from(self.0)
    }
}

impl Default for MaxRows {
    fn default() -> Self {
        Self(DEFAULT_MAX_ROWS)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RefreshIntervalSeconds(u32);

impl RefreshIntervalSeconds {
    fn from_config_value(value: u32) -> std::result::Result<Self, String> {
        if (1..=MAX_REFRESH_INTERVAL_SECONDS).contains(&value) {
            Ok(Self(value))
        } else {
            Err(format!(
                "refreshIntervalSeconds must be an integer from 1 to {MAX_REFRESH_INTERVAL_SECONDS}"
            ))
        }
    }

    pub fn get(self) -> u32 {
        self.0
    }
}

impl Default for RefreshIntervalSeconds {
    fn default() -> Self {
        Self(DEFAULT_REFRESH_INTERVAL_SECONDS)
    }
}

impl Serialize for RefreshIntervalSeconds {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u32(self.0)
    }
}

impl<'de> Deserialize<'de> for RefreshIntervalSeconds {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = u32::deserialize(deserializer)?;
        Self::from_config_value(value).map_err(serde::de::Error::custom)
    }
}

impl Serialize for MaxRows {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u8(self.0)
    }
}

impl<'de> Deserialize<'de> for MaxRows {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = u8::deserialize(deserializer)?;
        Self::from_config_value(value).map_err(serde::de::Error::custom)
    }
}

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(default, deny_unknown_fields)]
pub struct Filters {
    pub author: AuthorFilter,
    pub branch: BranchFilter,
}

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Config {
    #[serde(rename = "$schema", skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    pub max_rows: MaxRows,
    pub refresh_interval_seconds: RefreshIntervalSeconds,
    pub filters: Filters,
}

impl Config {
    pub fn settings(&self) -> RepositorySettings {
        RepositorySettings {
            max_rows: self.max_rows,
            author: self.filters.author.clone(),
            branch: self.filters.branch,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RepositorySettings {
    pub max_rows: MaxRows,
    pub author: AuthorFilter,
    pub branch: BranchFilter,
}

#[derive(Clone, Debug)]
pub struct ConfigStore {
    path: PathBuf,
}

impl ConfigStore {
    pub fn new(directory: PathBuf) -> Self {
        Self {
            path: directory.join("config.json"),
        }
    }

    pub fn load(&self) -> Result<Config> {
        let contents = match fs::read_to_string(&self.path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(Config::default());
            }
            Err(source) => {
                return Err(Error::ReadFile {
                    path: self.path.clone(),
                    source,
                });
            }
        };

        serde_json::from_str(&contents).map_err(|source| Error::InvalidConfig(source.to_string()))
    }

    pub fn save(&self, config: &Config) -> Result<()> {
        let directory = self.path.parent().unwrap_or_else(|| Path::new("."));
        fs::create_dir_all(directory).map_err(|source| Error::WriteFile {
            path: directory.to_path_buf(),
            source,
        })?;

        let temporary = self
            .path
            .with_extension(format!("{}.tmp", std::process::id()));
        let bytes = serde_json::to_vec_pretty(config)
            .map_err(|source| Error::InvalidConfig(source.to_string()))?;
        let mut file = fs::File::create(&temporary).map_err(|source| Error::WriteFile {
            path: temporary.clone(),
            source,
        })?;
        file.write_all(&bytes)
            .and_then(|()| file.write_all(b"\n"))
            .and_then(|()| file.sync_all())
            .map_err(|source| Error::WriteFile {
                path: temporary.clone(),
                source,
            })?;
        fs::rename(&temporary, &self.path).map_err(|source| Error::WriteFile {
            path: self.path.clone(),
            source,
        })
    }
}

fn valid_github_login(value: &str) -> bool {
    let length = value.len();
    (1..=39).contains(&length)
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
        && value
            .as_bytes()
            .first()
            .is_some_and(u8::is_ascii_alphanumeric)
}
