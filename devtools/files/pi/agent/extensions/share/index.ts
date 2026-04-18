import {
  CustomEditor,
  type ExtensionAPI,
  type KeybindingsManager,
} from "@mariozechner/pi-coding-agent";
import {
  getKeybindings,
  type EditorTheme,
  type TUI,
} from "@mariozechner/pi-tui";
export function shouldInterceptShareSubmit(
  text: string,
  isSubmitKey: boolean,
): boolean {
  return isSubmitKey && text.trim() === "/share";
}
function runShareOverride(
  api: ExtensionAPI,
  message = "Intercepted /share before default submit handler",
): void {
  api.sendMessage({
    content: message,
    display: true,
    customType: "share_intercepted",
  });
}

class ShareInterceptEditor extends CustomEditor {
  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
    private readonly onShareIntercept: () => void,
  ) {
    super(tui, theme, keybindings);
  }
  override handleInput(data: string): void {
    const isSubmitKey = getKeybindings().matches(data, "tui.input.submit");
    if (shouldInterceptShareSubmit(this.getText(), isSubmitKey)) {
      this.setText("");
      this.onShareIntercept();
      this.tui.requestRender();
      return;
    }
    super.handleInput(data);
  }
}

export default function PiShareExtension(api: ExtensionAPI) {
  api.on("session_start", (_event, ctx) => {
    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      return new ShareInterceptEditor(tui, theme, keybindings, () => {
        ctx.ui.notify("Share Override", "info");
        runShareOverride(api);
      });
    });
  });
}

