import {
  cachedItems,
  createSharedContextAutocompleteProvider,
  loadSharedContextItems,
  type AutocompleteProvider,
  type GetItems,
} from "./autocomplete";

export default function sharedContextAutocomplete(omp: ExtensionApi): void {
  omp.on("session_start", (_event, context) => {
    if (!context.hasUI) return;

    const getItems = cachedItems(
      () => loadSharedContextItems(
        context.cwd,
        (args, cwd) => omp.exec("shared-context", args, { cwd, timeout: 15_000 }),
      ),
      (error) => omp.logger?.warn("shared-context autocomplete refresh failed", {
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    context.ui.addAutocompleteProvider((current) => createOmpAutocompleteProvider(current, getItems));
    void getItems();
  });
}

export function createOmpAutocompleteProvider(
  current: AutocompleteProvider,
  getItems: GetItems,
): AutocompleteProvider {
  return createSharedContextAutocompleteProvider(current, getItems, (signal) => signal);
}

interface ExtensionApi {
  exec(
    command: string,
    args: string[],
    options: { cwd: string; timeout: number },
  ): Promise<{ code: number; stdout: string; stderr: string }>;
  logger?: { warn(message: string, fields?: Record<string, unknown>): void };
  on(
    event: "session_start",
    handler: (
      event: unknown,
      context: {
        cwd: string;
        hasUI: boolean;
        ui: {
          addAutocompleteProvider(factory: (current: AutocompleteProvider) => AutocompleteProvider): void;
        };
      },
    ) => void,
  ): void;
}
