import type { BundleSkill } from "../../content";
import type { SkillDocumentContent } from "../../lib/skill-document";
import { Heading } from "../Heading";

export function SkillMetadata(props: { skill: BundleSkill & SkillDocumentContent }) {
  return (
    <aside
      aria-label="Skill metadata"
      className="min-w-0 border-l border-border pl-6 text-[12px] narrow:border-t narrow:border-l-0 narrow:pt-6 narrow:pl-0"
    >
      <Heading as="h2" id="schema-versions" title="Schema & versions" className="mb-3 text-[14px]" />
      <dl className="space-y-2">
        <dt className="text-muted">Skill schema version</dt>
        <dd>{props.skill.schemaVersion ?? "Not declared"}</dd>
        <dt className="text-muted">Skill version</dt>
        <dd>{props.skill.version ?? "Not declared"}</dd>
      </dl>
      <Heading as="h2" id="references" title="References" className="mt-6 mb-3 text-[14px]" />
      {props.skill.references.length > 0 ? (
        <ul className="space-y-2 break-words">
          {props.skill.references.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href}>{entry.label || entry.path}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No local references identified.</p>
      )}
      <Heading as="h2" id="created-artifacts" title="Created artifacts" className="mt-6 mb-3 text-[14px]" />
      {props.skill.artifacts.length > 0 ? (
        <ul className="space-y-3">
          {props.skill.artifacts.map((entry) => (
            <li key={entry.path}>
              <code className="break-words">{entry.path}</code>
              <br />
              <a href={entry.source} className="text-[10px]">
                Output source
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">
          Not identified from the skill and its local references. The skill may create other files.
        </p>
      )}
      <p className="mt-6 border-t border-border pt-3 text-[10px] text-muted">
        Best-effort metadata from the skill and directly linked local documents. Output paths describe files the skill
        creates, not downloadable files. A skill version is not a schema version.
      </p>
    </aside>
  );
}
