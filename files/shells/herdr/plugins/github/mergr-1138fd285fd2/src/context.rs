use std::collections::BTreeMap;

use serde::Deserialize;

use crate::sidebar::metadata_token_names;

#[derive(Clone, Debug, Default, Deserialize)]
pub struct PaneInfo {
    pub workspace_id: Option<String>,
    pub tab_id: Option<String>,
    pub focused: Option<bool>,
    pub cwd: Option<String>,
    pub foreground_cwd: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
pub struct WorkspaceInfo {
    pub workspace_id: Option<String>,
    pub active_tab_id: Option<String>,
    pub cwd: Option<String>,
    #[serde(default)]
    pub tokens: BTreeMap<String, String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
pub struct LayoutRect {
    pub x: Option<u16>,
    pub y: Option<u16>,
    pub width: Option<u16>,
    pub height: Option<u16>,
}

#[derive(Clone, Debug, Default, Deserialize)]
pub struct LayoutInfo {
    pub workspace_id: Option<String>,
    pub area: Option<LayoutRect>,
}

#[derive(Clone, Debug, Default, Deserialize)]
pub struct Snapshot {
    #[serde(default)]
    pub workspaces: Vec<WorkspaceInfo>,
    #[serde(default)]
    pub panes: Vec<PaneInfo>,
    #[serde(default)]
    pub layouts: Vec<LayoutInfo>,
}

#[derive(Clone, Debug)]
pub struct WorkspaceTarget {
    pub workspace_id: String,
    pub cwd: Option<String>,
    pub row_width: Option<usize>,
    pub pull_request_metadata: BTreeMap<String, String>,
}

pub fn all_targets(snapshot: &Snapshot) -> Vec<WorkspaceTarget> {
    let metadata_token_names = metadata_token_names();
    snapshot
        .workspaces
        .iter()
        .filter_map(|workspace| {
            let workspace_id = workspace.workspace_id.clone()?;
            let cwd = workspace_cwd(snapshot, &workspace_id, workspace.active_tab_id.as_deref())
                .or_else(|| workspace.cwd.clone());
            Some(WorkspaceTarget {
                row_width: sidebar_row_width(snapshot, &workspace_id),
                workspace_id,
                cwd,
                pull_request_metadata: workspace.pull_request_metadata(&metadata_token_names),
            })
        })
        .collect()
}

impl WorkspaceInfo {
    fn pull_request_metadata(&self, metadata_token_names: &[String]) -> BTreeMap<String, String> {
        self.tokens
            .iter()
            .filter(|(name, _)| metadata_token_names.contains(name))
            .map(|(name, value)| (name.clone(), value.clone()))
            .collect()
    }
}

fn workspace_cwd(
    snapshot: &Snapshot,
    workspace_id: &str,
    active_tab_id: Option<&str>,
) -> Option<String> {
    let panes: Vec<_> = snapshot
        .panes
        .iter()
        .filter(|pane| pane.workspace_id.as_deref() == Some(workspace_id))
        .collect();
    let pane = panes
        .iter()
        .copied()
        .find(|pane| pane.focused == Some(true))
        .or_else(|| {
            active_tab_id.and_then(|tab_id| {
                panes
                    .iter()
                    .copied()
                    .find(|pane| pane.tab_id.as_deref() == Some(tab_id))
            })
        })
        .or_else(|| panes.first().copied())?;
    pane.cwd.clone().or_else(|| pane.foreground_cwd.clone())
}

fn sidebar_row_width(snapshot: &Snapshot, workspace_id: &str) -> Option<usize> {
    let sidebar_width = snapshot
        .layouts
        .iter()
        .find(|layout| layout.workspace_id.as_deref() == Some(workspace_id))
        .and_then(|layout| layout.area.as_ref())
        .and_then(|area| area.x)?;
    (sidebar_width > 5).then(|| usize::from(sidebar_width - 5))
}
