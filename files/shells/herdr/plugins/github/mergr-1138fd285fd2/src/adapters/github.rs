use std::path::Path;

use serde::Deserialize;

use crate::adapters::process::ProcessRunner;
use crate::error::Result;
use crate::pull_request::{Check, PullRequest};

const PR_FIELDS: &str = "title,state,reviewDecision,mergeStateStatus,statusCheckRollup,updatedAt";

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct PullRequestQuery {
    pub repository: String,
    pub author: Option<String>,
    pub head: Option<String>,
}

#[derive(Clone, Debug)]
pub struct GithubClient {
    runner: ProcessRunner,
}

impl GithubClient {
    pub fn new(runner: ProcessRunner) -> Self {
        Self { runner }
    }

    pub fn pull_requests(&self, query: &PullRequestQuery, cwd: &Path) -> Result<Vec<PullRequest>> {
        let mut args = vec![
            "pr".to_owned(),
            "list".to_owned(),
            "--repo".to_owned(),
            query.repository.clone(),
            "--limit".to_owned(),
            "50".to_owned(),
            "--json".to_owned(),
            PR_FIELDS.to_owned(),
        ];
        if let Some(author) = &query.author {
            args.extend(["--author".to_owned(), author.clone()]);
        }
        if let Some(head) = &query.head {
            args.extend(["--head".to_owned(), head.clone()]);
        }

        let pull_requests = self
            .runner
            .run_json::<Vec<GithubPullRequest>, _, _>("gh", &args, Some(cwd))?
            .unwrap_or_default();
        Ok(pull_requests.into_iter().map(Into::into).collect())
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GithubPullRequest {
    title: String,
    state: String,
    review_decision: Option<String>,
    merge_state_status: Option<String>,
    #[serde(default)]
    status_check_rollup: Option<Vec<GithubCheck>>,
    updated_at: Option<String>,
}

#[derive(Deserialize)]
struct GithubCheck {
    conclusion: Option<String>,
    status: Option<String>,
    state: Option<String>,
}

impl From<GithubPullRequest> for PullRequest {
    fn from(value: GithubPullRequest) -> Self {
        Self {
            title: value.title,
            state: value.state,
            review_decision: value.review_decision,
            merge_state_status: value.merge_state_status,
            checks: value
                .status_check_rollup
                .unwrap_or_default()
                .into_iter()
                .map(|check| Check {
                    conclusion: check.conclusion,
                    status: check.status,
                    state: check.state,
                })
                .collect(),
            updated_at: value.updated_at,
        }
    }
}
