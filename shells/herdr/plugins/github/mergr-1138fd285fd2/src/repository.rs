use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::adapters::git::GitClient;
use crate::adapters::process::ProcessRunner;
use crate::error::{Error, Result};

#[derive(Clone, Debug)]
pub struct Repository {
    pub slug: String,
    pub root: PathBuf,
}

#[derive(Clone, Debug)]
pub struct RepositoryResolver {
    git: GitClient,
    runner: ProcessRunner,
}

impl RepositoryResolver {
    pub fn new(git: GitClient, runner: ProcessRunner) -> Self {
        Self { git, runner }
    }

    pub fn resolve(&self, root: &Path) -> Result<Repository> {
        if let Ok(remote_url) = self.git.origin_url(root)
            && let Some(slug) = parse_github_remote(&remote_url)
        {
            return Ok(Repository {
                slug,
                root: root.to_path_buf(),
            });
        }

        let repository = self
            .runner
            .run_json::<RepositoryView, _, _>(
                "gh",
                ["repo", "view", "--json", "nameWithOwner"],
                Some(root),
            )?
            .unwrap_or_default();
        if repository.name_with_owner.is_empty() {
            Err(Error::RepositoryName(root.to_path_buf()))
        } else {
            Ok(Repository {
                slug: repository.name_with_owner,
                root: root.to_path_buf(),
            })
        }
    }
}

pub fn parse_github_remote(value: &str) -> Option<String> {
    let trimmed = value.trim();
    let path = if let Some(path) = trimmed.strip_prefix("git@github.com:") {
        path
    } else if let Some(path) = trimmed.strip_prefix("ssh://git@github.com/") {
        path
    } else if let Some(path) = trimmed.strip_prefix("https://github.com/") {
        path
    } else {
        trimmed.strip_prefix("http://github.com/")?
    };

    let path = path.strip_suffix('/').unwrap_or(path);
    let path = path.strip_suffix(".git").unwrap_or(path);
    let mut components = path.split('/');
    let owner = components.next()?;
    let repository = components.next()?;
    if owner.is_empty() || repository.is_empty() || components.next().is_some() {
        return None;
    }
    Some(format!("{owner}/{repository}"))
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RepositoryView {
    name_with_owner: String,
}
