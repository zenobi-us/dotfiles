---
id: ze11ts01
title: Implement Preset JSON Storage
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: completed
epic_id: ze11ij01
phase_id: ze11ph01
assigned_to: unassigned
---

# Task: Implement Preset JSON Storage

## Objective

Create functions to load, save, and manage presets stored in `~/.pi/agent/pi-zellij.json`.

## Steps

1. Define TypeScript interfaces:
   ```typescript
   interface ZellijPane {
     id: string;
     command: string;
     args?: string[];
     cwd?: string;
   }
   
   interface ZellijPreset {
     layout: string;
     panes: ZellijPane[];
   }
   
   type ZellijPresetMap = Record<string, ZellijPreset>;
   ```

2. Implement `getPresetsPath()` - returns `~/.pi/agent/pi-zellij.json`

3. Implement `loadPresets(): ZellijPresetMap`
   - Read JSON file
   - Return empty object if file doesn't exist
   - Handle JSON parse errors gracefully

4. Implement `savePresets(presets: ZellijPresetMap): void`
   - Ensure `~/.pi/agent/` directory exists
   - Write JSON with pretty formatting
   - Handle write errors

5. Implement `getPreset(name: string): ZellijPreset | null`
   - Load presets
   - Return specific preset by name

6. Implement `setPreset(name: string, preset: ZellijPreset): void`
   - Load existing presets
   - Add/update preset
   - Save back to file

7. Implement `deletePreset(name: string): boolean`
   - Load presets
   - Delete if exists
   - Save and return true/false

## Expected Outcome

- Preset storage functions work correctly
- File created automatically on first save
- Errors are caught and logged appropriately

## Acceptance Criteria

- [ ] All functions implemented with proper error handling
- [ ] TypeScript types match specification
- [ ] File path uses homedir correctly
- [ ] Empty state handled (no file exists initially)

## Lessons Learned

(To be filled after completion)
