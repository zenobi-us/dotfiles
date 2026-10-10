# Chrome Debug - Performance Measurement Workflows

## Performance Measurement & Storage

Execute JavaScript to measure page performance metrics and store results:

```bash
# Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Navigate to page to test
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000"}'

# Wait for page load
sleep 2

# Measure performance metrics
METRICS=$(mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { const perf = performance.getEntriesByType(\"navigation\")[0]; const paint = performance.getEntriesByName(\"first-contentful-paint\")[0]; return { pageLoadTime: perf.loadEventEnd - perf.fetchStart, domInteractive: perf.domInteractive - perf.fetchStart, domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart, firstContentfulPaint: paint ? paint.startTime : null, transferSize: perf.transferSize, domainLookup: perf.domainLookupEnd - perf.domainLookupStart }; }"}')

# Store results
echo "$METRICS" | jq '.' > ./perf-metrics-$(date +%s).json
echo "Performance metrics saved to ./perf-metrics-$(date +%s).json"
```

## Quick Performance Test

Execute JavaScript to get performance metrics:

```bash
mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { const perf = performance.getEntriesByType(\"navigation\")[0]; return { loadTime: perf.loadEventEnd - perf.fetchStart, domInteractive: perf.domInteractive - perf.fetchStart }; }"}'
```

## Performance Tracing

```bash
# Start performance tracing
mise x node@20 -- mcporter call chrome-devtools.performance_start_trace

# Perform actions to trace
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000/heavy-page"}'

# Wait for actions to complete
sleep 5

# Stop tracing and get results
TRACE=$(mise x node@20 -- mcporter call chrome-devtools.performance_stop_trace)
echo "$TRACE" > ./performance-trace-$(date +%s).json
```

## Network Performance Testing

Check network requests for performance analysis:

```bash
# Navigate to page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000"}'

# Wait for page load
sleep 3

# Get all network requests with timing
NETWORK=$(mise x node@20 -- mcporter call chrome-devtools.list_network_requests)
echo "$NETWORK" | jq '.[] | {url: .url, status: .status, size: .size, timing: .timing}'
```

## Emulation for Performance Testing

Test under different network and CPU conditions:

```bash
# Emulate slow network
mise x node@20 -- mcporter call chrome-devtools.emulate --args '{"networkConditions":"Slow 3G"}'

# Emulate slow CPU (1 = no throttle, 20 = max)
mise x node@20 -- mcporter call chrome-devtools.emulate --args '{"cpuThrottlingRate":4}'

# Combined throttling
mise x node@20 -- mcporter call chrome-devtools.emulate --args '{"networkConditions":"Slow 3G","cpuThrottlingRate":4}'

# Navigate and measure under throttled conditions
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000"}'

# Reset to normal
mise x node@20 -- mcporter call chrome-devtools.emulate --args '{"networkConditions":"No emulation","cpuThrottlingRate":1}'
```

## Available Network Conditions

- `"No emulation"` - No throttling
- `"Offline"` - Simulate offline
- `"Slow 3G"` - 400 Kbps, 400ms RTT
- `"Fast 4G"` - 4 Mbps, 20ms RTT
