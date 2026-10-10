# Chrome Debug - Form Filling Workflows

## Complete Form Fill & Submission Flow

Demonstrates full workflow from navigation to form submission with error checking:

```bash
# Setup: Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Navigate to login page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000/login"}'

# Wait for form to load
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Login"}'

# Take snapshot to identify form field UIDs
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"

# Expected output shows:
# form uid=8
#   input uid=9 type="email" placeholder="Email"
#   input uid=10 type="password" placeholder="Password"
#   button uid=11 "Sign In"

# Fill email field
mise x node@20 -- mcporter call chrome-devtools.fill \
  --args '{"uid":"9","value":"test@example.com"}'

# Fill password field
mise x node@20 -- mcporter call chrome-devtools.fill \
  --args '{"uid":"10","value":"SecurePass123!"}'

# Take screenshot before submission
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args '{"filePath":"./before-submit.png"}'

# Submit form by clicking button
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"11"}'

# Wait for either success message or error
sleep 2

# Check console for any errors
CONSOLE=$(mise x node@20 -- mcporter call chrome-devtools.list_console_messages \
  --args '{"types":["error","warn"]}')
echo "$CONSOLE"

# Check network requests for API calls
NETWORK=$(mise x node@20 -- mcporter call chrome-devtools.list_network_requests \
  --args '{"types":["fetch","xhr"]}')
echo "$NETWORK"

# Take screenshot of result
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args '{"filePath":"./after-submit.png"}'

# Verify login by checking URL or page content
CURRENT_URL=$(mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { return window.location.href }"}')
echo "Current URL: $CURRENT_URL"

# If login successful, URL should change to dashboard
if echo "$CURRENT_URL" | grep -q "dashboard"; then
  echo "✓ Login successful!"
else
  echo "✗ Login failed - still on login page"
fi
```

## Form Interaction Parameters

Use `--args` with JSON object for all form interactions:

```bash
# Fill input/textarea
mise x node@20 -- mcporter call chrome-devtools.fill --args '{"uid":"5","value":"text content"}'

# Select dropdown option
mise x node@20 -- mcporter call chrome-devtools.fill --args '{"uid":"8","value":"option2"}'

# Click element
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"12"}'

# Double-click element
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"12","dblClick":true}'
```

## Keyboard Parameters

Use `--args` with JSON object:

```bash
# Single key
mise x node@20 -- mcporter call chrome-devtools.press_key --args '{"key":"Enter"}'
mise x node@20 -- mcporter call chrome-devtools.press_key --args '{"key":"Escape"}'
mise x node@20 -- mcporter call chrome-devtools.press_key --args '{"key":"Tab"}'
mise x node@20 -- mcporter call chrome-devtools.press_key --args '{"key":"Backspace"}'

# With modifiers
mise x node@20 -- mcporter call chrome-devtools.press_key --args '{"key":"KeyA","modifiers":["Control"]}'
```
