---
id: llcp0103
type: task
title: Preset Metadata enrichment and Configured Preset File validation
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 3
story_id: 
assigned_to: 
---

# Preset Metadata enrichment and Configured Preset File validation

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Read the Configured Preset File when present, validate missing-file behavior, and enrich Provider Models with safe Preset Metadata derived from documented INI aliases only. This must preserve the boundary between Model Preset runtime args and Pi Provider Model client metadata.

## Acceptance criteria

- [ ] Missing Configured Preset File is reported clearly in Operational Status.
- [ ] Missing Configured Preset File blocks package-managed server start preparation without falling back to cache or another preset source.
- [ ] PresetFileReader parses INI sections as Model Presets without mutating runtime args.
- [ ] Preset Metadata normalization supports documented short, long, and environment-form aliases for context size, max prediction tokens, and reasoning.
- [ ] Invalid Preset Metadata values are ignored or reported without changing llama.cpp runtime behavior.
- [ ] Provider Model enrichment applies only when Router Model List IDs match Model Presets.
- [ ] Provider Models remain sourced from Router Model List; unmatched INI sections do not create dead Provider Models.
- [ ] Unit tests cover present/missing files, matching and unmatched sections, alias normalization, invalid values, and metadata-vs-runtime separation.

## Blocked by

[External Router discovery and Provider Refresh](./task-llcp0102-external-router-provider-refresh.md)

## User stories covered

2, 6, 21, 22, 23
