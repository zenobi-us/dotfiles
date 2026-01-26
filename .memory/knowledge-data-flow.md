---
id: dataflow
title: Extension Data Flow
created_at: 2026-01-23T12:51:00+10:30
updated_at: 2026-01-23T12:51:00+10:30
area: data-flow
tags: [architecture, data-flow, extensions]
---

# Extension Data Flow

## Overview

Data flow for Pi agent extensions focusing on command handling and external tool interaction.

## Data Flow Diagram

```
┌──────────────┐
│   Pi Agent   │
│  User Input  │
└──────┬───────┘
       │ /zellij <command> <args>
       ↓
┌────────────────────────────────────┐
│  Extension Command Router          │
│  - Parse command                   │
│  - Route to handler                │
└──────┬─────────────────────────────┘
       │
       ↓
┌────────────────────────────────────┐
│  Command Handler Functions         │
│  - handleSession()                 │
│  - handleTab()                     │
│  - handlePane()                    │
│  - handleList()                    │
│  - etc.                            │
└──────┬─────────────────────────────┘
       │
       ├─────────────┬──────────────────┐
       ↓             ↓                  ↓
┌──────────┐  ┌──────────┐      ┌─────────────┐
│ Settings │  │ Zellij   │      │ Git Utils   │
│ Manager  │  │ CLI      │      │ (optional)  │
│          │  │ execSync │      │             │
└──────┬───┘  └────┬─────┘      └──────┬──────┘
       │           │                   │
       │           ↓                   ↓
       │      ┌──────────┐      ┌──────────────┐
       │      │  Zellij  │      │ Git Branch   │
       │      │  Session │      │ Info         │
       │      │  Control │      │              │
       │      └────┬─────┘      └──────┬───────┘
       │           │                   │
       ↓           ↓                   ↓
┌───────────────────────────────────────────────┐
│         Context Information                   │
│  - Session state                              │
│  - Project info                               │
│  - Branch info                                │
│  - User preferences                           │
└───────────────────┬───────────────────────────┘
                    │
                    ↓
            ┌───────────────┐
            │  User Output  │
            │  - Success    │
            │  - Errors     │
            │  - Status     │
            └───────────────┘
```

## Key Data Structures

1. **ZellijSessionInfo**: Session metadata
2. **ZellijSettings**: User configuration from ~/.pi/settings.json
3. **SessionCreatedContext**: Context for hooks and templates
4. **ExtensionCommandContext**: Pi agent context with UI and CWD

## Configuration Flow

```
User → /zellij init → Interactive prompts → ZellijSettings → ~/.pi/settings.json
                                                                      ↓
Future commands read settings ←───────────────────────────────────────┘
```
