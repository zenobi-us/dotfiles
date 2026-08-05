use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CiStatus {
    None,
    Failing,
    Pending,
    Passing,
}

#[derive(Clone, Debug)]
pub struct Check {
    pub conclusion: Option<String>,
    pub status: Option<String>,
    pub state: Option<String>,
}

#[derive(Clone, Debug)]
pub struct PullRequest {
    pub title: String,
    pub state: String,
    pub review_decision: Option<String>,
    pub merge_state_status: Option<String>,
    pub checks: Vec<Check>,
    pub updated_at: Option<String>,
}

impl PullRequest {
    pub fn ci_status(&self) -> CiStatus {
        check_status(&self.checks)
    }

    pub fn updated_timestamp(&self) -> i128 {
        self.updated_at
            .as_deref()
            .and_then(|value| OffsetDateTime::parse(value, &Rfc3339).ok())
            .map_or(0, OffsetDateTime::unix_timestamp_nanos)
    }
}

pub fn check_status(checks: &[Check]) -> CiStatus {
    if checks.is_empty() {
        return CiStatus::None;
    }

    if checks.iter().any(|check| {
        check.conclusion.as_deref().is_some_and(is_failing_status)
            || check.state.as_deref().is_some_and(is_failing_status)
    }) {
        return CiStatus::Failing;
    }

    if checks.iter().any(|check| {
        check.status.as_deref().is_some_and(is_pending_status)
            || check.state.as_deref().is_some_and(is_pending_status)
    }) {
        return CiStatus::Pending;
    }

    CiStatus::Passing
}

fn is_failing_status(value: &str) -> bool {
    matches!(
        value,
        "ACTION_REQUIRED"
            | "CANCELLED"
            | "ERROR"
            | "FAILURE"
            | "STALE"
            | "STARTUP_FAILURE"
            | "TIMED_OUT"
    )
}

fn is_pending_status(value: &str) -> bool {
    matches!(
        value,
        "EXPECTED" | "IN_PROGRESS" | "PENDING" | "QUEUED" | "REQUESTED" | "WAITING"
    )
}
