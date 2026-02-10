export type FooterTemplateObjectItemBase = {
  flexGrow?: boolean;
  align?: "left" | "right";
};

export type FooterTemplateObjectItem = {
  separator?: string;
  items: (string | FooterTemplateObjectItem)[];
} & FooterTemplateObjectItemBase;

export type FooterTemplate = (
  | string
  | FooterTemplateObjectItem
  | (string | FooterTemplateObjectItem)[]
)[];

/**
 * Default configuration for the PI Footer extension.
 *
 * Examples:
 *
 * ```ts
 * export const DEFAULT_TEMPLATE = [
 *   [
 *     "{model_context_used}/{model_context_window} | {model_name}",
 *     { items: ["{cwd}"] },
 *   ],
 * ];
 * ```
 *
 * flex spacing:
 * ```ts
 * export const DEFAULT_TEMPLATE = [
 *  [
 *  "{model_context_used}/{model_context_window} | {model_name}",
 *  { items: ["{cwd}"], flex: 1 },
 *  ],
 *  [
 *  "{git_branch_name}",
 *  { items: ["{last_commit_message}"], flex: 0 },
 *  ],
 * ];
 *
 */
export const DEFAULT_TEMPLATE: FooterTemplate = [
  [
    { items: ["[{git_worktree_name}:{git_branch_name}]"] },
    {
      items: [
        "{model_provider}.{model_name} [{model_context_window}:{model_context_used}]",
      ],
      align: "right",
    },
  ],
  [{ items: ["{mode_thinking_level}"], align: "right" }],
];
