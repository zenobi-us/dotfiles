use std::collections::VecDeque;
use std::sync::Arc;
use std::time::Duration;

use tokio::signal::unix::{SignalKind, signal};
use tokio::sync::oneshot;
use tokio::task::JoinSet;
use tokio::time::{Instant, MissedTickBehavior};

use crate::adapters::herdr::HerdrClient;
use crate::app::{Action, App};
use crate::error::{Error, Result};
use crate::ipc::{self, BindOutcome, CommandResult};

const COMMAND_QUEUE_CAPACITY: usize = 64;
const HOUSEKEEPING_INTERVAL: Duration = Duration::from_secs(30);
const FALLBACK_REFRESH_INTERVAL_SECONDS: u32 = 60;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum Work {
    Refresh,
    Action(Action),
}

struct QueuedWork {
    work: Work,
    responses: Vec<oneshot::Sender<CommandResult>>,
}

struct ActiveWork {
    work: Work,
}

type WorkCompletion = (Work, Vec<oneshot::Sender<CommandResult>>, CommandResult);

pub async fn run() -> Result<()> {
    let (listener, _socket_guard) = match ipc::bind().await? {
        BindOutcome::Ready { listener, guard } => (listener, guard),
        BindOutcome::AlreadyRunning => return Ok(()),
    };
    let app = Arc::new(App::from_environment()?);
    let herdr = HerdrClient::from_environment()?;
    let mut timer_interval_seconds = match app.refresh_interval_seconds() {
        Ok(seconds) => seconds,
        Err(error) => {
            eprintln!("mergr: could not load timer configuration: {error}");
            FALLBACK_REFRESH_INTERVAL_SECONDS
        }
    };
    let (command_tx, mut command_rx) = tokio::sync::mpsc::channel(COMMAND_QUEUE_CAPACITY);
    let ipc_task = tokio::spawn(ipc::serve(listener, command_tx));

    let mut queue = VecDeque::new();
    enqueue(&mut queue, None, Work::Refresh, None);
    let mut workers = JoinSet::new();
    let mut active_work = start_next(&mut queue, &mut workers, &app);

    let refresh_sleep =
        tokio::time::sleep_until(periodic_deadline(timer_interval_seconds, Instant::now()));
    tokio::pin!(refresh_sleep);
    let mut maintenance_tick = tokio::time::interval(HOUSEKEEPING_INTERVAL);
    maintenance_tick.set_missed_tick_behavior(MissedTickBehavior::Skip);
    let mut heartbeat_jobs = JoinSet::new();
    let mut interrupt = signal(SignalKind::interrupt()).map_err(Error::DaemonSignal)?;
    let mut terminate = signal(SignalKind::terminate()).map_err(Error::DaemonSignal)?;

    loop {
        tokio::select! {
            incoming = command_rx.recv() => {
                let Some(incoming) = incoming else {
                    break;
                };
                enqueue(
                    &mut queue,
                    active_work.as_ref(),
                    Work::Action(incoming.action),
                    Some(incoming.response),
                );
            }
            completion = workers.join_next(), if !workers.is_empty() => {
                if let Some(completion) = completion {
                    let (_work, responses, result) = completion
                        .map_err(|error| Error::DaemonResponse(error.to_string()))?;
                    complete_responses(responses, &result);
                    if result.is_ok() {
                        refresh_sleep.as_mut().reset(periodic_deadline(
                            timer_interval_seconds,
                            Instant::now(),
                        ));
                    }
                    active_work = None;
                }
            }
            _ = refresh_sleep.as_mut() => {
                enqueue(
                    &mut queue,
                    active_work.as_ref(),
                    Work::Refresh,
                    None,
                );
                refresh_sleep.as_mut().reset(periodic_deadline(
                    timer_interval_seconds,
                    Instant::now(),
                ));
            }
            _ = maintenance_tick.tick() => {
                match app.refresh_interval_seconds() {
                    Ok(seconds) if seconds != timer_interval_seconds => {
                        timer_interval_seconds = seconds;
                        refresh_sleep
                            .as_mut()
                            .reset(periodic_deadline(seconds, Instant::now()));
                    }
                    Ok(_) => {}
                    Err(error) => eprintln!("mergr: could not reload timer configuration: {error}"),
                }
                if heartbeat_jobs.is_empty() {
                    let herdr = herdr.clone();
                    heartbeat_jobs.spawn_blocking(move || herdr.is_plugin_enabled());
                }
            }
            heartbeat = heartbeat_jobs.join_next(), if !heartbeat_jobs.is_empty() => {
                match heartbeat {
                    Some(Ok(Ok(true))) => {}
                    Some(Ok(Ok(false))) => break,
                    Some(Ok(Err(error))) => {
                        eprintln!("mergr: daemon heartbeat failed: {error}");
                    }
                    Some(Err(error)) => {
                        eprintln!("mergr: daemon heartbeat task failed: {error}");
                    }
                    None => {}
                }
            }
            _ = interrupt.recv() => break,
            _ = terminate.recv() => break,
        }
        if active_work.is_none() {
            active_work = start_next(&mut queue, &mut workers, &app);
        }
    }

    ipc_task.abort();
    workers.shutdown().await;
    heartbeat_jobs.shutdown().await;
    Ok(())
}

fn enqueue(
    queue: &mut VecDeque<QueuedWork>,
    active: Option<&ActiveWork>,
    work: Work,
    response: Option<oneshot::Sender<CommandResult>>,
) {
    if work == Work::Refresh
        && (active.is_some_and(|active| active.work == Work::Refresh)
            || queue.iter().any(|queued| queued.work == Work::Refresh))
    {
        return;
    }

    queue.push_back(QueuedWork {
        work,
        responses: response.into_iter().collect(),
    });
}

fn start_next(
    queue: &mut VecDeque<QueuedWork>,
    workers: &mut JoinSet<WorkCompletion>,
    app: &Arc<App>,
) -> Option<ActiveWork> {
    if !workers.is_empty() {
        return None;
    }
    let work = queue.pop_front()?;
    let active = ActiveWork { work: work.work };
    let app = Arc::clone(app);
    workers.spawn_blocking(move || {
        let result = match work.work {
            Work::Refresh => app
                .refresh_all()
                .map(|()| "refresh complete".to_owned())
                .map_err(|error| error.to_string()),
            Work::Action(action) => app
                .run(action)
                .map(|()| format!("{} complete", action.as_str()))
                .map_err(|error| error.to_string()),
        };
        (work.work, work.responses, result)
    });
    Some(active)
}

fn complete_responses(responses: Vec<oneshot::Sender<CommandResult>>, result: &CommandResult) {
    for response in responses {
        let result = match result {
            Ok(message) => Ok(message.clone()),
            Err(message) => Err(message.clone()),
        };
        let _ = response.send(result);
    }
}

fn periodic_deadline(seconds: u32, now: Instant) -> Instant {
    now + Duration::from_secs(u64::from(seconds))
}
