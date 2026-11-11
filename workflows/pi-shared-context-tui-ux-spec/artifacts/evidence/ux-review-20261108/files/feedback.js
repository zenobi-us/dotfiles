// Feedback stays in this browser. Export creates a local JSON download; nothing is sent.
(() => {
  const key = "shared-context-ux-review-20261108-v1";
  const fields = [...document.querySelectorAll("[data-feedback]")];
  const status = document.querySelector("#feedback-status");
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch { saved = {}; }
  for (const field of fields) {
    if (Object.hasOwn(saved, field.dataset.feedback)) field.value = saved[field.dataset.feedback];
  }
  function collect() {
    return Object.fromEntries(fields.map(field => [field.dataset.feedback, field.value]));
  }
  function save() {
    saved = collect();
    try {
      localStorage.setItem(key, JSON.stringify(saved));
      status.textContent = "Saved in this browser at " + new Date().toLocaleTimeString() + ". Export JSON to send your feedback.";
    } catch {
      status.textContent = "Browser storage is unavailable. Keep this page open and export your feedback before closing it.";
    }
  }
  for (const field of fields) {
    field.addEventListener("input", save);
    field.addEventListener("change", save);
  }
  document.querySelector("#export-feedback").addEventListener("click", () => {
    const responses = collect();
    const screens = [...document.querySelectorAll("[data-screen-id]")].map(screen => ({
      id: screen.dataset.screenId,
      title: screen.dataset.screenTitle,
      screenshot: screen.dataset.screenShot,
      evidence: screen.closest("[data-evidence]").dataset.evidence,
      question: screen.dataset.screenQuestion,
      clarity: responses[screen.dataset.screenId + ".clarity"] || "unreviewed",
      priority: responses[screen.dataset.screenId + ".priority"] || "undecided",
      comment: responses[screen.dataset.screenId + ".comment"] || "",
    }));
    const payload = {
      report: "shared-context-tui-ux-review-20261108",
      revision: "capture-fidelity-correction",
      exportedAt: new Date().toISOString(),
      overall: responses["overall.comment"] || "",
      firstChange: responses["overall.firstChange"] || "",
      screens,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "shared-context-ux-feedback.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Feedback JSON downloaded. Attach it to the conversation; this page has not submitted anything.";
  });
})();
