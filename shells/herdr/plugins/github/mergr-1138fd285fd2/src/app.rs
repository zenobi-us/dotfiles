use std::collections::{HashMap, VecDeque};
use std::env;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use crate::adapters::git::GitClient;
use crate::adapters::github::{GithubClient, PullRequestQuery};
use crate::adapters::herdr::HerdrClient;
use crate::adapters::process::ProcessRunner;
use crate::config::{AuthorFilter, BranchFilter, Config, ConfigStore, RepositorySettings};
use crate::context::{WorkspaceTarget, all_targets};
use crate::error::{Error, Result};
use crate::pull_request::PullRequest;
use crate::repository::{Repository, RepositoryResolver};
use crate::sidebar::{SidebarView, failed_metadata};

const REFRESH_CONCURRENCY: usize = 5;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Action {
    FilterCycle,
}

impl FromStr for Action {
    type Err = Error;

    fn from_str(value: &str) -> Result<Self> {
        match value {
            "filter-cycle" => Ok(Self::FilterCycle),
            _ => Err(Error::UnknownCommand(value.to_owned())),
        }
    }
}

impl Action {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::FilterCycle => "filter-cycle",
        }
    }
}

pub struct App {
    config: ConfigStore,
    git: GitClient,
    github: GithubClient,
    herdr: HerdrClient,
    repositories: RepositoryResolver,
    debug: bool,
}

impl App {
    pub fn from_environment() -> Result<Self> {
        let runner = ProcessRunner::new(Duration::from_secs(20));
        let git = GitClient::new(runner.clone());
        let repositories = RepositoryResolver::new(git.clone(), runner.clone());
        let github = GithubClient::new(runner);
        let herdr = HerdrClient::from_environment()?;
        let config = ConfigStore::new(config_directory()?);
        Ok(Self {
            config,
            git,
            github,
            herdr,
            repositories,
            debug: env::var("MERGR_DEBUG").is_ok_and(|value| value == "1"),
        })
    }

    pub fn run(&self, action: Action) -> Result<()> {
        match action {
            Action::FilterCycle => self.cycle_filter(),
        }
    }

    pub fn refresh_all(&self) -> Result<()> {
        self.refresh()
    }

    pub fn refresh_interval_seconds(&self) -> Result<u32> {
        Ok(self.config.load()?.refresh_interval_seconds.get())
    }

    fn cycle_filter(&self) -> Result<()> {
        let mut config = self.config.load()?;
        let (label, author, branch) = match (&config.filters.author, config.filters.branch) {
            (AuthorFilter::Any, BranchFilter::All) => {
                ("authored by me", AuthorFilter::Me, BranchFilter::All)
            }
            (AuthorFilter::Me, BranchFilter::All) => {
                ("current branch", AuthorFilter::Any, BranchFilter::Current)
            }
            _ => ("all PRs", AuthorFilter::Any, BranchFilter::All),
        };
        config.filters.author = author;
        config.filters.branch = branch;
        self.config.save(&config)?;
        self.refresh()?;
        let _ = self.herdr.notify("mergr filter", label);
        println!("mergr filter: {label}");
        Ok(())
    }

