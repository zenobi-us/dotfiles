# Lossless configuration upgrades

Convert shared-context-routes/v2 to shared-context-routes/v3, or shared-context-layout/v1 to shared-context-layout/v2. Validate the exact source first. Replace only the top-level numeric schema assignment with the declared schemaVersion assignment. Preserve comments, unknown route metadata, ordering, whitespace outside that assignment, and all configured values. Reject alternate header syntax that cannot be replaced without a decision. Validate the destination and compare parsed meaning plus normalized authored text before persistence.

Only the installed scripts/shared-context/contracts.ts adapter executes this procedure. The shared skill-contracts writer owns locking, file identity checks, atomic replacement, and bulk partial outcomes. Event and artifact paths are immutable. Read-only commands never invoke conversion. Configuration content upgrade does not authorize storage migration.
