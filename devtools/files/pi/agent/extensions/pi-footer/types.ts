import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { FooterTemplate } from "./services/config/defaults";

export type FooterSegment = {
  text: string | number | boolean;
  align?: "left" | "right";
  order?: number;
  enabled?: boolean;
};

export type FooterContextProvider = (
  ctx: ExtensionContext,
) =>
  | string
  | number
  | boolean
  | FooterSegment
  | FooterSegment[]
  | null
  | undefined;

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
