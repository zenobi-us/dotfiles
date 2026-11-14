// The popup edits only schema.settings; manifest metadata stays untouched.
import { div } from "gpui-kit";
import { h_flex, v_flex, Checkbox } from "gpui-base";
import { appHome, readTextFile, writeTextFile, props, openOverlay, closeOverlay, setShared, theme } from "herdr";
import { button, note, select } from "./ui.js";

export function openSettings() {
  return openOverlay({ mod: "shared-context", kind: "popup", frame: "none", width: 480, height: 512, props: { mode: "settings" } });
}

export function initSettings(view, cx) {
  view.focus = cx.focus_handle();
  view.selectFocus = {};
  view.settingFocus = {};
  view.settingsLoading = true;
  view.settingsError = "";
  view.settingsSaving = false;
  view.settingsFields = [];
  view.settingsDraft = {};
  cx.bind_keys([
    { keystroke: "space", action: "shared-context.toggle-setting", context: "SharedContextSettingToggle" },
    { keystroke: "enter", action: "shared-context.toggle-setting", context: "SharedContextSettingToggle" },
  ]);
  view.focus.focus();
  cx.spawn(async cx => {
    try {
      const base = `${appHome()}/mods/shared-context`;
      const [schemaText, manifestText] = await Promise.all([readTextFile(`${base}/mod.schema.json`), readTextFile(`${base}/mod.json`)]);
      if (schemaText === null || manifestText === null) throw new Error("Shared Context schema or mod.json is missing.");
      const schema = JSON.parse(schemaText), manifest = JSON.parse(manifestText);
      const fields = Object.entries(schema.properties.settings.properties);
      const saved = manifest.settings ?? {};
      if (typeof saved !== "object" || saved === null || Array.isArray(saved)) throw new Error("Shared Context settings must be an object.");
      for (const key of Object.keys(saved)) if (!fields.some(([name]) => name === key)) throw new Error(`Unknown Shared Context setting: ${key}.`);
      for (const [key, field] of fields) {
        if (field.type !== "boolean" && !Array.isArray(field.enum)) throw new Error(`No settings control supports ${key}.`);
        const value = saved[key] === undefined ? field.default : saved[key];
        if (field.type === "boolean" ? typeof value !== "boolean" : !field.enum.includes(value)) throw new Error(`Invalid ${field.title ?? key} in mod.json. Correct the setting before opening this form.`);
        view.settingsDraft[key] = value;
        view.selectFocus[key] = cx.focus_handle();
        view.settingFocus[key] = cx.focus_handle();
      }
      view.settingsFields = fields;
      view.settingsInitial = { ...view.settingsDraft };
      view.settingsManifest = manifest;
      view.settingsSnapshot = manifestText;
    } catch (error) { view.settingsError = String(error.message ?? error); }
    finally { view.settingsLoading = false; cx.notify(); }
  });
}

export function saveSettings(view, cx) {
  if (view.settingsSaving || view.settingsLoading || !view.settingsManifest) return;
  const settings = Object.fromEntries(view.settingsFields.filter(([key, field]) => view.settingsDraft[key] !== field.default).map(([key]) => [key, view.settingsDraft[key]]));
  const manifest = { ...view.settingsManifest };
  if (Object.keys(settings).length) manifest.settings = settings;
  else delete manifest.settings;
  view.settingsSaving = true;
  view.settingsError = "";
  cx.notify();
  cx.spawn(async cx => {
    try {
      await writeTextFile(`${appHome()}/mods/shared-context/mod.json`, `${JSON.stringify(manifest, null, 2)}\n`, view.settingsSnapshot);
      // Linked source directories may not trigger Herdr's file watcher.
      setShared("shared-context.settings-revision", `${Date.now()}-${Math.random()}`);
      closeOverlay(props().overlay);
    } catch (error) {
      view.settingsError = `Settings were not saved. ${String(error.message ?? error)} Close and reopen settings to load the current file.`;
    } finally { view.settingsSaving = false; cx.notify(); }
  });
}

export function renderSettings(view) {
  const t = theme(), ready = Boolean(view.settingsManifest), dirty = ready && view.settingsFields.some(([key]) => view.settingsDraft[key] !== view.settingsInitial[key]);
  return v_flex().id("shared-context-settings").role("dialog").accessibility_label("Shared Context settings").track_focus(view.focus).w(480).h(512).rounded(0).border_1().border_color(t.border).bg(t.popover).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
    .on_key_down((event, cx) => { for (const handler of Object.values(view.selectKeyHandlers ?? {})) if (handler(event, cx)) return; })
    .child(v_flex().flex_none().p(20).gap(4).border_b(1).border_color(t.border)
      .child(div().text_size(15).font_semibold().child("Shared Context settings"))
      .child(div().text_size(12).text_color(t.muted).child("Changes apply when saved.")))
    .child(v_flex().id("shared-context-settings-fields").flex_1().min_h(0).overflow_y_scrollbar().p(20).gap(20)
      .when(view.settingsLoading, el => el.child(note("Read settings schema…")))
      .when(view.settingsSaving, el => el.child(note("Save settings…")))
      .when(!view.settingsLoading && !view.settingsSaving, el => el.children(view.settingsFields.map(([key, field]) => settingControl(view, key, field))))
      .when(Boolean(view.settingsError), el => el.child(note(view.settingsError, true))))
    .child(h_flex().flex_none().px(20).py(12).gap(8).border_t(1).border_color(t.border)
      .child(button("settings-defaults", "Defaults", (_event, cx) => { view.settingsDraft = Object.fromEntries(view.settingsFields.map(([key, field]) => [key, field.default])); cx.notify(); }, { disabled: !ready || view.settingsSaving }).px(0).bg(t.popover))
      .child(div().flex_1())
      .child(button("settings-cancel", "Cancel", () => closeOverlay(props().overlay), { disabled: view.settingsSaving }).px(12))
      .child(button("settings-save", "Save", (_event, cx) => saveSettings(view, cx), { primary: true, disabled: !dirty || view.settingsSaving }).px(16)));
}

function settingControl(view, key, field) {
  const t = theme(), value = view.settingsDraft[key], title = field.title ?? key;
  const change = (value, cx) => { view.settingsDraft[key] = value; cx.notify(); };
  const control = field.type === "boolean"
    ? Checkbox.new(`setting-${key}`).checked(value).track_focus(view.settingFocus[key]).tab_index(0).key_context("SharedContextSettingToggle").accessibility_label(title)
      .h(32).px(0).rounded(0).border_1().border_color(view.settingFocus[key].is_focused() ? t.accent : t.popover).on_change(change)
      .on_action("shared-context.toggle-setting", (_event, cx) => { change(!value, cx); cx.stop_propagation(); })
      .child(h_flex().w_full().gap(12).items_center().justify_between()
        .child(div().text_size(12).text_color(t.muted).child(title))
        .child(div().size(16).flex_none().flex().items_center().justify_center().border_1().border_color(value ? t.accent : t.border).text_size(12).text_color(t.accent).child(value ? "✓" : "")))
    : select(view, key, title, value, field.enum.map(value => ({ value, label: field["x-labels"]?.[value] ?? String(value) })), change).gap(8);
  return v_flex().flex_none().gap(8).child(control)
    .when(Boolean(field.description), el => el.child(div().text_size(12).text_color(t.muted).whitespace_normal().child(field.description)));
}
