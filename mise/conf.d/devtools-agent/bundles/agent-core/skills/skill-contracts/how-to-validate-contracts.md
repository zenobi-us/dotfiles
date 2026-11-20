---
title: Validate installed skill contracts
---

1. Resolve the installed skill-contracts directory as SKILL_CONTRACTS_ROOT.
2. Run "$SKILL_CONTRACTS_ROOT/scripts/router.ts" validate --skill /absolute/installed/owner-skill from any directory.
3. If validation fails, correct contracts.json or restore the declared authoritative definitions. Do not interpret partial declarations.
4. Run "$SKILL_CONTRACTS_ROOT/scripts/router.ts" resolve --skill /absolute/installed/owner-skill --contract example-record/v1 to read a definition.
5. For historical definitions, declare sourceRepository and use git:<full-commit>:<repository-path>. Use an absolute repository path or repository URL. The resolver fetches that exact commit without checkout changes.
6. If historical content is unavailable, restore source access. Keep the declared pin.
7. Before an authorized mutation, follow [safe upgrades](references/upgrades.md). Supply owner content validators, preservation checks, immutable classification, operation destinations, and conversion procedures. Read-only validation and resolution never execute upgrades.
