# Historical proposed actions

Contract: `grooming-actions/v1`. Owner: backlog-grooming.

An unversioned JSON array contains ticket records in report order. Each ticket has nonempty `ticket` and `title`, `verdict` (`groomed`, `clarify`, `cancel`, or `action`), and `proposed_actions`. Each action has nonempty `id` and `summary`, string `detail`, and `kind` (`comment`, `estimate`, `update`, `transition`, `link`, `create`, or `label`). Ticket identities are unique. Action identities are unique within each ticket. Unknown fields are authored content. `readActions` validates this exact shape. This is input-only; use [v2](actions-v2.md) for new outputs.
