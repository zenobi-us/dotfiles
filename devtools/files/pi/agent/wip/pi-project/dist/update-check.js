/**
 * Non-blocking update check for @davidorex/pi-project-workflows.
 * Fetches latest version from npm registry and notifies via callback
 * if a newer version is available. Fails silently on network errors.
 */
import fs from "node:fs";
import path from "node:path";
const PACKAGE_NAME = "@davidorex/pi-project-workflows";
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const TIMEOUT_MS = 10_000;
/**
 * Read the installed version of the meta-package from node_modules.
 * Walks up from this package to find the meta-package. Returns null
 * if not installed (user may have installed packages individually).
 */
function getInstalledVersion() {
    try {
        let dir = path.resolve(import.meta.dirname, "..");
        for (let i = 0; i < 5; i++) {
            const candidate = path.join(dir, "node_modules", PACKAGE_NAME, "package.json");
            if (fs.existsSync(candidate)) {
                const pkg = JSON.parse(fs.readFileSync(candidate, "utf-8"));
                return pkg.version ?? null;
            }
            dir = path.dirname(dir);
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Fetch latest version from npm registry. Returns null on failure.
 */
async function getLatestVersion() {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const res = await fetch(REGISTRY_URL, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok)
            return null;
        const data = (await res.json());
        return data.version ?? null;
    }
    catch {
        return null;
    }
}
/**
 * Compare two semver strings. Returns true if latest > installed.
 */
function isNewer(installed, latest) {
    const parse = (v) => v.split(".").map(Number);
    const [iMaj, iMin, iPat] = parse(installed);
    const [lMaj, lMin, lPat] = parse(latest);
    if (lMaj !== iMaj)
        return lMaj > iMaj;
    if (lMin !== iMin)
        return lMin > iMin;
    return lPat > iPat;
}
/**
 * Run the update check and notify if a newer version exists.
 * Call fire-and-forget from the extension factory — non-blocking.
 */
export async function checkForUpdates(notify) {
    const installed = getInstalledVersion();
    if (!installed)
        return;
    const latest = await getLatestVersion();
    if (!latest)
        return;
    if (isNewer(installed, latest)) {
        notify(`Update available: ${PACKAGE_NAME} ${installed} → ${latest}\nRun: pi install npm:${PACKAGE_NAME}`, "info");
    }
}
//# sourceMappingURL=update-check.js.map