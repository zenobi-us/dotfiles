---
title: Validate installed skill contracts
---
1. Resolve the installed skill-contracts directory as SKILL_CONTRACTS_ROOT.
2. Run "$SKILL_CONTRACTS_ROOT/scripts/router.ts" validate --skill /absolute/installed/owner-skill from any working directory.
3. If the command fails, correct contracts.json or install the missing authoritative definitions. Do not interpret a partial declaration.
4. Run "$SKILL_CONTRACTS_ROOT/scripts/router.ts" resolve --skill /absolute/installed/owner-skill --contract example-record/v1 to read a definition.
5. Use the owning skill's validator to check artifact content before an authorised mutation. These commands do not execute upgrades.

