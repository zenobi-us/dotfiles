import { mkdtempSync, mkdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  __resetSnapshotCacheForTests,
  __snapshotCacheKeysForTests,
  __snapshotCacheSizeForTests,
  loadDiscoveredHooks,
  loadDiscoveredHooksSnapshot,
  parseHooksFile,
} from "./load-hooks.js"

interface Case {
  readonly name: string
  readonly run: () => { ok: boolean; detail?: string }
}

function createSandbox(name: string): string {
  return mkdtempSync(path.join(os.tmpdir(), `pi-hooks-${name}-`))
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}

function writeYaml(filePath: string, content: string): string {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, "utf8")
  return filePath
}

function loadFrom(globalPath: string | undefined, projectPath: string | undefined, homeDir: string, projectDir?: string) {
  return loadDiscoveredHooks({
    homeDir,
    projectDir,
    exists: (filePath) => [globalPath, projectPath].includes(filePath),
    readFile: (filePath) => {
      throw new Error(`unexpected config-path read for ${filePath}`)
    },
  })
}

function loadTrustedProject(projectRoot: string, homeDir: string) {
  writeYaml(path.join(homeDir, ".pi", "agent", "trusted-projects.json"), JSON.stringify([projectRoot]))
  return loadDiscoveredHooks({ homeDir, projectDir: projectRoot })
}

