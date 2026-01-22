# Chrome Debug - Element Interaction Workflows

## Working with Elements (UID Workflow)

**Critical**: Element interaction requires UIDs from snapshots. CSS selectors DO NOT work directly.

### Step-by-Step Element Interaction

```bash
# Step 1: Take snapshot to get element UIDs
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"
```

Example snapshot output:
```
Document
  main
    form uid=10
      label uid=11 "Email"
      input uid=12 type="email"
      label uid=13 "Password"
      input uid=14 type="password"
      button uid=15 "Login"
```

```bash
# Step 2: Use UIDs to interact with elements
mise x node@20 -- mcporter call chrome-devtools.fill --args '{"uid":"12","value":"user@example.com"}'
mise x node@20 -- mcporter call chrome-devtools.fill --args '{"uid":"14","value":"password123"}'
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"15"}'
```

### After Navigation

UIDs become invalid after navigation. Always take a fresh snapshot:

```bash
# Navigation happened
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"..."}'

# OLD UIDs are now invalid - take new snapshot
mise x node@20 -- mcporter call chrome-devtools.take_snapshot
```

### Common Workflow Errors

#### ❌ WRONG - CSS selectors don't work
```bash
mise x node@20 -- mcporter call chrome-devtools.click --selector "#login-button"
```

#### ✅ CORRECT - Use UIDs from snapshot
```bash
mise x node@20 -- mcporter call chrome-devtools.take_snapshot  # Get UIDs first
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"12"}'
```

## Example: Hover Detection & Measurement

Hover an element and measure its dimensions after CSS transitions:

```bash
# Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Take snapshot to find tooltip trigger element
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"  # Review to find tooltip-trigger UID (assume uid=20)

# Hover the element
mise x node@20 -- mcporter call chrome-devtools.hover --args '{"uid":"20"}'

# Wait for CSS transition
sleep 0.5

# Measure dimensions with evaluate_script
mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"(el) => { const bounds = el.getBoundingClientRect(); const tooltip = document.querySelector(\".tooltip\"); const tooltipBounds = tooltip ? tooltip.getBoundingClientRect() : null; return { trigger: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, tooltip: tooltipBounds ? { x: tooltipBounds.x, y: tooltipBounds.y, width: tooltipBounds.width, height: tooltipBounds.height } : null }; }","args":[{"uid":"20"}]}'
```
