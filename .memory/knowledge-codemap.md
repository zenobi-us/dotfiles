---
id: codemap
title: Dotfiles Project Codebase Structure
created_at: 2026-01-23T12:51:00+10:30
updated_at: 2026-01-23T12:51:00+10:30
area: codebase-structure
tags: [architecture, structure, state-machine]
---

# Dotfiles Project Codebase Structure

## Overview

This is a dotfiles repository containing Pi agent extensions and configurations.

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOTFILES REPOSITORY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  devtools/                                                        │
│  └── files/                                                       │
│      └── pi/                                                      │
│          └── agent/                                               │
│              └── extensions/                                      │
│                  ├── worktree/  [COMPLETE]                        │
│                  │   └── index.ts                                 │
│                  │       • Git worktree management                │
│                  │       • Session/workspace isolation            │
│                  │                                                 │
│                  └── zellij/    [IN PROGRESS - SKELETON]          │
│                      └── index.ts                                 │
│                          • Terminal multiplexer management        │
│                          • Session/tab/pane control               │
│                                                                   │
│  .memory/                                                         │
│  └── [Project knowledge and task tracking]                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Flow

```
User Command → Extension Router → Handler Functions → Zellij CLI
                                                    ↓
                                        Settings ← ~/.pi/settings.json
```

## Key Files

- `devtools/files/pi/agent/extensions/worktree/index.ts` - Reference implementation
- `devtools/files/pi/agent/extensions/zellij/index.ts` - Target implementation (skeleton created)
- `.memory/*` - Project knowledge base
