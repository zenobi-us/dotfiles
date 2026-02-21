---
id: dspya1b2km
title: TemplateAdapter Extension Flow
created_at: 2026-02-21T21:10:00+10:30
updated_at: 2026-02-21T21:10:00+10:30
area: architecture
tags: [template-adapter, pi-extension, state-machine]
learned_from: [epic-dspya1b2-template-adapter-extension.md, phase-dspya101-research-and-integration-spike.md]
---

# TemplateAdapter Extension Flow

## Overview
State machine describing how the proposed Pi extension orchestrates TemplateAdapter authoring, preview, execution, and telemetry capture.

## Details

```text
[command /template-adapter]
          |
          v
[Choose adapter]
   |            \
   |new          \existing
   v              v
[Create metadata] [Load definition]
          |              |
          v              v
[Template Editor]
   |  |  |  |
   |  |  |  +--> {helpers()} registry modal
   |  |  +------> {demos()} table editor
   |  +---------> Parse mode selector (full_text/json/xml/callable)
   +------------> Message list editor (system/user/history directives)
          |
          v
[Validation]
   |  \____failure____> [Show errors (missing outputs, bad braces, parse-mode mismatch)]
   |
   v
[Preview]
   |  \____failure____> [Surface TemplateAdapter preview errors]
   |
   v
[Run Adapter]
   |
   v
[Spawn Python Runner]
   |
   v
[Stream LM history]
   |  \____error____> [Display parse/runtime errors + guidance]
   |
   v
[Capture telemetry]
   |
   v
[Persist results]
   |
   v
[Export / Close]
```

- Runner exchange uses JSON envelopes with signature metadata, message payloads, and parse-mode config.
- Telemetry persistence stores last N runs + completion stats so future overlays can diff behavior.
- Validation gate enforces TemplateAdapter invariants before Python execution to reduce expensive LM calls.
