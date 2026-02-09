import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { FooterTemplate } from "./services/config/defaults";
import type { Template } from "./core/template";

export type FooterContextValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null
  | undefined;

export type FilterFunction = (value: unknown, ...args: any[]) => string;

export type FooterContextProvider = (
  ctx: ExtensionContext,
) => FooterContextValue | FooterContextValue[];

export interface FooterInstance {
  template: Template;
  render(
    ctx: ExtensionContext,
    theme: ExtensionContext["ui"]["theme"],
    width: number,
    options: {
      template?: FooterTemplate;
    },
  ): string[];
  registerContextProvider(name: string, provider: FooterContextProvider): void;
  registerContextFilter(name: string, filter: FilterFunction): void;
}
export type FooterTheme = {
  fg(colorName: string, text: string): string;
  bg?(colorName: string, text: string): string;
};
