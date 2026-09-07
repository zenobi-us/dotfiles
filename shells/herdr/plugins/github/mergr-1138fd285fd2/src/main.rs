use std::process::ExitCode;

use mergr::Action;

#[tokio::main]
async fn main() -> ExitCode {
    match run().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("mergr: {error}");
            ExitCode::FAILURE
        }
    }
}

async fn run() -> mergr::Result<()> {
    let command = std::env::args()
        .nth(1)
        .ok_or_else(|| mergr::Error::UnknownCommand("<missing>".to_owned()))?;

    if command == "daemon" {
        return mergr::daemon::run().await;
    }

    let action = command.parse::<Action>()?;
    let message = mergr::ipc::invoke(action).await?;
    println!("mergr: {message}");
    Ok(())
}
