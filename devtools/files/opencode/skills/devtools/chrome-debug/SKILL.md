---
name: chrome-debug
description: Use when debugging web applications in chrome via the remote debugging protocol. Provides capabilities for inspecting DOM, executing JS, taking screenshots, and automating browser interactions.
---

# Chrome Debugging and Browser Manipulation via Remote Debugging Prodocol

## Overview

Chrome DevTools Protocol (CDP) enables remote browser automation and debugging.

This skill documents the integration pattern, startup requirements, and common workflows for debugging web applications via Agent with live browser interaction.

- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

## Prerequisites [CRITICAL]

```bash
mcporter call chrome-devtools.getVersion
```

This command must return Chrome version info. If it fails, get a human to help.

## Available Tools

- chrome-devtools.getVersion [no args]
- chrome-devtools.getTabs [targetId]
- chrome-devtools.navigateToUrl [url]
- chrome-devtools.takeScreenshot [targetId]
- chrome-devtools.clickElement [targetId, selector]
- chrome-devtools.fillFormField [targetId, selector, value]
- chrome-devtools.getPageContent [targetId]
- chrome-devtools.evaluateScript [targetId, script]
- chrome-devtools.getConsoleOutput [targetId]

## Quick Reference

| Task | mcporter Call |
|------|---------------|
| Check Chrome listening | `mcporter call chrome-devtools.getVersion` |
| List browser tabs | `mcporter call chrome-devtools.getTabs --targetId=<id>` |
| Take screenshot | `mcporter call chrome-devtools.takeScreenshot --targetId=<id>` |
| Click element | `mcporter call chrome-devtools.clickElement --targetId=<id> --selector='#login'` |
| Fill form field | `mcporter call chrome-devtools.fillFormField --targetId=<id> --selector='#email' --value='test@example.com'` |
| Get page content | `mcporter call chrome-devtools.getPageContent --targetId=<id>` |
| Navigate to URL | `mcporter call chrome-devtools.navigateToUrl --targetId=<id> --url='http://localhost:3000'` |
| Run JavaScript | `mcporter call chrome-devtools.evaluateScript --targetId=<id> --script='document.title'` |
| Read console | `mcporter call chrome-devtools.getConsoleOutput --targetId=<id>` |

## Common Workflows

### 1. Inspect Web Application State

```
You: "Navigate to http://localhost:3000 and take a screenshot"
Agent uses Chrome DevTools Protocol → Takes screenshot → Returns visual state
```

### 2. Debug JavaScript Errors

```
You: "Open DevTools console and read the error messages"
Agent uses Chrome DevTools Protocol → Reads console → Explains errors
```

### 3. Automated Testing/Validation

```
You: "Fill the form with test data and submit it"
Agent uses Chrome DevTools Protocol → Automates interaction → Reports results
```

### 4. DOM Inspection

```
You: "Find the login button and tell me its HTML"
Agent uses Chrome DevTools Protocol → Inspects element → Returns HTML/attributes
```

## Real-World Impact

Integrating Chrome DevTools Protocol into mcporter enables:

- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

Without this integration, debugging web applications requires context-switching between browser and Agent.