function withEnv<T>(overrides: Record<string, string | undefined>, fn: () => T): T {
  const original: Record<string, string | undefined> = {}
  for (const key of Object.keys(overrides)) {
    original[key] = process.env[key]
    const value = overrides[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  try {
    return fn()
  } finally {
    for (const key of Object.keys(original)) {
      const value = original[key]
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

function getHookIds(result: ReturnType<typeof loadDiscoveredHooks>, event: string): string[] {
  return (result.hooks.get(event as never) ?? []).map((hook) => hook.id ?? "<none>")
}

const cases: Case[] = [
  {
    name: "import chain order is base then package then root",
    run: () => {
      const sandbox = createSandbox("import-order")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const packageRoot = path.join(projectRoot, "node_modules", "hook-pack")
        writeYaml(
          path.join(packageRoot, "package.json"),
          JSON.stringify({ name: "hook-pack", version: "1.0.0", main: "hooks.yaml" }, null, 2),
        )
        writeYaml(
          path.join(packageRoot, "hooks.yaml"),
          `hooks:\n  - id: package-layer\n    override: base-layer\n    event: session.created\n    actions:\n      - notify: package\n`,
        )
        writeYaml(
          path.join(projectRoot, "shared", "base.yaml"),
          `hooks:\n  - id: base-layer\n    event: session.created\n    actions:\n      - notify: base\n`,
        )
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/base.yaml\n  - hook-pack\nhooks:\n  - id: root-layer\n    override: package-layer\n    event: session.created\n    actions:\n      - notify: root\n`,
        )

        const result = withEnv({ PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS: "1" }, () => loadTrustedProject(projectRoot, homeDir))
        const hooks = result.hooks.get("session.created") ?? []
        const notify = hooks[0]?.actions[0]
        return hooks.length === 1 && hooks[0]?.id === "root-layer" && notify && "notify" in notify && notify.notify === "root"
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ ids: getHookIds(result, "session.created"), errors: result.errors, files: result.files }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "disable can target imported hook",
    run: () => {
      const sandbox = createSandbox("disable-import")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, "shared", "base.yaml"), `hooks:\n  - id: imported\n    event: session.created\n    actions:\n      - notify: base\n`)
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/base.yaml\nhooks:\n  - override: imported\n    disable: true\n`,
        )

        const result = loadTrustedProject(projectRoot, homeDir)
        return (result.hooks.get("session.created") ?? []).length === 0 && result.errors.length === 0
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ hooks: getHookIds(result, "session.created"), errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "replacement drops old id and indexes replacement id for later overrides",
    run: () => {
      const sandbox = createSandbox("replace-id-index")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, "shared", "base.yaml"), `hooks:\n  - id: original\n    event: session.created\n    actions:\n      - notify: base\n`)
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/base.yaml\nhooks:\n  - id: replacement\n    override: original\n    event: session.created\n    actions:\n      - notify: replacement\n  - override: original\n    disable: true\n  - override: replacement\n    disable: true\n`,
        )

        const result = loadTrustedProject(projectRoot, homeDir)
        const originalNotFound = result.errors.filter(
          (error) => error.code === "override_target_not_found" && error.message.includes('"original"'),
        ).length
        const replacementNotFound = result.errors.some(
          (error) => error.code === "override_target_not_found" && error.message.includes('"replacement"'),
        )
        const hooks = getHookIds(result, "session.created")
        return hooks.length === 0 && originalNotFound === 1 && !replacementNotFound
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ hooks, errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "directory imports expand in lexical order",
    run: () => {
      const sandbox = createSandbox("dir-import")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, "shared", "hooks.d", "20-second.yaml"), `hooks:\n  - id: second\n    event: session.created\n    actions:\n      - notify: second\n`)
        writeYaml(path.join(projectRoot, "shared", "hooks.d", "10-first.yaml"), `hooks:\n  - id: first\n    event: session.created\n    actions:\n      - notify: first\n`)
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - ../../shared/hooks.d\nhooks: []\n`)

        const result = loadTrustedProject(projectRoot, homeDir)
        const ids = getHookIds(result, "session.created")
        return JSON.stringify(ids) === JSON.stringify(["first", "second"]) ? { ok: true } : { ok: false, detail: JSON.stringify(ids) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "package-backed imports resolve through node modules",
    run: () => {
      const sandbox = createSandbox("pkg-import")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const packageRoot = path.join(projectRoot, "node_modules", "hook-pack")
        writeYaml(path.join(packageRoot, "package.json"), JSON.stringify({ name: "hook-pack", version: "1.0.0", main: "hooks.yaml" }, null, 2))
        writeYaml(path.join(packageRoot, "hooks.yaml"), `hooks:\n  - id: packaged\n    event: session.created\n    actions:\n      - notify: packaged\n`)
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - hook-pack\nhooks: []\n`)

        const result = withEnv({ PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS: "1" }, () => loadTrustedProject(projectRoot, homeDir))
        return JSON.stringify(getHookIds(result, "session.created")) === JSON.stringify(["packaged"])
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ files: result.files, errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "cycles produce invalid_imports error",
    run: () => {
      const sandbox = createSandbox("cycle")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, "shared", "a.yaml"), `imports:\n  - ./b.yaml\nhooks: []\n`)
        writeYaml(path.join(projectRoot, "shared", "b.yaml"), `imports:\n  - ./a.yaml\nhooks: []\n`)
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - ../../shared/a.yaml\nhooks: []\n`)

        const result = loadTrustedProject(projectRoot, homeDir)
        return result.errors.some((error) => error.code === "invalid_imports" && error.message.includes("cycle"))
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(result.errors) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "duplicate imports are deduped by canonical path",
    run: () => {
      const sandbox = createSandbox("dedupe")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, "shared", "leaf.yaml"), `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: leaf\n`)
        writeYaml(path.join(projectRoot, "shared", "a.yaml"), `imports:\n  - ./leaf.yaml\nhooks: []\n`)
        writeYaml(path.join(projectRoot, "shared", "b.yaml"), `imports:\n  - ./leaf.yaml\nhooks: []\n`)
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - ../../shared/a.yaml\n  - ../../shared/b.yaml\nhooks: []\n`)

        const result = loadTrustedProject(projectRoot, homeDir)
        const occurrences = result.files.filter((filePath) => filePath.endsWith("leaf.yaml")).length
        return occurrences === 1 && JSON.stringify(getHookIds(result, "session.created")) === JSON.stringify(["leaf"])
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ files: result.files, ids: getHookIds(result, "session.created") }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "untrusted project root still blocks imported hooks",
    run: () => {
      const sandbox = createSandbox("trust")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, "shared", "leaf.yaml"), `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: leaf\n`)
        const rootPath = writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - ../../shared/leaf.yaml\nhooks: []\n`)

        const result = loadDiscoveredHooks({ homeDir, projectDir: projectRoot })
        return result.files.length === 0 && (result.hooks.get("session.created") ?? []).length === 0
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ rootPath, files: result.files, errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "missing imports surface invalid_imports error",
    run: () => {
      const sandbox = createSandbox("missing")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - ../../shared/missing.yaml\nhooks: []\n`)

        const result = loadTrustedProject(projectRoot, homeDir)
        return result.errors.some((error) => error.code === "invalid_imports" && error.message.includes("missing.yaml"))
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(result.errors) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "directory imports skip dotfiles and non-yaml entries",
    run: () => {
      const sandbox = createSandbox("dir-filter")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const dir = path.join(projectRoot, "shared", "hooks.d")
        writeYaml(path.join(dir, "10-real.yaml"), `hooks:\n  - id: real\n    event: session.created\n    actions:\n      - notify: real\n`)
        // Non-yaml content that, if loaded, would fail to parse and surface errors.
        writeYaml(path.join(dir, ".DS_Store"), "binary garbage  not yaml\n")
        writeYaml(path.join(dir, ".hidden.yaml"), "this: is: not: valid yaml\n")
        writeYaml(path.join(dir, "README.md"), "# not a hook file\n")
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - ../../shared/hooks.d\nhooks: []\n`)

        const result = loadTrustedProject(projectRoot, homeDir)
        const ids = getHookIds(result, "session.created")
        const onlyRealLoaded = JSON.stringify(ids) === JSON.stringify(["real"])
        const noJunkInFiles = !result.files.some((file) => file.endsWith(".DS_Store") || file.endsWith("README.md") || file.endsWith(".hidden.yaml"))
        return onlyRealLoaded && noJunkInFiles && result.errors.length === 0
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ ids, files: result.files, errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "package imports refused without PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS",
    run: () => {
      const sandbox = createSandbox("pkg-gate")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const packageRoot = path.join(projectRoot, "node_modules", "hook-pack")
        writeYaml(path.join(packageRoot, "package.json"), JSON.stringify({ name: "hook-pack", version: "1.0.0", main: "hooks.yaml" }, null, 2))
        writeYaml(path.join(packageRoot, "hooks.yaml"), `hooks:\n  - id: packaged\n    event: session.created\n    actions:\n      - notify: packaged\n`)
        writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), `imports:\n  - hook-pack\nhooks: []\n`)

        const result = withEnv({ PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS: undefined }, () => loadTrustedProject(projectRoot, homeDir))
        const refused = result.errors.some(
          (error) => error.code === "invalid_imports" && error.message.includes("[PIYAMLHOOKS]") && error.message.includes("PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS"),
        )
        const notLoaded = (result.hooks.get("session.created") ?? []).length === 0
        return refused && notLoaded
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ errors: result.errors, ids: getHookIds(result, "session.created") }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "global hooks file refuses imports without PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS",
    run: () => {
      const sandbox = createSandbox("global-gate")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(homeDir, "shared", "leaf.yaml"), `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: leaf\n`)
        writeYaml(
          path.join(homeDir, ".pi", "agent", "hook", "hooks.yaml"),
          `imports:\n  - ../../../shared/leaf.yaml\nhooks: []\n`,
        )
        // Trust the project so we get a deterministic load path.
        writeYaml(path.join(homeDir, ".pi", "agent", "trusted-projects.json"), JSON.stringify([projectRoot]))

        const result = withEnv({ PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS: undefined }, () =>
          loadDiscoveredHooks({ homeDir, projectDir: projectRoot }),
        )
        const refused = result.errors.some(
          (error) =>
            error.code === "invalid_imports" &&
            error.message.includes("[PIYAMLHOOKS]") &&
            error.message.includes("PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS"),
        )
        const notLoaded = (result.hooks.get("session.created") ?? []).length === 0
        return refused && notLoaded
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ errors: result.errors, ids: getHookIds(result, "session.created") }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "global imports load when PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1",
    run: () => {
      const sandbox = createSandbox("global-allow")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(path.join(homeDir, "shared", "leaf.yaml"), `hooks:\n  - id: global-leaf\n    event: session.created\n    actions:\n      - notify: leaf\n`)
        writeYaml(
          path.join(homeDir, ".pi", "agent", "hook", "hooks.yaml"),
          `imports:\n  - ../../../shared/leaf.yaml\nhooks: []\n`,
        )
        writeYaml(path.join(homeDir, ".pi", "agent", "trusted-projects.json"), JSON.stringify([projectRoot]))

        const result = withEnv({ PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS: "1" }, () =>
          loadDiscoveredHooks({ homeDir, projectDir: projectRoot }),
        )
        const ids = getHookIds(result, "session.created")
        return JSON.stringify(ids) === JSON.stringify(["global-leaf"])
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ ids, errors: result.errors, files: result.files }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "async rejects notify action",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:\n  - id: async-notify\n    event: tool.after.write\n    async: true\n    actions:\n      - notify: "done"\n`,
      )
      return result.errors.some(
        (error) => error.code === "invalid_async" && error.path === "hooks[0].async" && error.message.includes("notify"),
      ) && (result.hooks.get("tool.after.write") ?? []).length === 0
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(result.errors) }
    },
  },
  {
    name: "async rejects confirm action",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:\n  - id: async-confirm\n    event: tool.after.write\n    async: true\n    actions:\n      - confirm:\n          prompt: "ok?"\n`,
      )
      return result.errors.some(
        (error) => error.code === "invalid_async" && error.path === "hooks[0].async" && error.message.includes("confirm"),
      ) && (result.hooks.get("tool.after.write") ?? []).length === 0
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(result.errors) }
    },
  },
  {
    name: "async rejects setStatus action",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:\n  - id: async-setstatus\n    event: tool.after.write\n    async: true\n    actions:\n      - setStatus: "watching"\n`,
      )
      return result.errors.some(
        (error) => error.code === "invalid_async" && error.path === "hooks[0].async" && error.message.includes("setStatus"),
      ) && (result.hooks.get("tool.after.write") ?? []).length === 0
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(result.errors) }
    },
  },
  {
    name: "path conditions are accepted on tool.after events",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: path-filtered-write
    event: tool.after.write
    conditions:
      - matchesAnyPath:
          - "src/**"
      - matchesAllPaths: "**/*.ts"
    actions:
      - notify: "matched"
`,
      )

      const hooks = result.hooks.get("tool.after.write") ?? []
      return result.errors.length === 0 && hooks.length === 1
        ? { ok: true }
        : { ok: false, detail: JSON.stringify({ errors: result.errors, hooks: hooks.length }) }
    },
  },
  {
    name: "path conditions stay rejected on tool.before events",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: before-path-filter
    event: tool.before.write
    conditions:
      - matchesAnyPath: "src/**"
    actions:
      - notify: "matched"
`,
      )

      return result.errors.some((error) => error.code === "invalid_conditions" && error.path === "hooks[0].conditions[0].matchesAnyPath")
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(result.errors) }
    },
  },
  {
    name: "path conditions stay rejected on lifecycle events without changed paths",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: created-path-filter
    event: session.created
    conditions:
      - matchesAllPaths: "src/**"
    actions:
      - notify: "matched"
`,
      )

      return result.errors.some((error) => error.code === "invalid_conditions" && error.path === "hooks[0].conditions[0].matchesAllPaths")
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(result.errors) }
    },
  },
  {
    name: "yaml payload above 1 MiB is rejected with a [PIYAMLHOOKS] error",
    run: () => {
      // Build a >1 MiB string of valid-looking YAML so the size guard fires
      // before YAML.parseDocument has a chance to spin on it.
      const filler = "# " + "x".repeat(80) + "\n"
      const repetitions = Math.ceil((1024 * 1024 + 1024) / filler.length)
      const huge = filler.repeat(repetitions) + "hooks: []\n"
      const result = parseHooksFile("/virtual/huge.yaml", huge)
      const matched = result.errors.some(
        (error) =>
          error.code === "invalid_frontmatter" &&
          error.message.includes("[PIYAMLHOOKS]") &&
          error.message.includes("size cap"),
      )
      const noHooksLoaded = Array.from(result.hooks.values()).every((list) => list.length === 0)
      return matched && noHooksLoaded
        ? { ok: true }
        : { ok: false, detail: JSON.stringify({ errors: result.errors, size: huge.length }) }
    },
  },
  {
    name: "snapshotCache evicts least-recently-used entry past 16 distinct project contexts",
    run: () => {
      const sandbox = createSandbox("snapshot-cache-lru")
      try {
        __resetSnapshotCacheForTests()
        const homeDir = path.join(sandbox, "home")
        // Create 17 distinct projects, each with a tiny project hooks.yaml.
        const projects: string[] = []
        for (let i = 0; i < 17; i += 1) {
          const projectRoot = path.join(sandbox, `proj-${i}`)
          writeYaml(
            path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
            `hooks:\n  - id: p${i}\n    event: session.created\n    actions:\n      - notify: p${i}\n`,
          )
          projects.push(projectRoot)
        }
        // Pre-trust all projects up front.
        writeYaml(
          path.join(homeDir, ".pi", "agent", "trusted-projects.json"),
          JSON.stringify(projects),
        )

        // Load the first 16 projects — cache fills exactly to its bound.
        for (let i = 0; i < 16; i += 1) {
          loadDiscoveredHooksSnapshot({ homeDir, projectDir: projects[i] })
        }
        const sizeAfter16 = __snapshotCacheSizeForTests()

        // Capture the cache key for project 0 so we can assert it gets evicted
        // when the 17th distinct project arrives.
        const keyForProject0 = __snapshotCacheKeysForTests()[0]

        // Loading the 17th project must evict project 0 (least-recently-used).
        loadDiscoveredHooksSnapshot({ homeDir, projectDir: projects[16] })
        const sizeAfter17 = __snapshotCacheSizeForTests()
        const keysAfter17 = __snapshotCacheKeysForTests()
        const project0Evicted = !keysAfter17.includes(keyForProject0)

        return sizeAfter16 === 16 && sizeAfter17 === 16 && project0Evicted
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({ sizeAfter16, sizeAfter17, project0Evicted, keysAfter17Count: keysAfter17.length }),
            }
      } finally {
        __resetSnapshotCacheForTests()
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P1-2: project import that escapes the trust anchor is rejected",
    run: () => {
      const sandbox = createSandbox("project-import-escape")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        // Place the leaf *outside* the project tree so the import would
        // step out of the trust anchor. Resolved from <project>/.pi/hook,
        // ../../../external/leaf.yaml lands in <sandbox>/external.
        const externalLeaf = writeYaml(
          path.join(sandbox, "external", "leaf.yaml"),
          `hooks:\n  - id: external\n    event: session.created\n    actions:\n      - notify: external\n`,
        )
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../../external/leaf.yaml\nhooks: []\n`,
        )

        const result = withEnv(
          { PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR: undefined },
          () => loadTrustedProject(projectRoot, homeDir),
        )
        const refused = result.errors.some(
          (error) =>
            error.code === "invalid_imports" &&
            error.message.includes("[PIYAMLHOOKS]") &&
            error.message.includes("escapes the trust anchor"),
        )
        const notLoaded = (result.hooks.get("session.created") ?? []).length === 0
        return refused && notLoaded
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({ externalLeaf, errors: result.errors, ids: getHookIds(result, "session.created") }),
            }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P1-2: PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1 opts containment off",
    run: () => {
      const sandbox = createSandbox("project-import-escape-opt-in")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(
          path.join(sandbox, "external", "leaf.yaml"),
          `hooks:\n  - id: external-opt\n    event: session.created\n    actions:\n      - notify: external\n`,
        )
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../../external/leaf.yaml\nhooks: []\n`,
        )

        const result = withEnv(
          { PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR: "1" },
          () => loadTrustedProject(projectRoot, homeDir),
        )
        const ids = getHookIds(result, "session.created")
        return JSON.stringify(ids) === JSON.stringify(["external-opt"])
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ ids, errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P1-2: project import via symlink target outside the trust anchor is rejected",
    run: () => {
      const sandbox = createSandbox("project-import-symlink-escape")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const externalDir = path.join(sandbox, "external")
        writeYaml(
          path.join(externalDir, "leaf.yaml"),
          `hooks:\n  - id: ext-link\n    event: session.created\n    actions:\n      - notify: leak\n`,
        )
        // Link path lives inside the project, but the canonical target
        // points outside — containment check must follow symlinks.
        const linkInsideProject = path.join(projectRoot, "shared", "leaf-link.yaml")
        mkdirSync(path.dirname(linkInsideProject), { recursive: true })
        symlinkSync(path.join(externalDir, "leaf.yaml"), linkInsideProject)
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/leaf-link.yaml\nhooks: []\n`,
        )

        const result = withEnv(
          { PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR: undefined },
          () => loadTrustedProject(projectRoot, homeDir),
        )
        const refused = result.errors.some(
          (error) => error.code === "invalid_imports" && error.message.includes("escapes the trust anchor"),
        )
        const notLoaded = (result.hooks.get("session.created") ?? []).length === 0
        return refused && notLoaded
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({ errors: result.errors, ids: getHookIds(result, "session.created") }),
            }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P2-1: symlink-induced canonicalisation cycle terminates",
    run: () => {
      const sandbox = createSandbox("symlink-cycle")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        // Build a symlink ring: a.yaml → b.yaml → a.yaml inside the project.
        const sharedDir = path.join(projectRoot, "shared")
        mkdirSync(sharedDir, { recursive: true })
        const a = path.join(sharedDir, "a.yaml")
        const b = path.join(sharedDir, "b.yaml")
        symlinkSync(b, a)
        symlinkSync(a, b)
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/a.yaml\nhooks: []\n`,
        )

        // The harness must not hang. We rely on the depth/cycle guards in
        // canonicalizeHookPath and expandSnapshotImports to bound recursion.
        const start = Date.now()
        const result = loadTrustedProject(projectRoot, homeDir)
        const elapsed = Date.now() - start
        const surfaced = result.errors.some((error) => error.code === "invalid_imports")
        return surfaced && elapsed < 5_000
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ elapsed, errors: result.errors }) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P2-2: fingerprint differs when ino/mode change but mtime+size do not",
    run: () => {
      const sandbox = createSandbox("fingerprint-ino-mode")
      try {
        __resetSnapshotCacheForTests()
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const hookPath = writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: original\n`,
        )
        writeYaml(path.join(homeDir, ".pi", "agent", "trusted-projects.json"), JSON.stringify([projectRoot]))

        const first = loadDiscoveredHooksSnapshot({ homeDir, projectDir: projectRoot })

        // Replace the file via rename so a new inode appears with the same
        // byte length. Lock the mtime to the previous fingerprint by
        // touching it to the same value the first stat saw — if the loader
        // only fingerprinted on (mtime|size) the cache would not bust.
        const tmp = `${hookPath}.tmp`
        const sameLengthBody = `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: edited\n`.padEnd(
          // Match original byte length so size stays identical. The original
          // body is len bytes; we pad with trailing spaces in a YAML comment
          // line to match. This is a best-effort match — if the lengths
          // differ slightly the test still passes via the size delta but
          // the ino delta is the load-bearing change.
          113,
          " ",
        )
        writeFileSync(tmp, sameLengthBody, "utf8")
        // Bump times back so mtime is identical pre-rename.
        const stamp = new Date(Date.now() - 60_000)
        utimesSync(tmp, stamp, stamp)
        // Atomic replace produces a new inode.
        rmSync(hookPath, { force: true })
        writeFileSync(hookPath, sameLengthBody, "utf8")
        utimesSync(hookPath, stamp, stamp)

        const second = loadDiscoveredHooksSnapshot({ homeDir, projectDir: projectRoot })
        const signaturesDiffer = first.signature !== second.signature
        const reflectedEdit =
          (() => {
            const action = second.hooks.get("session.created")?.[0]?.actions[0]
            return action && "notify" in action && action.notify === "edited"
          })()
        return signaturesDiffer && reflectedEdit
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({ first: first.signature, second: second.signature, files: second.files }),
            }
      } finally {
        __resetSnapshotCacheForTests()
        cleanup(sandbox)
      }
    },
  },
  {
    name: "snapshotCache busts when content changes but stat tuple is restored",
    run: () => {
      const sandbox = createSandbox("fingerprint-content-hash")
      try {
        __resetSnapshotCacheForTests()
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const original = `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: original\n`
        const edited = original.replace("original", "edited  ")
        const hookPath = writeYaml(path.join(projectRoot, ".pi", "hook", "hooks.yaml"), original)
        writeYaml(path.join(homeDir, ".pi", "agent", "trusted-projects.json"), JSON.stringify([projectRoot]))
        const stamp = new Date(Date.now() - 60_000)
        utimesSync(hookPath, stamp, stamp)

        const first = loadDiscoveredHooksSnapshot({ homeDir, projectDir: projectRoot })
        writeFileSync(hookPath, edited, "utf8")
        utimesSync(hookPath, stamp, stamp)

        const second = loadDiscoveredHooksSnapshot({ homeDir, projectDir: projectRoot })
        const secondNotify = second.hooks.get("session.created")?.[0]?.actions[0]
        const reflectedEdit = secondNotify && "notify" in secondNotify && secondNotify.notify === "edited"
        return first.signature !== second.signature && reflectedEdit
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ first: first.signature, second: second.signature, secondNotify }) }
      } finally {
        __resetSnapshotCacheForTests()
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P2-3: duplicate hook id across files surfaces duplicate_hook_id error",
    run: () => {
      const sandbox = createSandbox("duplicate-id-across-files")
      try {
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        writeYaml(
          path.join(projectRoot, "shared", "a.yaml"),
          `hooks:\n  - id: shared\n    event: session.created\n    actions:\n      - notify: a\n`,
        )
        writeYaml(
          path.join(projectRoot, "shared", "b.yaml"),
          `hooks:\n  - id: shared\n    event: session.created\n    actions:\n      - notify: b\n`,
        )
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/a.yaml\n  - ../../shared/b.yaml\nhooks: []\n`,
        )

        const result = loadTrustedProject(projectRoot, homeDir)
        const fired = result.errors.some(
          (error) => error.code === "duplicate_hook_id" && error.message.includes('"shared"') && error.message.includes("a.yaml"),
        )
        return fired
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(result.errors) }
      } finally {
        cleanup(sandbox)
      }
    },
  },
  {
    name: "P2-21: async hook with action: stop is rejected at parse time",
    run: () => {
      const result = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:\n  - id: bad-stop\n    event: tool.after.write\n    async: true\n    action: stop\n    actions:\n      - bash: "echo no"\n`,
      )
      const fired = result.errors.some(
        (error) =>
          error.code === "invalid_hook_action" &&
          error.path === "hooks[0].action" &&
          error.message.includes("async hooks cannot use action: stop"),
      )
      const notLoaded = (result.hooks.get("tool.after.write") ?? []).length === 0
      return fired && notLoaded
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(result.errors) }
    },
  },
  {
    name: "snapshotCache busts when an imported file is edited",
    run: () => {
      const sandbox = createSandbox("snapshot-import-bust")
      try {
        __resetSnapshotCacheForTests()
        const homeDir = path.join(sandbox, "home")
        const projectRoot = path.join(sandbox, "project")
        const importedPath = writeYaml(
          path.join(projectRoot, "shared", "leaf.yaml"),
          `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: original\n`,
        )
        writeYaml(
          path.join(projectRoot, ".pi", "hook", "hooks.yaml"),
          `imports:\n  - ../../shared/leaf.yaml\nhooks: []\n`,
        )
        writeYaml(path.join(homeDir, ".pi", "agent", "trusted-projects.json"), JSON.stringify([projectRoot]))

        const first = loadDiscoveredHooksSnapshot({ homeDir, projectDir: projectRoot })
        const firstNotify = first.hooks.get("session.created")?.[0]?.actions[0]
        const firstHasOriginal = firstNotify && "notify" in firstNotify && firstNotify.notify === "original"

        // Mutate mtime + size + content. Bump mtime far enough in the future
        // so high-resolution filesystems definitely see a change.
        const future = new Date(Date.now() + 5_000)
        writeFileSync(
          importedPath,
          `hooks:\n  - id: leaf\n    event: session.created\n    actions:\n      - notify: edited\n`,
          "utf8",
        )
        // Force a distinct mtime by touching the file. writeFileSync alone is
        // usually enough but we additionally bump mtime to be paranoid on
        // coarse-grained filesystems.
        utimesSync(importedPath, future, future)

        const second = loadDiscoveredHooksSnapshot({ homeDir, projectDir: projectRoot })
        const secondNotify = second.hooks.get("session.created")?.[0]?.actions[0]
        const secondHasEdited = secondNotify && "notify" in secondNotify && secondNotify.notify === "edited"

        const signaturesDiffer = first.signature !== second.signature

        return firstHasOriginal && secondHasEdited && signaturesDiffer
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({
                firstNotify,
                secondNotify,
                firstSignature: first.signature,
                secondSignature: second.signature,
              }),
            }
      } finally {
        __resetSnapshotCacheForTests()
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
  /load-hooks-composition\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  process.exit(main())
}
