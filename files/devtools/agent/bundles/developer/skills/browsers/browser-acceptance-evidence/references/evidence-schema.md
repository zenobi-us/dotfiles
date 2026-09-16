# evidence.jsonl contract

One JSON object per line, appended at the moment the step is taken. Never
written in bulk at the end from memory.

The file lives at `<root>/<work-id>/manual-tests/evidence.jsonl`. Screenshot
paths are relative to the report directory, so they can be copied straight into
the report without rewriting.

## Record

```json
{
  "test": "1",
  "step": "1.4",
  "action": "click",
  "target": "link \"Upgrade now\"",
  "resolved": "a[href='https://portal.example.invalid/']",
  "url": "http://localhost:8090/app/settings/payments",
  "screenshot": "shots/14-upgrade-banner.png",
  "observed": "Anchor carries an href. Click navigated to the portal login.",
  "verdict": "PASS",
  "note": ""
}
```

## Fields

| Field | Required | Meaning |
|---|---|---|
| `test` | yes | Test number from `test-plan.md`. Groups records into report sections. |
| `step` | yes | Step number from the plan, `<test>.<step>`. Must exist in the plan. |
| `action` | yes | `navigate`, `click`, `type`, `read`, `screenshot`, `assert`, `wait`. |
| `target` | yes | What you aimed at, as written in the command. |
| `resolved` | yes for `click` and `type` | What the target actually resolved to: a CSS selector, an `href`, a test id. A tool ref such as `e46` alone is **not** acceptable. |
| `url` | yes | The URL at the moment of the step. Proves which page and which tenant. |
| `screenshot` | yes for every step with a verdict | Path, relative to the report directory. |
| `observed` | yes | What actually happened, in the past tense. Not what you expected. |
| `verdict` | yes for the last step of a test, optional otherwise | See below. |
| `note` | no | Supporting evidence for a `PARTIAL`, or the reason for a `BLOCKED`. |

## Verdicts

| Verdict | Meaning | Report badge |
|---|---|---|
| `PASS` | The plan's PASS line was observed, with a screenshot. | `badge--pass` |
| `FAIL` | The plan's FAIL line was observed. Say in `note` who owns it. | `badge--fail` |
| `PARTIAL` | Partly proved. The remaining proof needs a human, or another tool. `note` **MUST** say exactly what is still needed. | `badge--info` |
| `BLOCKED` | A precondition was not met, so the test never ran. `note` **MUST** name the precondition. | `badge--info` |
| `WARN` | A defect found on the side, unrelated to the change under test. | `badge--warn` |

There is no sixth verdict. "Probably fine" is `PARTIAL`.

## Screenshot naming

`shots/NN-slug.png`, where `NN` orders the shots as the reader meets them and
leaves gaps for later inserts.

Derive `NN` from the step: step `1.4` becomes `14-`, step `2.1` becomes `21-`.
The slug says what is in the picture, not what it proves.

```
shots/10-login.png
shots/14-upgrade-banner.png
shots/21-help-link.png
shots/31-RESULT-missing.png
```

## Worked fragment

```jsonl
{"test":"1","step":"1.1","action":"navigate","target":"/app/settings/payments","resolved":"","url":"http://localhost:8090/app/settings/payments","screenshot":"shots/11-settings.png","observed":"Page rendered blank.","verdict":"","note":""}
{"test":"1","step":"1.2","action":"assert","target":"precondition: feature flag on","resolved":"config.local.js -> {\"feature_x\":true}","url":"http://localhost:8090/app/settings/payments","screenshot":"shots/12-config.png","observed":"Flag was off. Enabled it locally and restarted the server.","verdict":"","note":"override recorded in Test data left behind"}
{"test":"1","step":"1.3","action":"read","target":"banner heading","resolved":"h2.banner__title","url":"http://localhost:8090/app/settings/payments","screenshot":"shots/13-banner.png","observed":"Banner rendered after the flag was enabled.","verdict":"","note":""}
{"test":"1","step":"1.4","action":"click","target":"link \"Upgrade now\"","resolved":"a[href='https://portal.example.invalid/']","url":"https://auth.example.invalid/login?redirect_url=...","screenshot":"shots/14-portal.png","observed":"Navigated to the portal, which redirected to its login.","verdict":"PASS","note":""}
```
