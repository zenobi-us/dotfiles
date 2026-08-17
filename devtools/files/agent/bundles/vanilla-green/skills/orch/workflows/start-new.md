# Start New Workflow

Create one issue, then route through `orch start`.

## Inputs

| Command | Flow |
|---------|------|
| `start new linear [title]` | Create Linear issue |
| `start new github OWNER/REPO [title]` | Create GitHub issue |

## 1. Confirm Scope

Ask only for missing details: title, expected outcome, tracker, project/repo, labels.

## 2. Create Issue

### Linear

```bash
.agents/skills/linear/scripts/linear.sh issues create \
  --title "[TITLE]" \
  --description "[BODY]" \
  --project "[PROJECT]" \
  --labels "[LABELS]" \
  --format=ids
```

### GitHub

```bash
gh issue create --repo [OWNER/REPO] --title "[TITLE]" --body "[BODY]" --label "[LABELS]"
```

## 3. Route

Invoke `workflows/start.md` with the created issue.

<output_format>
### Milestone: Issue Created

| Field | Value |
|-------|-------|
| Tracker | [linear|github] |
| Issue | [ID or URL] |
| Next | `orch start [ID]` |
</output_format>
