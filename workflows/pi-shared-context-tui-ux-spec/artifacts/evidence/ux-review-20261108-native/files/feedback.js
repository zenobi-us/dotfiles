(() => {
  const key = "shared-context-native-review-20261108-v1";
  const fields = [...document.querySelectorAll("[data-feedback]")];
  const status = document.querySelector("#feedback-status");
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch { }
  for (const field of fields) {
    if (Object.hasOwn(saved, field.dataset.feedback)) field.value = saved[field.dataset.feedback];
  }
  const collect = () => Object.fromEntries(fields.map(field => [field.dataset.feedback, field.value]));
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(collect()));
      status.textContent = "Saved in this browser. Export JSON to send your feedback.";
    } catch {
      status.textContent = "Browser storage is unavailable. Export your feedback before closing this page.";
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
      evidence: "native-framebuffer",
      question: screen.dataset.screenQuestion,
      clarity: responses[screen.dataset.screenId + ".clarity"] || "unreviewed",
      priority: responses[screen.dataset.screenId + ".priority"] || "undecided",
      comment: responses[screen.dataset.screenId + ".comment"] || "",
    }));
    const payload = {
      report: "shared-context-native-tui-review-20261108",
      exportedAt: new Date().toISOString(),
      firstChange: responses["overall.firstChange"] || "",
      overall: responses["overall.comment"] || "",
      screens,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "shared-context-native-feedback.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "JSON downloaded. Attach it to the conversation; nothing was submitted automatically.";
  });
})();
