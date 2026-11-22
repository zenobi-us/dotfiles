# Proposed action records

Contract: `grooming-actions/v2`. Owner: backlog-grooming.

The JSON object declares `schemaVersion: grooming-actions/v2` and `tickets`, an array with the ticket and action fields from [v1](actions-v1.md). The envelope replaces the historical bare array. It preserves ticket order, action order, identities, verdicts, details, and unknown fields. `readActions` validates content. Unknown explicit identifiers, invalid fields, and duplicate identities are errors. Numeric metadata must have an exact JSON representation.

`render` produces this envelope. `check-actions <file>` validates current or historical records and prints their ticket list without changing bytes or applying actions. Consumers must run this command before asking for action selection. An action identity is the pair `(ticket, id)`, never an array position. User selection and the ticket skill remain required before tracker mutation.
