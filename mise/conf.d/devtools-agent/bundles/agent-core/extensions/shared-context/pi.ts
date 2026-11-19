import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { AutocompleteProvider } from "@earendil-works/pi-tui";
import {
  cachedItems,
  createSharedContextAutocompleteProvider,
  loadSharedContextItems,
  type GetItems,
} from "./autocomplete";

export default function sharedContextAutocomplete(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, context) => {
    if (!context.hasUI) return;

    const getItems = cachedItems(
      () => loadSharedContextItems(
        context.cwd,
        (args, cwd) => pi.exec("shared-context", args, { cwd, timeout: 15_000 }),
      ),
      (error) => context.ui.notify(
        `shared-context autocomplete refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        "warning",
      ),
    );

    context.ui.addAutocompleteProvider((current) => createPiAutocompleteProvider(current, getItems));
    void getItems();
  });
}

export function createPiAutocompleteProvider(
  current: AutocompleteProvider,
  getItems: GetItems,
): AutocompleteProvider {
  const provider = createSharedContextAutocompleteProvider(current, getItems, (options) => options.signal);
  provider.triggerCharacters = [...new Set([...(current.triggerCharacters ?? []), "s"])];
  return provider;
}
