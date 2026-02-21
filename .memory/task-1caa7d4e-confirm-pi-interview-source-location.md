---
id: 1caa7d4e
title: Confirm authoritative pi-interview source location
epic_id: 9c7e21ab
phase_id: 3a5f1c8d
created_at: 2026-02-20T19:32:00+10:30
updated_at: 2026-02-20T19:39:55+10:30
status: completed
assigned_to: session-20260220-1938
---

# Task: Confirm authoritative pi-interview source location

## Objective
Get explicit confirmation on where the real `pi-interview` source should be read from.

## Related Story
N/A (IDEA-stage)

## Steps
1. Confirm whether source is expected in this repo, another repo, or installed package cache.
2. Provide path/repo URL to use as source of truth.

## Expected Outcome
Authoritative source location available so design can align with real behavior.

## Actual Outcome
Completed via direct source verification from GitHub: `https://github.com/nicobailon/pi-interview-tool` (cloned at `/tmp/pi-interview-tool`).

## Lessons Learned
The package reference in local Pi settings was insufficient. Pulling upstream source removed uncertainty and unblocked architecture analysis.
