import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"

import {
  __resetTrustListCacheForTests,
  discoverHookConfigPaths,
  resolveProjectHookResolution,
} from "../core/config-paths.js"

interface Case {
  readonly name: string
  readonly run: () => { ok: boolean; detail?: string }
}

function withEnv<T>(key: string, value: string | undefined, run: () => T): T {
  const previous = process.env[key]
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
  try {
    return run()
  } finally {
    if (previous === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = previous
    }
  }
}

function createSandbox(name: string): string {
  return mkdtempSync(path.join(os.tmpdir(), `pi-hooks-${name}-`))
}

function runGit(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
}

function writeHooks(root: string, relativeDir = ".", fileName = "hooks.yaml"): string {
  const filePath = path.join(root, relativeDir, ".pi", fileName === "hooks.yaml" ? "hook" : "", fileName)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, "hooks:\n  - event: session.created\n    actions:\n      - notify: test\n", "utf8")
  return filePath
}

function writePreferredHooks(root: string, relativeDir = "."): string {
  return writeHooks(root, relativeDir, "hooks.yaml")
}

function writeFlatHooks(root: string, relativeDir = "."): string {
  const filePath = path.join(root, relativeDir, ".pi", "hooks.yaml")
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, "hooks:\n  - event: session.created\n    actions:\n      - notify: test\n", "utf8")
  return filePath
}

function writeTrustedProjects(homeDir: string, entries: string[]): void {
  const trustFile = path.join(homeDir, ".pi", "agent", "trusted-projects.json")
  mkdirSync(path.dirname(trustFile), { recursive: true })
  writeFileSync(trustFile, JSON.stringify(entries, null, 2) + "\n", "utf8")
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}

function samePaths(actual: string[], expected: string[]): boolean {
  return JSON.stringify(actual.map((entry) => realpathSync.native(entry))) === JSON.stringify(expected.map((entry) => realpathSync.native(entry)))
}

