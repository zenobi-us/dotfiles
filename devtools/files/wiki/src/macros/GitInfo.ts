
export function getGitCommitHash() {
  const { stdout } = Bun.spawnSync({
    cmd: ["git", "rev-parse", "HEAD"],
    stdout: "pipe",
  });

  return stdout.toString();
}

export function getGitTag() {
  const { stdout } = Bun.spawnSync({
    cmd: ["git", "describe", "--tags", "--abbrev=0"],
    stdout: "pipe",
  });

  return stdout.toString().trim();
}

export function getGitBranch() {
  const { stdout } = Bun.spawnSync({
    cmd: ["git", "rev-parse", "--abbrev-ref", "HEAD"],
    stdout: "pipe",
  });

  return stdout.toString().trim();
}