    fn refresh(&self) -> Result<()> {
        let snapshot = self.herdr.snapshot()?;
        let targets = all_targets(&snapshot);
        let config = self.config.load()?;
        let mut prepared = Vec::new();

        for outcome in prepare_targets(
            self.herdr.clone(),
            self.git.clone(),
            self.repositories.clone(),
            config,
            targets,
        ) {
            match outcome {
                PreparationOutcome::Skip => {}
                PreparationOutcome::Clear(target) => self.clear(&target),
                PreparationOutcome::Failed(target, message) => {
                    self.fail_message(&target, &message);
                }
                PreparationOutcome::Ready(prepared_target) => prepared.push(prepared_target),
            }
        }

        let queries = distinct_queries(&prepared);
        let query_count = queries.len();
        let outcomes = execute_queries(self.github.clone(), queries);
        for prepared_target in &prepared {
            match outcomes.get(&prepared_target.query) {
                Some(QueryOutcome::Ready(pull_requests)) => {
                    let metadata = SidebarView::from_pull_requests(
                        pull_requests,
                        prepared_target.settings.max_rows,
                    )
                    .map(|view| view.metadata(prepared_target.target.row_width))
                    .unwrap_or_default();
                    if metadata != prepared_target.target.pull_request_metadata
                        && let Err(error) = self
                            .herdr
                            .report_metadata(&prepared_target.target.workspace_id, &metadata)
                    {
                        eprintln!(
                            "mergr: could not report sidebar for {}: {error}",
                            prepared_target.target.workspace_id
                        );
                    }
                }
                Some(QueryOutcome::Failed(message)) => {
                    self.fail_message(&prepared_target.target, message);
                }
                None => {
                    self.fail_message(
                        &prepared_target.target,
                        "internal error: GitHub query result missing",
                    );
                }
            }
        }

        if self.debug {
            eprintln!(
                "mergr: refreshed {} workspace(s) with {} distinct GitHub query/queries",
                prepared.len(),
                query_count
            );
        }
        Ok(())
    }

    fn clear(&self, target: &WorkspaceTarget) {
        if !target.pull_request_metadata.is_empty()
            && let Err(error) = self
                .herdr
                .report_metadata(&target.workspace_id, &Default::default())
        {
            eprintln!(
                "mergr: could not clear sidebar for {}: {error}",
                target.workspace_id
            );
        }
    }

    fn fail_message(&self, target: &WorkspaceTarget, message: &str) {
        let metadata = failed_metadata(target.row_width);
        if metadata != target.pull_request_metadata
            && let Err(error) = self.herdr.report_metadata(&target.workspace_id, &metadata)
        {
            eprintln!(
                "mergr: could not report failure for {}: {error}",
                target.workspace_id
            );
        }
        eprintln!("mergr: {message}");
    }
}

struct PreparedTarget {
    target: WorkspaceTarget,
    repository: Repository,
    settings: RepositorySettings,
    query: PullRequestQuery,
}

enum PreparationOutcome {
    Skip,
    Clear(WorkspaceTarget),
    Failed(WorkspaceTarget, String),
    Ready(PreparedTarget),
}

struct QueryJob {
    query: PullRequestQuery,
    cwd: PathBuf,
}

#[derive(Debug)]
enum QueryOutcome {
    Ready(Vec<PullRequest>),
    Failed(String),
}

fn distinct_queries(prepared: &[PreparedTarget]) -> Vec<QueryJob> {
    let mut queries = HashMap::new();
    for target in prepared {
        queries
            .entry(target.query.clone())
            .or_insert_with(|| target.repository.root.clone());
    }
    queries
        .into_iter()
        .map(|(query, cwd)| QueryJob { query, cwd })
        .collect()
}

fn prepare_targets(
    herdr: HerdrClient,
    git: GitClient,
    repositories: RepositoryResolver,
    config: Config,
    targets: Vec<WorkspaceTarget>,
) -> Vec<PreparationOutcome> {
    if targets.is_empty() {
        return Vec::new();
    }

    let worker_count = REFRESH_CONCURRENCY.min(targets.len());
    let queue = Arc::new(Mutex::new(VecDeque::from(targets)));
    let outcomes = Arc::new(Mutex::new(Vec::new()));
    let config = Arc::new(config);
    thread::scope(|scope| {
        for _ in 0..worker_count {
            let queue = Arc::clone(&queue);
            let outcomes = Arc::clone(&outcomes);
            let config = Arc::clone(&config);
            let herdr = herdr.clone();
            let git = git.clone();
            let repositories = repositories.clone();
            scope.spawn(move || {
                loop {
                    let target = queue.lock().expect("target queue poisoned").pop_front();
                    let Some(target) = target else {
                        break;
                    };
                    let outcome = prepare_target(&herdr, &git, &repositories, &config, target);
                    outcomes
                        .lock()
                        .expect("preparation outcome list poisoned")
                        .push(outcome);
                }
            });
        }
    });

    Arc::try_unwrap(outcomes)
        .unwrap_or_else(|_| panic!("preparation outcome list still shared"))
        .into_inner()
        .expect("preparation outcome list poisoned")
}

