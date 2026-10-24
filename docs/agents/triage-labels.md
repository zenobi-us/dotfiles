# Triage labels

Store the mapped value in the ticket's `triage` field. Each triaged ticket has one triage role. Keep its category in `type`.

| Role | Local value | Meaning |
|---|---|---|
| `needs-triage` | `needs-triage` | A maintainer must evaluate the ticket. |
| `needs-info` | `needs-info` | The ticket needs more information. |
| `ready-for-agent` | `ready-for-agent` | An agent can implement the specified work. |
| `ready-for-human` | `ready-for-human` | A human must implement the work. |
| `wontfix` | `wontfix` | The work will not proceed. |

Use `bug` or `enhancement` as the category when applicable. Triage does not change `work_status`.

