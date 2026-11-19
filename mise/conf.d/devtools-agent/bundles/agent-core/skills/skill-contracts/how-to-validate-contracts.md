---
title: Validate installed skill contracts
---
1. Resolve the installed skill-contracts directory as SKILL_CONTRACTS_ROOT.
2. Run "$SKILL_CONTRACTS_ROOT/scripts/router.ts" validate --skill /absolute/installed/owner-skill from any working directory.
3. If the command fails, correct contracts.json or install the missing authoritative definitions. Do not interpret a partial declaration.
4. Run "$SKILL_CONTRACTS_ROOT/scripts/router.ts" resolve --skill /absolute/installed/owner-skill --contract example-record/v1 to read a definition.
5. For historical definitions, declare sourceRepository and use git:<full-commit>:<repository-path>. Supply an absolute repository path or repository URL. The command fetches the exact commit into a temporary bare repository without changing a checkout.
6. If historical content is unavailable, restore access to the declared repository or object. Do not substitute another revision.
7. Use the owning skill's validator to check artifact content before an authorised mutation. These commands do not execute upgrades.

