import { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { resolveSkill, Skill } from "../service/skill-registry";
import type { RuntimeSettings } from "../service/config";

export function LoadSkillCommand(
  args: string,
  options: {
    skills: Skill[];
    skillsByQualifiedName: Map<string, Skill>;
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

  const resolved = resolveSkill(
    requestedName,
    options.skills,
    options.skillsByQualifiedName,
  );

  if (resolved.kind === "ambiguous") {
    options.onWarningNotify(
      `Ambiguous shortname "${resolved.requestedName}". Use qualified name:\n${resolved.options.map((o) => `  /skill:${o}`).join("\n")}`,
    );
    return;
  }

  if (resolved.kind === "not_found") {
    options.onInfoNotify(`Skill not found: ${requestedName}`);
    return;
  }

  if (resolved.usedShortnameFallback) {
    options.onInfoNotify(
      `Using "${resolved.skill.qualifiedName}" for shortname "${requestedName}"`,
    );
  }

  options.sendSkillMessage(requestedName, extraArgs);
}

export function CreateSkillSlashCommands(
  pi: ExtensionAPI,
  skills: Skill[],
  runtimeSettings: RuntimeSettings,
  sendSkillMessage: (name: string, args?: string) => void,
) {
  if (!runtimeSettings.enableSkillCommands) {
    return;
  }

  // Register fully-qualified per-skill commands: /skill:<qualified-name>
  for (const skill of skills) {
    const commandName = `skill:${skill.qualifiedName}`;

    pi.registerCommand(commandName, {
      description: skill.description,
      handler: async (args, _cmdCtx) => {
        sendSkillMessage(skill.qualifiedName, args || undefined);
      },
    });
  }
}
