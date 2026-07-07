import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { resolveSkill, Skill } from "../service/skill-registry";

export function LoadSkillCommand(
  args: string,
  options: {
    skills: Map<string, Skill>;
    sendSkillMessage: (name: string, args?: string) => void;
    onWarningNotify: (message: string) => void;
    onInfoNotify: (message: string) => void;
  },
) {
  const trimmed = args.trim();
  if (!trimmed) {
    options.onWarningNotify(
      "Usage: /skill <qualified-name|shortname> [extra instructions]",
    );
    return;
  }

  const [requestedName, ...rest] = trimmed.split(/\s+/);
  const extraArgs = rest.length > 0 ? rest.join(" ") : undefined;

  const resolved = resolveSkill(requestedName, options.skills);

  if (resolved.kind === "ambiguous") {
    options.onWarningNotify(
      `Ambiguous shortname "${requestedName}". Use qualified name:\n${(resolved.options?.suggestedQualifiedNames ?? []).map((o) => `  /skill ${o}`).join("\n")}`,
    );
    return;
  }

  if (resolved.kind === "not_found") {
    options.onInfoNotify(`Skill not found: ${requestedName}`);
    return;
  }

  if (resolved.options?.usedShortnameFallback) {
    options.onInfoNotify(
      `Using "${resolved.skill.qualifiedName}" for shortname "${requestedName}"`,
    );
  }

  options.sendSkillMessage(requestedName, extraArgs);
}

export function formatSkillCommandName(
  template: string,
  skill: Pick<Skill, "name" | "qualifiedName">,
): string {
  return template
    .replaceAll("{shortname}", skill.name)
    .replaceAll("{qualified_name}", skill.qualifiedName)
    .trim()
    .replace(/^\/+/, "");
}

export function CreateSkillSlashCommands(
  pi: ExtensionAPI,
  skills: Skill[],
  commandTemplates: string[],
  sendSkillMessage: (name: string, args?: string) => void,
) {
  const registered = new Set<string>();

  for (const skill of skills) {
    for (const template of commandTemplates) {
      const commandName = formatSkillCommandName(template, skill);
      if (!commandName || registered.has(commandName)) continue;
      registered.add(commandName);

      pi.registerCommand(commandName, {
        description: skill.description,
        handler: async (args, _cmdCtx) => {
          sendSkillMessage(skill.qualifiedName, args || undefined);
        },
      });
    }
  }
}
