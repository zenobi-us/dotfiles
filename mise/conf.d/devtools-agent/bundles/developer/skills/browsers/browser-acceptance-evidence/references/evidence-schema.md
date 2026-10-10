# evidence.jsonl contract

One JSON object per line, at `<root>/<work-id>/manual-tests/evidence.jsonl`.

`acceptance.ts run` writes this file. You **MUST NOT** hand-write or edit a
record, with the one exception in "Adding a WARN" below. The fields come from
the live run — the URL the page was actually on, the markup the locator
actually matched, the message the assertion actually threw — which is what
stops a tool ref and a remembered observation reaching a report.

The compiler emits the `E.push({...})` calls into the driver script, so the
records are produced at the moment of the step, not reconstructed afterwards.

Screenshot paths are relative to the report directory, so they are copied into
the report without rewriting.

## Record

```json
{
  "test": "1",
  "step": "1.3",
  "action": "click",
  "target": "a[data-testid=upgrade]",
  "resolved": "<a data-testid=\"upgrade\" href=\"/portal\">Upgrade now</a>",
  "url": "http://localhost:8099/portal",
  "screenshot": "shots/14-portal.png",
  "observed": "Clicked.",
  "verdict": "",
  "note": ""
}
```

## Fields

| Field | Source | Meaning |
|---|---|---|
| `test` | plan | Test id. Groups records into report sections. |
| `step` | plan position | `<test>.<n>`, from the step's index. Always exists in the plan. |
| `action` | plan | `navigate`, `click`, `type`, `read`, `assert`. |
| `target` | plan | The locator or URL as the plan wrote it. |
| `resolved` | **live** | What the locator matched: the element's own markup for a `click`, the attribute or text for a `capture`, the URL for a url assertion. Empty for `navigate`. |
| `url` | **live** | `page.url()` at the moment of the step. Proves which page and which tenant. |
| `screenshot` | derived | `shots/NN-slug.png`, or empty when the step declared no `shot`. |
| `observed` | **live** | What happened, past tense. On a failure this is the `ASSERT FAIL` message, with the expected and found values in it. |
| `verdict` | runner | Set on the last record of a test, and on any `human` step. Empty elsewhere. |
| `note` | runner | The FAIL line for a `FAIL`, the unmet precondition for a `BLOCKED`, what is still owed for a `PARTIAL`. |

`resolved` carries real markup rather than a tool ref on purpose. A ref such as
`f1e13` or `e46` is valid only inside one page read, and means nothing to the
next reader.

## Verdicts

The runner decides these. The table is in the skill's step 4.

| Verdict | Set when | Report badge |
|---|---|---|
| `PASS` | The driver exited zero and a screenshot exists. | `badge--pass` |
| `FAIL` | The driver exited non-zero. `observed` is the assertion message. | `badge--fail` |
| `PARTIAL` | A `human` step was reached, or the run passed with no screenshot. | `badge--info` |
| `BLOCKED` | A `requires:` precondition check failed, so the test never ran. | `badge--info` |
| `WARN` | Never set by the runner. See below. | `badge--warn` |

There is no sixth verdict. "Probably fine" is `PARTIAL`.

A test can carry at most one verdict. When records disagree, the report takes
the worst: `FAIL`, then `BLOCKED`, then `PARTIAL`, then `PASS`.

## Adding a WARN

`WARN` is a defect you noticed on the side, unrelated to the change under test.
The runner cannot see one, so this is the only record you append by hand:

```sh
cat >> evidence.jsonl <<'JSON'
{"test":"2","step":"2.3","action":"assert","target":"console","resolved":"","url":"http://localhost:8099/settings","screenshot":"shots/23-console.png","observed":"The page logged a 404 for /api/prefs on every load.","verdict":"WARN","note":"Unrelated to this change. Pre-dates the branch."}
JSON
```

It **MUST** carry a `screenshot` like any other claim, and its `note` **MUST**
say why it is unrelated to the work under test. Re-run `acceptance.ts report`
afterwards so the page picks it up.

## Screenshot naming

`shots/NN-slug.png`. `acceptance.ts` derives `NN` from the step, so a shot
cannot be filed under the wrong one: step `1.4` becomes `14-`, step `2.1`
becomes `21-`. The slug is the `shot` field in the plan, and it says what is in
the picture, not what it proves.

```
shots/11-settings.png
shots/14-portal.png
shots/22-banner.png
```

## Worked fragment

Real output, from a four-test run against a local fixture. Test 1 passes on its
last step; test 2 fails its assertion; test 3 never ran.

```jsonl
{"test":"1","step":"1.1","action":"navigate","target":"/settings","resolved":"","url":"http://localhost:8099/settings","screenshot":"shots/11-settings.png","observed":"Page loaded.","verdict":"","note":""}
{"test":"1","step":"1.2","action":"read","target":"a[data-testid=upgrade]","resolved":"/portal","url":"http://localhost:8099/settings","screenshot":"","observed":"Read: /portal","verdict":"","note":""}
{"test":"1","step":"1.3","action":"click","target":"a[data-testid=upgrade]","resolved":"<a data-testid=\"upgrade\" href=\"/portal\">Upgrade now</a>","url":"http://localhost:8099/portal","screenshot":"","observed":"Clicked.","verdict":"","note":""}
{"test":"1","step":"1.4","action":"assert","target":"url ~ /portal","resolved":"http://localhost:8099/portal","url":"http://localhost:8099/portal","screenshot":"shots/14-portal.png","observed":"URL matched: http://localhost:8099/portal","verdict":"","note":""}
{"test":"1","step":"1.5","action":"assert","target":"#portal-title","resolved":"<h1 id=\"portal-title\">Billing portal</h1>","url":"http://localhost:8099/portal","screenshot":"","observed":"Found text: Billing portal","verdict":"PASS","note":""}
{"test":"2","step":"2.2","action":"assert","target":"the banner says Invoices","resolved":"","url":"","screenshot":"shots/22-banner.png","observed":"ASSERT FAIL 2.2: expected \"Invoices\", got \"Payments\"","verdict":"FAIL","note":"FAIL line: the banner says something else"}
{"test":"3","step":"3.1","action":"assert","target":"precondition","resolved":"","url":"","screenshot":"","observed":"The test did not run.","verdict":"BLOCKED","note":"feature_y is on — found \"absent\""}
```

A `FAIL` record keeps the screenshot taken before the assertion threw, because
the compiler emits the shot ahead of the step that can fail. A verdict with no
image is worth less than one with it, on the failure path as much as the
success path.
