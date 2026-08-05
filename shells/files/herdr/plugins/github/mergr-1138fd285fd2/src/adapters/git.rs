use std::path::Path;

use crate::adapters::process::ProcessRunner;
use crate::error::Result;

#[derive(Clone, Debug)]
pub struct GitClient {
    runner: ProcessRunner,
}

impl GitClient {
    pub fn new(runner: ProcessRunner) -> Self {
        Self { runner }
    }

    pub fn has_remote(&self, root: &Path) -> bool {
        self.runner
            .run("git", ["-C", &root.to_string_lossy(), "remote"], None)
            .is_ok_and(|output| !output.is_empty())
    }

    pub fn origin_url(&self, root: &Path) -> Result<String> {
        self.runner.run(
            "git",
            ["-C", &root.to_string_lossy(), "remote", "get-url", "origin"],
            None,
        )
    }

    pub fn current_branch(&self, root: &Path) -> Result<Option<String>> {
        let branch = self.runner.run(
            "git",
            ["-C", &root.to_string_lossy(), "branch", "--show-current"],
            None,
        )?;
        Ok((!branch.is_empty()).then_some(branch))
    }
}
