// Run the unchanged installer entry point in a read-only, network-isolated host sandbox.
import { expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

for (const scenario of [
  { name: "captured quoted IMG_VERSION with different VERSION_ID", metadata: 'VERSION_ID=5.8.203\nIMG_VERSION="3.28.0.172"\n', accepted: true },
  { name: "unsupported IMG_VERSION despite supported-looking VERSION_ID", metadata: 'VERSION_ID=3.28.0.172\nIMG_VERSION="3.29.0.0"\n', accepted: false },
  { name: "missing IMG_VERSION", metadata: 'VERSION_ID=3.28.0.172\n', accepted: false },
]) {
  test(`installer firmware preflight: ${scenario.name}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "pi-ink-firmware-"));
    try {
      await writeFile(join(directory, "os-release"), scenario.metadata);
      await writeFile(join(directory, "model"), "reMarkable Ferrari\0");
      for (const [name, body] of Object.entries({
        id: "printf '0\\n'",
        uname: "printf 'aarch64\\n'",
        // Stop at the next real guard; never inspect the host's stock binary or install.
        sha256sum: "printf 'fixture-stock-check\\n' >&2; exit 1",
      })) {
        const path = join(directory, name);
        await writeFile(path, `#!/bin/sh\n${body}\n`);
        await chmod(path, 0o700);
      }
      const result = Bun.spawnSync([
        "bwrap", "--ro-bind", "/", "/", "--unshare-all", "--die-with-parent",
        "--dev", "/dev",
        "--tmpfs", "/sys/firmware", "--dir", "/sys/firmware/devicetree/base",
        "--ro-bind", join(directory, "model"), "/sys/firmware/devicetree/base/model",
        "--tmpfs", "/etc",
        "--ro-bind", join(directory, "os-release"), "/etc/os-release",
        "--setenv", "PATH", `${directory}:/usr/bin:/bin`,
        "--unsetenv", "IMG_VERSION", "--unsetenv", "VERSION_ID",
        "sh", resolve(import.meta.dir, "../tablet-client/production-install.sh"), "a".repeat(64), "b".repeat(64),
      ]);
      const error = result.stderr.toString();
      expect(result.exitCode).toBe(1);
      if (scenario.accepted) {
        expect(error).toContain("fixture-stock-check");
      } else {
        expect(error).not.toContain("fixture-stock-check");
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

for (const scenario of [
  { dependency: "xovi.so", state: "absent" },
  { dependency: "xovi.so", state: "directory" },
  { dependency: "extensions.d/qt-resource-rebuilder.so", state: "absent" },
  { dependency: "extensions.d/qt-resource-rebuilder.so", state: "directory" },
  { dependency: "none", state: "regular" },
]) {
  test(`installer native dependency preflight: ${scenario.dependency} ${scenario.state}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "pi-ink-dependency-"));
    try {
      const home = join(directory, "home");
      const bin = join(directory, "bin");
      const downloads = join(directory, "downloads");
      const payload = join(directory, "payload");
      for (const path of [
        bin, downloads, payload,
        join(home, "xovi/extensions.d"),
        join(home, "xovi/exthome/appload"),
        join(home, "xovi/exthome/qt-resource-rebuilder"),
      ]) await mkdir(path, { recursive: true });
      for (const dependency of ["xovi.so", "extensions.d/appload.so", "extensions.d/qt-resource-rebuilder.so"]) {
        const path = join(home, "xovi", dependency);
        if (dependency !== scenario.dependency) await writeFile(path, "fixture native library");
        else if (scenario.state === "directory") await mkdir(path);
      }
      await writeFile(join(directory, "os-release"), 'IMG_VERSION="3.28.0.172"\n');
      await writeFile(join(directory, "model"), "reMarkable Ferrari\0");
      // Only the stock firmware check is synthetic; ZIP and trust digests stay real.
      for (const [name, body] of Object.entries({
        id: "printf '0\\n'",
        uname: "printf 'aarch64\\n'",
        sha256sum: 'IFS= read -r check\ncase "$check" in *"  /usr/bin/xochitl") exit 0 ;; esac\nprintf "%s\\n" "$check" | /usr/bin/sha256sum "$@"',
        unzip: 'printf "reached\\n" > /home/root/extraction-reached\nexec /usr/bin/unzip "$@"',
      })) {
        const path = join(bin, name);
        await writeFile(path, `#!/bin/sh\n${body}\n`);
        await chmod(path, 0o700);
      }
      // This bounded sentinel proves installer reachability, not ARM64 installation.
      await writeFile(join(payload, "pi-ink-client"), '#!/bin/sh\n[ "$1" = install-client ] || exit 2\nprintf "reached\\n" > /home/root/install-client-reached\n');
      const archive = join(downloads, "client.zip");
      const zipped = Bun.spawnSync(["zip", "-q", archive, "pi-ink-client"], { cwd: payload });
      expect(zipped.exitCode).toBe(0);
      const server = join(downloads, "server.json");
      await writeFile(server, '{"fixture":true}\n');
      const archiveDigest = new Bun.CryptoHasher("sha256").update(await Bun.file(archive).arrayBuffer()).digest("hex");
      const serverDigest = new Bun.CryptoHasher("sha256").update(await Bun.file(server).arrayBuffer()).digest("hex");
      const result = Bun.spawnSync([
        "bwrap", "--ro-bind", "/", "/", "--unshare-all", "--die-with-parent",
        "--dev", "/dev", "--tmpfs", "/tmp", "--ro-bind", directory, "/tmp/fixture",
        "--tmpfs", "/var/home", "--dir", "/var/home/root",
        "--bind", home, "/home/root",
        "--tmpfs", "/sys/firmware", "--dir", "/sys/firmware/devicetree/base",
        "--ro-bind", join(directory, "model"), "/sys/firmware/devicetree/base/model",
        "--tmpfs", "/etc", "--ro-bind", join(directory, "os-release"), "/etc/os-release",
        "--setenv", "PATH", "/tmp/fixture/bin:/usr/bin:/bin",
        "--chdir", "/tmp/fixture/downloads",
        "sh", resolve(import.meta.dir, "../tablet-client/production-install.sh"), archiveDigest, serverDigest,
      ]);
      const accepted = scenario.state === "regular";
      expect(result.exitCode).toBe(accepted ? 0 : 1);
      expect(await Bun.file(join(home, "install-client-reached")).exists()).toBe(accepted);
      expect(await Bun.file(join(home, "extraction-reached")).exists()).toBe(accepted);
      expect((await readdir(home)).sort()).toEqual(accepted ? ["extraction-reached", "install-client-reached", "xovi"] : ["xovi"]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
