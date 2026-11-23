---
receipt_id: implementation-0002
schemaVersion: worktree-pr-draft/v1
source_commit: 3a1279b8cea5fe19588a815535546001d4f0cb50
source_tree: 703803167df3fe130224a2dcca7a37cec26d1ff8
ticket_ref: tracker/tickets/skill-contract-manifests-18-manifest-coverage.md
workflow_id: skill-contract-manifests-18-manifest-coverage
---

# Manifest coverage: partial implementation

The source adds reachable declarations and coverage guidance. Full coverage remains blocked. Installed bundle links and update logic remain unchanged.

## Coverage

| View | Skills checked | Valid manifests | Missing manifests | Invalid present manifests |
| --- | ---: | ---: | ---: | ---: |
| Installed entry points | 261 | 12 | 249 | 0 |
| Frozen source | 261 | 209 | 52 | 0 |

The audit covers agent-core, creator, developer, matt-pocock, platform, researcher and writing. It includes nested skills and accounts for every discovered skill. Source support remains partial for 130 skills. The 197 new manifests include 39 audited empty declarations. The 12 existing owner manifests remain byte-identical.

Read the [per-skill inventory](../artifacts/evidence/manifest-coverage/coverage-inventory.json) for inputs, outputs, exact definitions, exclusions and unresolved boundaries. The researcher bundle declares a missing skills root. Legacy Claude plugin paths also contain stale roots. The audit records these diagnostics without changing installation behavior.

## Implementation

- **Declare actual formats.** Reference pinned authoritative upstream definitions and existing local owners. Preserve native external fields and identities.
- **Preserve owner boundaries.** Add no domain converters, competing definitions or artifact migrations. Stop newly uncovered persistent-owner portions.
- **Correct review findings.** Declare Conventional Commit output. Replace inferred CDP claims in five browser skills with actual Chrome DevTools MCP request/result definitions.
- **Retain repository conventions.** The commit hook made version-only changes in six bundle plugin files and the marketplace. No skill roots or updater code changed.

## Verification

- **Public operations:** Run validate for all installed entry points and all proposed source skills. Recheck the six corrected manifests through the same public command. All current source manifest hashes match their successful validation records; validation changed no manifest bytes.
- **Focused suite:** 72 tests passed, 0 failed, with 291 assertions across contracts.test.ts and upgrades.test.ts. The suite ran once.
- **Definition resolution:** Resolve pinned WHATWG HTML, Agent Skills and the built-in manifest through the public router from /tmp.
- **Rejected input:** Unknown fields and unresolved definitions returned nonzero, no partial output, and unchanged fixture bytes.
- **External content:** Actual mq/okf commands retained type/custom_field metadata and reported missing type. No internal identity field was inserted.
- **Internal review:** Standards and Spec found semantic issues. Both correction checks returned SUCCESS for the six fixed manifests. These checks are not a formal worktree review or a full-coverage verdict.
- **Resources:** All eight audit/reviewer child process groups stopped. No application service was started. The source checkout remains clean and available for independent review.

Detailed evidence: [current validation](../artifacts/evidence/manifest-coverage/source-validation-current.json), [initial validation](../artifacts/evidence/manifest-coverage/source-validation-initial.json), [scoped rechecks](../artifacts/evidence/manifest-coverage/source-validation-rechecks.json), [tests](../artifacts/evidence/manifest-coverage/focused-tests.json), [rejections](../artifacts/evidence/manifest-coverage/rejection-smoke.json), [definition resolution](../artifacts/evidence/manifest-coverage/definition-resolution-smoke.json), [OKF content](../artifacts/evidence/manifest-coverage/okf-smoke.json), [internal reviews](../artifacts/evidence/manifest-coverage/internal-reviews.json), [resources](../artifacts/evidence/manifest-coverage/worker-resources.json), [source binding](../artifacts/evidence/manifest-coverage/source-binding.json). Shared manifest validation does not validate arbitrary domain content or establish full support.

## Owner follow-up and open questions

Request separate owner-specific work for newly found persistent boundaries. The [owner request report](../artifacts/evidence/manifest-coverage/owner-requests.json) records 36 boundary requests, including external definition gaps and an ownership-classification question. It does not claim 36 distinct new owners. Existing artifact-sharing, worktree, tracker, evidence, Home Assistant, plain-language, web metadata and report owners retain their definitions and migrations.