fn prepare_target(
    herdr: &HerdrClient,
    git: &GitClient,
    repositories: &RepositoryResolver,
    config: &Config,
    target: WorkspaceTarget,
) -> PreparationOutcome {
    let Some(cwd) = target.cwd.as_deref().map(PathBuf::from) else {
        return PreparationOutcome::Skip;
    };
    let root = match herdr.worktree_root(&cwd) {
        Ok(Some(root)) => root,
        Ok(None) => return PreparationOutcome::Clear(target),
        Err(error) => return PreparationOutcome::Failed(target, error.to_string()),
    };
    if !git.has_remote(&root) {
        return PreparationOutcome::Clear(target);
    }

    let repository = match repositories.resolve(&root) {
        Ok(repository) => repository,
        Err(error) => return PreparationOutcome::Failed(target, error.to_string()),
    };
    let settings = config.settings();
    let head = if settings.branch == BranchFilter::Current {
        match git.current_branch(&repository.root) {
            Ok(Some(branch)) => Some(branch),
            Ok(None) => return PreparationOutcome::Clear(target),
            Err(error) => return PreparationOutcome::Failed(target, error.to_string()),
        }
    } else {
        None
    };
    let query = PullRequestQuery {
        repository: repository.slug.clone(),
        author: match &settings.author {
            AuthorFilter::Any => None,
            AuthorFilter::Me => Some("@me".to_owned()),
            AuthorFilter::User(username) => Some(username.clone()),
        },
        head,
    };

    PreparationOutcome::Ready(PreparedTarget {
        target,
        repository,
        settings,
        query,
    })
}

fn execute_queries(
    github: GithubClient,
    queries: Vec<QueryJob>,
) -> HashMap<PullRequestQuery, QueryOutcome> {
    if queries.is_empty() {
        return HashMap::new();
    }

    let worker_count = REFRESH_CONCURRENCY.min(queries.len());
    let queue = Arc::new(Mutex::new(VecDeque::from(queries)));
    let outcomes = Arc::new(Mutex::new(HashMap::new()));
    thread::scope(|scope| {
        for _ in 0..worker_count {
            let queue = Arc::clone(&queue);
            let outcomes = Arc::clone(&outcomes);
            let github = github.clone();
            scope.spawn(move || {
                loop {
                    let job = queue.lock().expect("query queue poisoned").pop_front();
                    let Some(job) = job else {
                        break;
                    };
                    let outcome = match github.pull_requests(&job.query, &job.cwd) {
                        Ok(pull_requests) => QueryOutcome::Ready(pull_requests),
                        Err(error) => QueryOutcome::Failed(error.to_string()),
                    };
                    outcomes
                        .lock()
                        .expect("query outcome map poisoned")
                        .insert(job.query, outcome);
                }
            });
        }
    });

    Arc::try_unwrap(outcomes)
        .expect("query outcome map still shared")
        .into_inner()
        .expect("query outcome map poisoned")
}

fn config_directory() -> Result<PathBuf> {
    if let Some(directory) = env::var_os("HERDR_PLUGIN_CONFIG_DIR") {
        return Ok(PathBuf::from(directory));
    }
    let home = env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or(Error::HomeDirectory)?;
    let plugin_id = env::var("HERDR_PLUGIN_ID").unwrap_or_else(|_| "mergr".to_owned());
    Ok(home
        .join(".config")
        .join("herdr")
        .join("plugins")
        .join("config")
        .join(plugin_id))
}
