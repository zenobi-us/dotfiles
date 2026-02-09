import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { FooterTemplate } from "./services/config/defaults";

export type FooterContextValue = string | number | boolean | null | undefined;

export type FooterContextProvider = (
  ctx: ExtensionContext,
) => FooterContextValue | FooterContextValue[];

export interface FooterInstance {
  render(
    ctx: ExtensionContext,
    theme: ExtensionContext["ui"]["theme"],
    width: number,
    options: {
      template?: FooterTemplate;
    },
  ): string[];
  registerContextProvider(name: string, provider: FooterContextProvider): void;
  unregisterContextProvider(name: string): void;
  listContextProviders(): string[];
}
export type FooterTheme = {
  fg(colorName: string, text: string): string;
  bg?(colorName: string, text: string): string;
};