| Source skill | Boundary owner | Required next action |
| --- | --- | --- |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberpunk-help` | cyberpunk-help | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-backstory` | cyberwise-backstory | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-conflicts` | cyberwise-conflicts | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-crashes` | cyberwise-crashes | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-hotkeys` | cyberwise-hotkeys | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-modbase` | cyberwise-modbase | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-netsec` | NetSec and CETMonkey (external); cyberwise-netsec consumer/generator | Resolve the external producer/consumer definition. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-recommends` | cyberwise-recommends | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-reports` | cyberwise-reports | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-saves` | CDPR save format and ACU preset producer (external); cyberwise-saves decoder | Resolve the external producer/consumer definition. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-sitebuilder` | cyberwise-sitebuilder; character content owner to resolve | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-tweaks` | cyberwise for backup/patch records; external TweakXL/CET/redscript owners | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-wiki` | cyberwise-wiki for validation result and distribution-boundary semantics; OKF external owner | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise` | cyberwise | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-brainstorming` | godot/godot-mentor for per-project preference state | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-mentor` | godot/godot-mentor | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/project` | godot/project for host-hook integration; godot/godot-mentor for stated preference state | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/ttrpg-gm` | ttrpg-gm | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/code-review` | code-review / worktree review storage (ticket 08) | Resolve review-body classification with existing owners. |
| `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/domain-modeling` | domain-modeling | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/teach` | teach | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/triage` | triage | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/canon-steward` | canon-steward | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/character-designer` | character-designer | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/continuity-keeper` | continuity-keeper | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/faction-designer` | faction-designer | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/narrative-repo-setup` | narrative-repo-setup | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/story-architect` | story-architect | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/writing/skills/fictional/world-builder` | world-builder | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/git/cleanup-merged` | cleanup-merged | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/git/pr` | pr | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/publishing-with-release-please-and-moonrepo-on-github-actions` | publishing-with-release-please-and-moonrepo-on-github-actions | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports` | writing-reports | Use the existing owner ticket. |
| `mise/conf.d/devtools-agent/bundles/creator/skills/comfy-director` | comfy-director | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/cloudflare-api` | cloudflare-api | Request a separate owner-specific ticket. |
| `mise/conf.d/devtools-agent/bundles/agent-core/skills/research` | structured-research | Request a separate owner-specific ticket. |

Known external families remain undeclared where the exact definition or supported version is unresolved. One sourceRepository per manifest also limits mixed-upstream declarations. to-spec and to-tickets retain stale v1 output instructions while the tracker owner emits v2; resolve that caller guidance through the owning migration stream. No full-coverage success is claimed.

### Missing manifests

```text
mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/converting-and-parsing-documents/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-text-audit/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/research/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfy-director/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfyui/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/web-design/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-agentic-search/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-confluence/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-context-discovery/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-engineering-work/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-jira/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-jira-resolve-merged-work/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-operational-health/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-responsibility-routing/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/atlassian/twg-status-rollups/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/troubleshooting/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/publishing-with-release-please-and-moonrepo-on-github-actions/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberpunk-help/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-backstory/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-conflicts/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-crashes/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-netsec/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-recommends/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-saves/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-tweaks/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/project/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/ttrpg-gm/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/cleanup-merged/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/pr/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/code-review/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/domain-modeling/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/teach/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/triage/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/db-seed/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/hono-api-scaffolder/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/proxmox-skill-robnew/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/proxmox-skill-sunwood/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/home-assistant-best-practices/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/home-assistant-cli-ops/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/canon-steward/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/character-designer/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/continuity-keeper/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/faction-designer/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/narrative-repo-setup/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/story-architect/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/world-builder/contracts.json
```

## Changed files

```text
mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/asd-ste100/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/explain/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-1/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-2/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-3/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-5/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-code/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/lynx-web-search/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/mq-query/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/review-documentation/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/searxng-web-search/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/how-to-validate-contracts.md
mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-hunter/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/sop-authoring/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/sop-maintenance/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/sop-rfc2119/contracts.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/sop-structure/contracts.json
mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfy-build/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfy-debug/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfy-deploy/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfy-relay/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/comfy/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/generate-images-with-takumi/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/html-artifact/contracts.json
mise/conf.d/devtools-agent/bundles/creator/skills/minimax-music-gen/contracts.json
mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/a11y-debugging/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/agent-browser/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/chrome-devtools-cli/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/chrome-devtools/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/cookie-debugging/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/debug-optimize-lcp/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/firefox-devtools/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/memory-leak-debugging/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/browsers/surf/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/bats-testing/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/code-comments/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/codemapper/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/create-new-bun-package-repo/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/creating-cli-tools/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/dead-code-sweep/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/outline-wiki-reports/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/release-please/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/devtools/termscope/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-feedback/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-hotkeys/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-modbase/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-reports/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-reshade/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-sitebuilder/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/cyberwise-wiki/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/2d-essentials/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/3d-essentials/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/ability-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/addon-development/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/ai-navigation/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/animation-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/assets-pipeline/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/audio-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/beehave/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/camera-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/component-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/csharp-godot/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/csharp-signals/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/dedicated-server/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/dependency-injection/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/dialogue-manager/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/dialogue-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/event-bus/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/export-pipeline/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/gdextension/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/gdscript-advanced/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/gdscript-patterns/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-brainstorming/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-code-review/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-debugging/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-mentor/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-optimization/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-project-setup/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-testing/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/godot-ui/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/hud-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/input-handling/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/inventory-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/limboai/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/localization/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/math-essentials/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/mobile-development/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/multiplayer-basics/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/multiplayer-sync/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/multithreading/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/particles-vfx/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/phantom-camera/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/physics-system/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/player-controller/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/popochiu/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/procedural-generation/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/resource-pattern/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/responsive-ui/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/save-load/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/scene-organization/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/shader-basics/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/state-machine/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/tween-animation/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/using-godot-prompter/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/godot/xr-development/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/shader-effects/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/shader-fundamentals/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/shader-noise/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/shader-router/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/game-dev/webgl/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/commit/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktrunk/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/shells/creating-herdr-app-mods/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/shells/neovim/lazy-nvim-optimization/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/shells/neovim/neovim-best-practices/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/shells/zellij/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/software-design/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/basic-design-principles/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/cyberpunk-ui/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/feature-arch/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/framer-motion-animator/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/frontend-design/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/frontend-patterns/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/gsap-framer-scroll-animation/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/playwright/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/react-doctor/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/react-hook-form/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/react-patterns/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/react/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/shadcn-installing-components/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/shadcn/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/tailwind/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/tanstack-query/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/test-driven-development/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/typescript/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/ui-design/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/ux-preview/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/uidev/vitest/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/ask-matt/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/codebase-design/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/diagnosing-bugs/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/feature-request/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/grill-me/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/grill-with-docs/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/grilling/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/handoff/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/implement/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/improve-codebase-architecture/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/prototype/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/research/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/resolving-merge-conflicts/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/setup-matt-pocock-skills/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/tdd/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/to-questionnaire/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/to-spec/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/to-tickets/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/wait-what/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/wayfinder/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/wizard/contracts.json
mise/conf.d/devtools-agent/bundles/matt-pocock/skills/writing-for-agents/contracts.json
mise/conf.d/devtools-agent/bundles/platform/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/cloudflare-api/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/cloudflare-worker-builder/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/d1-drizzle-schema/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/d1-migration/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/tanstack-start/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/cloudflare/vite-flare-starter/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/github-settings-as-code/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/mise/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/mise/writing-mise-file-tasks/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/adding-new-tasks/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/create-project/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/optimise-tasks/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/project-generators/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/proto-non-wasm-plugin/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/run-tasks/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/moonrepo/with-bun/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/pi-mono/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/pi-mono/creating-pi-extensions/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/pi-mono/downloading-pi-extensions/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/devtools/pi-mono/working-with-pi-coding-agent-shared-sessions/contracts.json
mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-router/contracts.json
mise/conf.d/devtools-agent/bundles/writing/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/writing/skills/better-writing/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/aussie-business-english/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/award-application/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/nz-business-english/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/proposal-writer/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/resume-cover-letter/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/strategy-document/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/uk-business-english/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/business/us-business-english/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/arc-cartographer/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/ask-narrative/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/grill-with-narrative-rules/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/narrative-publishing-manager/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/narrative-session-recorder/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/narrative-style-editor/contracts.json
mise/conf.d/devtools-agent/bundles/writing/skills/fictional/plot-doctor/contracts.json
```

## Consumed and produced references

- **Ticket:** `tracker/tickets/skill-contract-manifests-18-manifest-coverage.md`
- **Initiative:** `tracker/initiatives/skill-contract-manifests/index.md`
- **Parent receipt:** `workflows/skill-contract-manifests-18-manifest-coverage/events/start-0001.yaml`
- **Result receipt:** `workflows/skill-contract-manifests-18-manifest-coverage/events/implementation-0002.yaml`
- **Coverage evidence:** `workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage/coverage-inventory.json`
- **Owner requests:** `workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage/owner-requests.json`
- **PR draft:** `workflows/skill-contract-manifests-18-manifest-coverage/artifacts/snapshots/pr-draft-implementation-0002.md`
- **Current views:** `workflows/skill-contract-manifests-18-manifest-coverage/manifest.yaml`, `workflows/skill-contract-manifests-18-manifest-coverage/projections/latest-status.yaml`, `workflows/skill-contract-manifests-18-manifest-coverage/projections/implementation-log.md` and `workflows/skill-contract-manifests-18-manifest-coverage/projections/pr-draft.md`

## Publication

Source and context metadata use separate commits. Neither source nor context is pushed. The parent must publish only the relevant history and finalize its parent completion. The ticket stays claimed; do not merge, finish or mark it completed.

