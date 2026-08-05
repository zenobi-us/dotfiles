use std::cmp::Reverse;
use std::collections::BTreeMap;

use unicode_segmentation::UnicodeSegmentation;
use unicode_width::UnicodeWidthStr;

use crate::config::MaxRows;
use crate::pull_request::{CiStatus, PullRequest};

const SIDEBAR_SEPARATOR_WIDTH: usize = 3;
const INVISIBLE_CELL: &str = "⠀";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Attention {
    Blocked,
    Waiting,
    Open,
    Ready,
}

impl Attention {
    fn kind(self) -> &'static str {
        match self {
            Self::Blocked => "bad",
            Self::Waiting => "wait",
            Self::Open => "open",
            Self::Ready => "good",
        }
    }

    fn icon(self) -> &'static str {
        match self {
            Self::Blocked => "✕",
            Self::Waiting => "◷",
            Self::Open => "•",
            Self::Ready => "✓",
        }
    }

    fn priority(self) -> u8 {
        match self {
            Self::Blocked => 0,
            Self::Waiting => 1,
            Self::Open => 2,
            Self::Ready => 3,
        }
    }
}

#[derive(Clone, Debug)]
pub struct SidebarRow {
    pub title: String,
    pub attention: Attention,
}

#[derive(Clone, Debug)]
pub struct SidebarView {
    pub total_open: usize,
    pub rows: Vec<SidebarRow>,
}

impl SidebarView {
    pub fn from_pull_requests(pull_requests: &[PullRequest], max_rows: MaxRows) -> Option<Self> {
        let mut open: Vec<_> = pull_requests
            .iter()
            .filter(|pull_request| pull_request.state == "OPEN")
            .map(|pull_request| {
                (
                    classify(pull_request),
                    pull_request.updated_timestamp(),
                    normalize_title(&pull_request.title),
                )
            })
            .collect();
        if open.is_empty() {
            return None;
        }

        let total_open = open.len();
        open.sort_by_key(|(attention, updated_at, _)| (attention.priority(), Reverse(*updated_at)));
        let rows = open
            .into_iter()
            .take(max_rows.get())
            .map(|(attention, _, title)| SidebarRow { title, attention })
            .collect();
        Some(Self { total_open, rows })
    }

    pub fn metadata(&self, row_width: Option<usize>) -> BTreeMap<String, String> {
        let mut metadata =
            BTreeMap::from([("pr_count".to_owned(), format!("PRs {}", self.total_open))]);
        for (index, row) in self.rows.iter().enumerate() {
            let prefix = format!("pr_{}_{}", index + 1, row.attention.kind());
            metadata.insert(
                format!("{prefix}_title"),
                fit_title(&row.title, row.attention.icon(), row_width),
            );
            metadata.insert(format!("{prefix}_status"), row.attention.icon().to_owned());
        }
        metadata
    }
}

pub fn failed_metadata(row_width: Option<usize>) -> BTreeMap<String, String> {
    BTreeMap::from([
        (
            "pr_1_bad_title".to_owned(),
            fit_title("Refresh failed", "✕", row_width),
        ),
        ("pr_1_bad_status".to_owned(), "✕".to_owned()),
    ])
}

pub fn metadata_token_names() -> Vec<String> {
    let mut tokens = vec!["pr_count".to_owned()];
    for row in 1..=5 {
        for kind in ["bad", "wait", "good", "open"] {
            tokens.push(format!("pr_{row}_{kind}_title"));
            tokens.push(format!("pr_{row}_{kind}_status"));
        }
    }
    tokens
}

fn classify(pull_request: &PullRequest) -> Attention {
    if pull_request.merge_state_status.as_deref() == Some("DIRTY")
        || pull_request.ci_status() == CiStatus::Failing
        || pull_request.review_decision.as_deref() == Some("CHANGES_REQUESTED")
    {
        Attention::Blocked
    } else if pull_request.ci_status() == CiStatus::Pending
        || pull_request.review_decision.as_deref() == Some("REVIEW_REQUIRED")
    {
        Attention::Waiting
    } else if pull_request.ci_status() == CiStatus::Passing {
        Attention::Ready
    } else {
        Attention::Open
    }
}

fn normalize_title(title: &str) -> String {
    let title = title.split_whitespace().collect::<Vec<_>>().join(" ");
    if title.is_empty() {
        "Untitled".to_owned()
    } else {
        title
    }
}

fn fit_title(title: &str, reason: &str, row_width: Option<usize>) -> String {
    let Some(row_width) = row_width else {
        return title.to_owned();
    };
    if reason.is_empty() || row_width <= SIDEBAR_SEPARATOR_WIDTH {
        return title.to_owned();
    }

    let budget = row_width
        .saturating_sub(SIDEBAR_SEPARATOR_WIDTH + reason.width())
        .max(1);
    let title_width = title.width();
    if title_width < budget {
        return format!(
            "{title}{}",
            INVISIBLE_CELL.repeat(budget.saturating_sub(title_width))
        );
    }
    if title_width == budget {
        return title.to_owned();
    }
    if budget <= 3 {
        return truncate_to_width(title, budget);
    }

    format!("{}...", truncate_to_width(title, budget - 3))
}

fn truncate_to_width(value: &str, budget: usize) -> String {
    let mut used = 0;
    value
        .graphemes(true)
        .take_while(|grapheme| {
            let width = grapheme.width();
            if used + width > budget {
                false
            } else {
                used += width;
                true
            }
        })
        .collect()
}