const cases: Case[] = [
  {
    name: "nested cwd under repo root with repo-root config loads",
    run: () => {
      const sandbox = createSandbox("repo-root")
      const homeDir = path.join(sandbox, "home")
      const repoDir = path.join(sandbox, "repo")
      const nestedDir = path.join(repoDir, "packages", "app")
      try {
        mkdirSync(nestedDir, { recursive: true })
        runGit(["init", repoDir], sandbox)
        const configPath = writePreferredHooks(repoDir)
        writeTrustedProjects(homeDir, [repoDir])
        const paths = withEnv("PI_YAML_HOOKS_TRUST_PROJECT", undefined, () =>
          discoverHookConfigPaths({ homeDir, projectDir: nestedDir }),
        )
        return JSON.stringify(paths) === JSON.stringify([configPath]) ? { ok: true } : { ok: false, detail: JSON.stringify(paths) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "nearest ancestor wins over repo root in monorepo-like case",
    run: () => {
      const sandbox = createSandbox("nearest")
      const homeDir = path.join(sandbox, "home")
      const repoDir = path.join(sandbox, "repo")
      const nestedDir = path.join(repoDir, "packages", "app")
      try {
        mkdirSync(nestedDir, { recursive: true })
        runGit(["init", repoDir], sandbox)
        writePreferredHooks(repoDir)
        const nestedConfig = writeFlatHooks(repoDir, path.join("packages", "app"))
        writeTrustedProjects(homeDir, [repoDir])
        const paths = discoverHookConfigPaths({ homeDir, projectDir: nestedDir })
        return JSON.stringify(paths) === JSON.stringify([nestedConfig]) ? { ok: true } : { ok: false, detail: JSON.stringify(paths) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "trust file containing repo/worktree root trusts nested cwd",
    run: () => {
      const sandbox = createSandbox("trust-root")
      const homeDir = path.join(sandbox, "home")
      const repoDir = path.join(sandbox, "repo")
      const nestedDir = path.join(repoDir, "packages", "app")
      try {
        mkdirSync(nestedDir, { recursive: true })
        runGit(["init", repoDir], sandbox)
        const configPath = writePreferredHooks(repoDir)
        writeTrustedProjects(homeDir, [repoDir])
        const resolution = resolveProjectHookResolution({ homeDir, projectDir: nestedDir })
        const paths = discoverHookConfigPaths({ homeDir, projectDir: nestedDir })
        return resolution?.trusted && samePaths(paths, [configPath])
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ resolution, paths }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "symlink realpath equivalence trusts correctly",
    run: () => {
      const sandbox = createSandbox("symlink")
      const homeDir = path.join(sandbox, "home")
      const realRepoDir = path.join(sandbox, "real-repo")
      const linkRepoDir = path.join(sandbox, "link-repo")
      const nestedLinkDir = path.join(linkRepoDir, "packages", "app")
      try {
        mkdirSync(path.join(realRepoDir, "packages", "app"), { recursive: true })
        runGit(["init", realRepoDir], sandbox)
        const configPath = writePreferredHooks(realRepoDir)
        symlinkSync(realRepoDir, linkRepoDir, "dir")
        writeTrustedProjects(homeDir, [realRepoDir])
        const resolution = resolveProjectHookResolution({ homeDir, projectDir: nestedLinkDir })
        const paths = discoverHookConfigPaths({ homeDir, projectDir: nestedLinkDir })
        return resolution?.trusted && samePaths(paths, [configPath])
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ resolution, paths }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "non-git upward search works",
    run: () => {
      const sandbox = createSandbox("nongit")
      const homeDir = path.join(sandbox, "home")
      const projectDir = path.join(sandbox, "workspace")
      const nestedDir = path.join(projectDir, "a", "b")
      try {
        mkdirSync(nestedDir, { recursive: true })
        const configPath = writePreferredHooks(projectDir)
        writeTrustedProjects(homeDir, [projectDir])
        const paths = discoverHookConfigPaths({ homeDir, projectDir: nestedDir })
        return JSON.stringify(paths) === JSON.stringify([configPath]) ? { ok: true } : { ok: false, detail: JSON.stringify(paths) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "nested repo boundary does not inherit parent repo config trust",
    run: () => {
      const sandbox = createSandbox("nested-repo")
      const homeDir = path.join(sandbox, "home")
      const parentRepoDir = path.join(sandbox, "parent")
      const childRepoDir = path.join(parentRepoDir, "packages", "child")
      const nestedChildDir = path.join(childRepoDir, "src")
      try {
        mkdirSync(nestedChildDir, { recursive: true })
        runGit(["init", parentRepoDir], sandbox)
        runGit(["init", childRepoDir], sandbox)
        writePreferredHooks(parentRepoDir)
        writeTrustedProjects(homeDir, [parentRepoDir])
        const paths = discoverHookConfigPaths({ homeDir, projectDir: nestedChildDir })
        const resolution = resolveProjectHookResolution({ homeDir, projectDir: nestedChildDir })
        return paths.length === 0 && resolution?.trusted === false
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ paths, resolution }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "no-git fallback still works",
    run: () => {
      const sandbox = createSandbox("env-trust")
      const homeDir = path.join(sandbox, "home")
      const projectDir = path.join(sandbox, "project")
      const nestedDir = path.join(projectDir, "deep")
      try {
        mkdirSync(nestedDir, { recursive: true })
        const configPath = writeFlatHooks(projectDir)
        const paths = withEnv("PI_YAML_HOOKS_TRUST_PROJECT", "1", () => discoverHookConfigPaths({ homeDir, projectDir: nestedDir }))
        return JSON.stringify(paths) === JSON.stringify([configPath]) ? { ok: true } : { ok: false, detail: JSON.stringify(paths) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "trust list parsed once per mtime change",
    run: () => {
      const sandbox = createSandbox("trust-cache")
      const homeDir = path.join(sandbox, "home")
      const projectDir = path.join(sandbox, "project")
      try {
        __resetTrustListCacheForTests()
        mkdirSync(projectDir, { recursive: true })
        writePreferredHooks(projectDir)
        writeTrustedProjects(homeDir, [projectDir])
        const trustFile = path.join(homeDir, ".pi", "agent", "trusted-projects.json")

        // Track every readFile invocation that targets the trust file.
        let trustFileReadCount = 0
        const tracker = (filePath: string): string => {
          if (filePath === trustFile) trustFileReadCount += 1
          return readFileSync(filePath, "utf8")
        }

        const opts = { homeDir, projectDir, readFile: tracker }
        const r1 = resolveProjectHookResolution(opts)
        const r2 = resolveProjectHookResolution(opts)
        const r3 = resolveProjectHookResolution(opts)
        const readsBeforeMutation = trustFileReadCount
        const trustedBefore = r1?.trusted && r2?.trusted && r3?.trusted

        // Mutate the trust file: change content + bump mtime so the
        // fingerprint changes and the cache invalidates.
        writeTrustedProjects(homeDir, [projectDir, "/some/other/project"])
        const future = new Date(Date.now() + 5_000)
        utimesSync(trustFile, future, future)

        const r4 = resolveProjectHookResolution(opts)
        const r5 = resolveProjectHookResolution(opts)
        const readsAfterMutation = trustFileReadCount - readsBeforeMutation
        const trustedAfter = r4?.trusted && r5?.trusted

        return trustedBefore && trustedAfter && readsBeforeMutation === 1 && readsAfterMutation === 1
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({ trustedBefore, trustedAfter, readsBeforeMutation, readsAfterMutation }),
            }
      } finally {
        __resetTrustListCacheForTests()
        cleanup(sandbox)
      }
    },
  },
  {
    name: "relative trust-list entries do not trust a project",
    run: () => {
      const sandbox = createSandbox("relative-trust")
      const homeDir = path.join(sandbox, "home")
      const projectDir = path.join(sandbox, "project")
      try {
        __resetTrustListCacheForTests()
        mkdirSync(projectDir, { recursive: true })
        writePreferredHooks(projectDir)
        writeTrustedProjects(homeDir, [".", "project"])
        const resolution = withEnv("PI_YAML_HOOKS_TRUST_PROJECT", undefined, () =>
          resolveProjectHookResolution({ homeDir, projectDir }),
        )
        const paths = discoverHookConfigPaths({ homeDir, projectDir })
        return resolution?.trusted === false && paths.length === 0
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ resolution, paths }) }
      } finally {
        __resetTrustListCacheForTests()
        cleanup(sandbox)
      }
    },
  },
  {
    name: "isProjectTrusted honours injected exists for virtual filesystems",
    run: () => {
      const sandbox = createSandbox("trust-exists")
      const homeDir = path.join(sandbox, "home")
      const projectDir = path.join(sandbox, "project")
      try {
        __resetTrustListCacheForTests()
        mkdirSync(projectDir, { recursive: true })
        writePreferredHooks(projectDir)

        // Note: no actual trust file on disk. We inject `exists` returning
        // true and `readFile` returning a synthetic trust list to confirm the
        // injected exists is honoured (rather than `existsSync` short-circuit).
        const fakeTrustFile = path.join(homeDir, ".pi", "agent", "trusted-projects.json")
        const projectConfigPath = path.join(projectDir, ".pi", "hook", "hooks.yaml")
        const resolution = resolveProjectHookResolution({
          homeDir,
          projectDir,
          exists: (filePath) => filePath === fakeTrustFile || filePath === projectConfigPath,
          readFile: (filePath) => {
            if (filePath === fakeTrustFile) return JSON.stringify([projectDir])
            return readFileSync(filePath, "utf8")
          },
        })

        return resolution?.trusted === true
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ resolution }) }
      } finally {
        __resetTrustListCacheForTests()
        cleanup(sandbox)
      }
    },
  },
]

export function main(): number {
  let failures = 0
  for (const c of cases) {
    try {
      const outcome = c.run()
      if (outcome.ok) {
        console.info(`PASS  ${c.name}`)
      } else {
        failures += 1
        console.info(`FAIL  ${c.name} -- ${outcome.detail ?? "no detail"}`)
      }
    } catch (error) {
      failures += 1
      console.info(`FAIL  ${c.name} -- threw ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.info(`\n${cases.length - failures}/${cases.length} passed`)
  return failures === 0 ? 0 : 1
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  /config-paths\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  process.exit(main())
}
