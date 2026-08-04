// Benchmark-lite portable export source. Downstream copies are generated; edit
// this file only in the benchmark repository.
export function renderBenchmarkLiteReport(result) {
  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const fmt = new Intl.NumberFormat("en-US");
  const compactFmt = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  });
  const quality = result?.quality;
  const classification = quality?.classification;
  const qualitySummary = quality?.summary;
  const qualityNotEvaluated = !quality;

  const numberMetric = (value, formatter = (item) => fmt.format(item)) =>
    Number.isFinite(value) ? formatter(value) : "Not measured";
  const compactMetric = (value) =>
    numberMetric(value, (item) => compactFmt.format(item));
  const durationMetric = (value) =>
    numberMetric(value, (item) =>
      item >= 1000
        ? `${(item / 1000).toFixed(item >= 10000 ? 0 : 1)}s`
        : `${Math.round(item)}ms`,
    );
  const cardDurationMetric = (value) =>
    numberMetric(value, (item) => {
      if (item < 1000) return `${Math.round(item)}ms`;
      const totalSeconds = Math.round(item / 1000);
      if (totalSeconds < 60) return `${totalSeconds}s`;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
    });
  const yesNo = (value) =>
    typeof value === "boolean" ? (value ? "Yes" : "No") : "Not measured";
  const titleCase = (value) =>
    String(value ?? "")
      .replace(/([a-z])([A-Z])/gu, "$1 $2")
      .split(/[-_\s]+/u)
      .filter(Boolean)
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
      .join(" ");
  const classificationLabels = {
    equivalent: "Equivalent",
    "twg-better": "TWG better",
    "control-better": "Standard better",
    "capability-gain": "Capability gain",
    "not-comparable": "Not comparable",
  };
  const outcomeLabels = {
    equivalent: "Tie",
    "twg-better": "TWG",
    "control-better": "Standard",
    "capability-gain": "TWG",
    "not-comparable": "Tie",
  };
  const dimensionWinnerLabels = {
    test: "TWG",
    treatment: "TWG",
    twg: "TWG",
    control: "Standard",
    standard: "Standard",
    tie: "Tie",
  };
  const qualityClassificationLabel = qualityNotEvaluated
    ? ""
    : (classificationLabels[classification] ?? titleCase(classification));
  const signedDelta = (
    test,
    control,
    formatter = (item) => fmt.format(item),
  ) => {
    if (!Number.isFinite(test) || !Number.isFinite(control))
      return "Not measured";
    const delta = test - control;
    if (delta === 0) return "0";
    return `${delta > 0 ? "+" : "-"}${formatter(Math.abs(delta))}`;
  };
  const tokenValue = (arm, key = "displayTokens") => {
    if (key === "displayTokens") {
      const displayValue =
        arm?.tokenUsage?.displayTokens ?? arm?.tokenUsage?.nonCachedTokens;
      if (Number.isFinite(displayValue)) return displayValue;
      return Number.isFinite(arm?.tokens) ? arm.tokens : null;
    }
    const value = arm?.tokenUsage?.[key];
    if (Number.isFinite(value)) return value;
    return key === "totalTokens" && Number.isFinite(arm?.tokens)
      ? arm.tokens
      : null;
  };
  const tokenRow = (label, key) => [
    label,
    compactMetric(tokenValue(result?.control, key)),
    compactMetric(tokenValue(result?.test, key)),
    signedDelta(
      tokenValue(result?.test, key),
      tokenValue(result?.control, key),
      (item) => compactFmt.format(item),
    ),
  ];
  const percentChange = (test, control) => {
    if (!Number.isFinite(test) || !Number.isFinite(control) || control === 0)
      return null;
    return (Math.abs(test - control) / Math.abs(control)) * 100;
  };
  const formatPercentChange = (value) => {
    if (!Number.isFinite(value)) return "";
    if (value > 0 && value < 1) return "<1%";
    return `${Math.round(value)}%`;
  };
  const isNeutralDelta = (test, control, neutralPercent = 2) => {
    const pct = percentChange(test, control);
    return pct !== null && pct <= neutralPercent;
  };
  const lowerIsBetterDelta = (
    test,
    control,
    formatter,
    betterText,
    worseText,
  ) => {
    if (!Number.isFinite(test) || !Number.isFinite(control)) {
      return { text: "Not measured", tone: "neutral" };
    }
    const delta = test - control;
    if (delta === 0) return { text: "same as control", tone: "neutral" };
    const pct = percentChange(test, control);
    const amount = formatter(Math.abs(delta));
    if (isNeutralDelta(test, control)) {
      const pctText = pct === null ? "" : ` · ${formatPercentChange(pct)} change`;
      return {
        text: `About the same as control · ${amount} difference${pctText}`,
        tone: "neutral",
      };
    }
    const pctText = pct === null ? "" : ` · ${formatPercentChange(pct)}`;
    return delta < 0
      ? {
          text: `${amount} ${betterText}${pctText} better vs control`,
          tone: "positive",
        }
      : {
          text: `${amount} ${worseText}${pctText} worse vs control`,
          tone: "negative",
        };
  };
  const tokenEfficiencyDelta = (test, control) => {
    if (!Number.isFinite(test) || !Number.isFinite(control)) {
      return { text: "Not measured", tone: "neutral" };
    }
    const delta = test - control;
    if (delta === 0) return { text: "same as control", tone: "neutral" };
    const pct = percentChange(test, control);
    const amount = compactMetric(Math.abs(delta));
    const direction = delta < 0 ? "less" : "more";
    const canClaimObservedSavings =
      result?.integrity?.valid === true &&
      (classification === "equivalent" || classification === "twg-better");
    if (isNeutralDelta(test, control)) {
      const pctText = pct === null ? "" : ` · ${formatPercentChange(pct)} change`;
      return {
        text: `About the same as control · ${amount} ${direction} tokens${pctText}`,
        tone: "neutral",
      };
    }
    const pctText = pct === null ? "" : ` · ${formatPercentChange(pct)}`;
    if (delta < 0 && !canClaimObservedSavings) {
      return {
        text: `${amount} less${pctText} token delta observed; savings not claimed`,
        tone: "neutral",
      };
    }
    return delta < 0
      ? {
          text: `${amount} less${pctText} more efficient over control`,
          tone: "positive",
        }
      : {
          text: `${amount} more${pctText} less efficient than control`,
          tone: "negative",
        };
  };
  const timeSummary = lowerIsBetterDelta(
    result?.test?.durationMs,
    result?.control?.durationMs,
    cardDurationMetric,
    "faster",
    "slower",
  );
  const tokenSummary = tokenEfficiencyDelta(
    tokenValue(result?.test),
    tokenValue(result?.control),
  );
  const surfaceList = (items) =>
    Array.isArray(items) && items.length > 0
      ? items.join(", ")
      : "Not recorded";
  const areaCounts = (items) => {
    const counts = new Map();
    if (Array.isArray(items)) {
      for (const item of items) {
        const area = item?.area || "other";
        counts.set(area, (counts.get(area) ?? 0) + 1);
      }
    }
    return counts;
  };
  const controlAreas = areaCounts(result?.control?.toolCallLog);
  const testAreas = areaCounts(result?.test?.toolCallLog);
  const allAreas = [
    ...new Set([...controlAreas.keys(), ...testAreas.keys()]),
  ].sort();
  const qualityLabel = qualityNotEvaluated
    ? "Not evaluated"
    : (outcomeLabels[classification] ?? "Tie");
  const qualityNote = qualityNotEvaluated
    ? "No judge, quality file, or manual quality review was supplied."
    : qualitySummary;
  const judgeAgentLabel = titleCase(quality?.judge?.agent ?? "judge");
  const judgeDetails = [
    `Judged by ${judgeAgentLabel}`,
    quality?.judge?.model ? String(quality.judge.model) : "",
    quality?.judge?.effort ? `reasoning ${quality.judge.effort}` : "",
  ].filter(Boolean);
  const qualitySourceLabel = qualityNotEvaluated
    ? "Not evaluated"
    : quality?.source === "judge"
      ? [`Judge classification: ${qualityClassificationLabel}`, judgeDetails.join(" / ")]
          .filter(Boolean)
          .join(" · ")
      : quality?.source === "manual"
        ? `Manual review · Classification: ${qualityClassificationLabel}`
        : `Quality file · Classification: ${qualityClassificationLabel}`;
  const qualityCardMeta = qualityNotEvaluated
    ? "Not evaluated"
    : quality?.source === "judge"
      ? `${judgeAgentLabel} judge`
      : quality?.source === "manual"
        ? "Manual review"
        : "Quality file";

  const metricRows = [
    [
      "Status",
      result?.control?.status ?? "unknown",
      result?.test?.status ?? "unknown",
      "-",
    ],
    [
      "Source",
      result?.control?.source ?? "unknown",
      result?.test?.source ?? "unknown",
      "-",
    ],
    [
      "Tool surface",
      surfaceList(result?.control?.toolSurface),
      surfaceList(result?.test?.toolSurface),
      "-",
    ],
    [
      "Data returned",
      yesNo(result?.control?.dataReturned),
      yesNo(result?.test?.dataReturned),
      "-",
    ],
    tokenRow("Tokens", "displayTokens"),
    [
      "Tool calls",
      numberMetric(result?.control?.toolCalls),
      numberMetric(result?.test?.toolCalls),
      signedDelta(result?.test?.toolCalls, result?.control?.toolCalls),
    ],
    [
      "TWG calls",
      numberMetric(result?.control?.twgCalls),
      numberMetric(result?.test?.twgCalls),
      signedDelta(result?.test?.twgCalls, result?.control?.twgCalls),
    ],
    [
      "Tool errors",
      numberMetric(result?.control?.toolErrors),
      numberMetric(result?.test?.toolErrors),
      signedDelta(result?.test?.toolErrors, result?.control?.toolErrors),
    ],
    [
      "Duration",
      durationMetric(result?.control?.durationMs),
      durationMetric(result?.test?.durationMs),
      signedDelta(
        result?.test?.durationMs,
        result?.control?.durationMs,
        durationMetric,
      ),
    ],
    [
      "Output chars",
      compactMetric(result?.control?.outputChars),
      compactMetric(result?.test?.outputChars),
      signedDelta(
        result?.test?.outputChars,
        result?.control?.outputChars,
        (item) => compactFmt.format(item),
      ),
    ],
  ];

  const metricTable = metricRows
    .map(
      ([label, control, test, delta]) => `<tr>
        <th scope="row">${escapeHtml(label)}</th>
        <td>${escapeHtml(control)}</td>
        <td>${escapeHtml(test)}</td>
        <td>${escapeHtml(delta)}</td>
      </tr>`,
    )
    .join("");

  const coverageTable =
    allAreas.length === 0
      ? `<p class="empty">No tool-call areas were recorded.</p>`
      : `<table>
          <thead>
            <tr><th>Area</th><th>${escapeHtml(result?.control?.label ?? "Control")}</th><th>${escapeHtml(
              result?.test?.label ?? "Test",
            )}</th></tr>
          </thead>
          <tbody>
            ${allAreas
              .map(
                (area) => `<tr>
                  <th scope="row">${escapeHtml(area)}</th>
                  <td>${fmt.format(controlAreas.get(area) ?? 0)}</td>
                  <td>${fmt.format(testAreas.get(area) ?? 0)}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`;

  const toolCallRows = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return `<p class="empty">No tool call details recorded.</p>`;
    }
    return `<table class="tool-table">
      <thead>
        <tr><th>#</th><th>Tool</th><th>Area</th><th>Duration</th><th>Result</th></tr>
      </thead>
      <tbody>
        ${items
          .map((item) => {
            const flags = [
              item?.twg ? "TWG" : "",
              item?.error ? "Error" : "OK",
            ].filter(Boolean);
            return `<tr>
              <td>${escapeHtml(item?.index ?? "")}</td>
              <td><code>${escapeHtml(item?.name ?? "tool call")}</code><span>${escapeHtml(
                item?.surface ?? "agent-tool",
              )}</span></td>
              <td>${escapeHtml(item?.area ?? "other")}</td>
              <td>${escapeHtml(durationMetric(item?.durationMs))}</td>
              <td><span class="${item?.error ? "pill danger" : "pill"}">${escapeHtml(
                flags.join(" / "),
              )}</span></td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;
  };

  const armOutput = (title, data) => `<details>
    <summary>${escapeHtml(title)} output <span>${escapeHtml(
      compactMetric(data?.outputChars),
    )} chars</span></summary>
    <pre>${escapeHtml(data?.output ?? "")}</pre>
  </details>`;

  const checkRows = Object.entries(result?.integrity?.checks ?? {})
    .map(
      ([name, value]) => `<tr>
        <th scope="row">${escapeHtml(titleCase(name))}</th>
        <td><span class="${value ? "pill success" : "pill danger"}">${value ? "Pass" : "Review"}</span></td>
      </tr>`,
    )
    .join("");

  const qualityDimensionRows =
    qualityNotEvaluated ||
    !Array.isArray(quality?.dimensions) ||
    quality.dimensions.length === 0
      ? `<p class="empty">${
          qualityNotEvaluated
            ? "Run with --judge or provide reviewed quality to populate this section."
            : "No structured quality dimensions were recorded."
        }</p>`
      : `<table>
          <thead>
            <tr><th>Dimension</th><th>Winner</th><th>Explanation</th></tr>
          </thead>
          <tbody>
            ${quality.dimensions
              .map(
                (dimension) => `<tr>
                  <th scope="row">${escapeHtml(dimension?.name ?? "")}</th>
                  <td>${escapeHtml(
                    dimensionWinnerLabels[String(dimension?.winner ?? "").toLowerCase()] ??
                      titleCase(dimension?.winner ?? ""),
                  )}</td>
                  <td>${escapeHtml(dimension?.explanation ?? "")}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TWG Bench Lite Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-subtle: #f8fafc;
      --border: #d9dee7;
      --border-strong: #c8d0dc;
      --text: #172033;
      --muted: #5b677a;
      --accent: #0c66e4;
      --accent-soft: #e9f2ff;
      --success: #0b6b3a;
      --success-soft: #e8f7ef;
      --danger: #a54800;
      --danger-soft: #fff1df;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    main { max-width: 1180px; margin: 0 auto; padding: 28px; }
    header, section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 18px;
    }
    header { padding: 28px; }
    section { padding: 24px; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { font-size: 2rem; line-height: 1.15; margin-bottom: 8px; }
    h2 { font-size: 1.05rem; margin-bottom: 14px; }
    h3 { font-size: 0.95rem; margin: 20px 0 10px; }
    p { color: var(--muted); }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.88rem;
      overflow-wrap: anywhere;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.94rem; }
    th, td { border-bottom: 1px solid var(--border); padding: 10px 12px; text-align: left; vertical-align: top; }
    thead th { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; }
    tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
    .kicker { color: var(--accent); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
    .header-row { display: flex; gap: 20px; justify-content: space-between; align-items: flex-start; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 9px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .pill.success { background: var(--success-soft); color: var(--success); }
    .pill.danger { background: var(--danger-soft); color: var(--danger); }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 24px;
    }
    .metric {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 22px;
      min-width: 0;
      box-shadow: 0 1px 2px rgb(9 30 66 / 0.04);
    }
    .metric span { display: block; color: var(--muted); font-size: 0.8rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 12px; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05; letter-spacing: 0; }
    .metric .delta { margin: 14px 0 0; font-size: 1rem; font-weight: 800; color: var(--muted); }
    .metric .delta.positive { color: var(--success); }
    .metric .delta.neutral { color: var(--muted); }
    .metric .delta.negative { color: #c9372c; }
    .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .prompt {
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      color: var(--text);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      margin: 0;
    }
    .meta { color: var(--muted); font-size: 0.86rem; margin-top: 10px; }
    .tool-table td:nth-child(1) { width: 44px; color: var(--muted); }
    .tool-table td:nth-child(4), .tool-table td:nth-child(5) { white-space: nowrap; }
    .tool-table td span:not(.pill) { display: block; color: var(--muted); font-size: 0.78rem; margin-top: 2px; }
    .scroll { max-height: 460px; overflow: auto; border: 1px solid var(--border); border-radius: 8px; }
    .scroll table th, .scroll table td { background: var(--surface); }
    .callout {
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .callout strong { display: block; margin-bottom: 4px; }
    details {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      margin-top: 12px;
    }
    summary {
      cursor: pointer;
      padding: 12px 14px;
      font-weight: 700;
    }
    summary span { color: var(--muted); font-weight: 500; margin-left: 8px; }
    pre {
      margin: 0;
      border-top: 1px solid var(--border);
      background: var(--surface-subtle);
      padding: 14px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-size: 0.9rem;
    }
    .empty { color: var(--muted); margin-bottom: 0; }
    footer { color: var(--muted); font-size: 0.84rem; padding: 0 2px 20px; }
    @media (max-width: 860px) {
      main { padding: 16px; }
      .header-row, .two-col { display: block; }
      .badges { justify-content: flex-start; margin-top: 14px; }
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      section { padding: 18px; }
      table { font-size: 0.88rem; }
      th, td { padding: 9px 8px; }
    }
    @media (max-width: 520px) {
      .summary-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="header-row">
        <div>
          <div class="kicker">TWG Bench Lite</div>
          <h1>Single Prompt Comparison</h1>
          <p>${escapeHtml(qualityNote)}</p>
        </div>
        <div class="badges">
          <span class="${result?.integrity?.valid ? "pill success" : "pill danger"}">Integrity: ${
            result?.integrity?.valid ? "Valid" : "Review needed"
          }</span>
        </div>
      </div>
      <div class="summary-grid">
        <div class="metric"><span>Quality review</span><strong>${escapeHtml(
          qualityLabel,
        )}</strong><p class="delta">${escapeHtml(qualityCardMeta)}</p></div>
        <div class="metric"><span>Avg tokens</span><strong>${escapeHtml(
          compactMetric(tokenValue(result?.test)),
        )}</strong><p class="delta ${tokenSummary.tone}">${escapeHtml(tokenSummary.text)}</p></div>
        <div class="metric"><span>Avg time</span><strong>${escapeHtml(
          cardDurationMetric(result?.test?.durationMs),
        )}</strong><p class="delta ${timeSummary.tone}">${escapeHtml(timeSummary.text)}</p></div>
      </div>
    </header>

    <section>
      <h2>Prompt</h2>
      <pre class="prompt">${escapeHtml(result?.prompt?.text ?? "")}</pre>
      <div class="meta">Prompt hash: ${escapeHtml(
        result?.prompt?.hash ?? result?.manifest?.promptHash ?? "unknown",
      )}</div>
    </section>

    <section>
      <h2>Quality Review</h2>
      <div class="callout">
        <strong>${escapeHtml(qualityLabel)}</strong>
        <p>${escapeHtml(qualityNote)}</p>
        <div class="meta">${escapeHtml(qualitySourceLabel)}</div>
      </div>
      ${qualityDimensionRows}
    </section>

    <section>
      <h2>Measured Comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>${escapeHtml(result?.control?.label ?? "Control")}</th>
            <th>${escapeHtml(result?.test?.label ?? "Test")}</th>
            <th>Test minus control</th>
          </tr>
        </thead>
        <tbody>${metricTable}</tbody>
      </table>
      <div class="meta">Tokens are cost-relevant input plus output; cached replay is excluded.</div>
    </section>

    <section>
      <h2>Tool Coverage and Tool Call Sequence</h2>
      ${coverageTable}
      <div class="two-col">
        <div>
          <h3>${escapeHtml(result?.control?.label ?? "Control")} Tool Calls</h3>
          <div class="scroll">${toolCallRows(result?.control?.toolCallLog)}</div>
        </div>
        <div>
          <h3>${escapeHtml(result?.test?.label ?? "Test")} Tool Calls</h3>
          <div class="scroll">${toolCallRows(result?.test?.toolCallLog)}</div>
        </div>
      </div>
    </section>

    <section>
      <h2>Outputs</h2>
      <p>Outputs are collapsed by default so metrics and coverage stay readable.</p>
      ${armOutput(result?.control?.label ?? "Control", result?.control)}
      ${armOutput(result?.test?.label ?? "Test", result?.test)}
    </section>

    <section>
      <h2>Integrity Checks</h2>
      <table><tbody>${checkRows}</tbody></table>
      ${
        Array.isArray(result?.integrity?.warnings) &&
        result.integrity.warnings.length > 0
          ? `<h3>Warnings</h3><ul>${result.integrity.warnings
              .map((warning) => `<li>${escapeHtml(warning)}</li>`)
              .join("")}</ul>`
          : ""
      }
    </section>

    <footer>
      Local benchmark-lite artifact. Raw trace arguments are excluded by default; final answers are shown for comparison.
      Classification value: ${escapeHtml(classification ?? "not-evaluated")}.
    </footer>
  </main>
</body>
</html>`;
}
