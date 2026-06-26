import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { patchTreeSelector } from "./patch-tree-selector.ts";
import { getPersistedMode, setSettingsContext } from "./settings.ts";

export default function treeTimestampsExtension(pi: ExtensionAPI): void {
    pi.on("session_start", async (_event, ctx) => {
        setSettingsContext(ctx);
        getPersistedMode();
        await patchTreeSelector();
    });
}
