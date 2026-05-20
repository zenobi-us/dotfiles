# Advanced Profiling Guide

Techniques for profiling and optimizing Neovim startup and runtime performance.

## Profiling Tools

### 1. nvim --startuptime

**Usage:**
```bash
nvim --startuptime startup.log
nvim startup.log
```

**What it shows:**
- Time elapsed at each step
- File sourcing times
- Plugin loading times
- Configuration execution times

**Example output:**
```
times in msec
 clock   self+sourced   self:  sourced script
 000.005  000.005: --- NVIM STARTING ---
 000.123  000.118: event init
 002.456  002.333: sourcing /Users/user/.config/nvim/init.lua
 015.789  013.333: require('lazy')
 025.123  009.334: require('plugins.telescope')
 030.456  005.333: setup telescope
```

**Reading the output:**
- First column: Total elapsed time (ms)
- Second column: Time for this step (ms)
- Third column: What happened

**Find slow items:**
```bash
# View startup log sorted by time
nvim --startuptime startup.log -c 'qa!'
cat startup.log | sort -k2 -nr | head -20
```

### 2. lazy.nvim Profile

**Usage:**
```vim
:Lazy profile
```

**What it shows:**
- Load time per plugin
- What triggered loading (cmd, keys, event)
- Total startup time

**Columns:**
- **Plugin**: Plugin name
- **Reason**: Why it loaded (startup, cmd, keys, etc.)
- **Time**: Load time in ms

**Identify issues:**
- Plugins loading at startup that shouldn't
- Slow plugin configurations
- Missing lazy-loading opportunities

### 3. LuaJIT Profiler

**Install:**
```lua
return {
  "stevearc/profile.nvim",
  config = function()
    local should_profile = os.getenv("NVIM_PROFILE")
    if should_profile then
      require("profile").instrument_autocmds()
      require("profile").start("*")
    end
  end,
}
```

**Usage:**
```bash
NVIM_PROFILE=1 nvim --startuptime startup.log
:ProfileStop
:ProfileDump profile.json
```

**What it shows:**
- Function call counts
- Time spent in each function
- Call stack analysis

## Analysis Strategies

### Strategy 1: Baseline Measurement

1. Measure current startup:
```bash
nvim --startuptime baseline.log -c 'qa!'
tail -1 baseline.log  # See total time
```

2. Record baseline time
3. Make one change at a time
4. Re-measure after each change

### Strategy 2: Binary Search

For configs with many plugins:

1. Disable half of plugins
2. Measure startup
3. If faster, problem is in disabled half
4. If same, problem is in enabled half
5. Repeat until found

**Implementation:**
```lua
-- In lazy.nvim setup
local debugging = true

require("lazy").setup("plugins", {
  performance = {
    disabled_plugins = debugging and {
      "gitsigns",
      "indent-blankline",
      -- ... other plugins
    } or {},
  },
})
```

### Strategy 3: Event Timing

Measure specific events:

```lua
-- Add to init.lua
local start_time = vim.loop.hrtime()

vim.api.nvim_create_autocmd("User", {
  pattern = "VeryLazy",
  callback = function()
    local end_time = vim.loop.hrtime()
    local startup_ms = (end_time - start_time) / 1000000
    vim.notify(string.format("Startup: %.2fms", startup_ms))
  end,
})
```

## Performance Targets

**Startup phases:**
1. **Init**: < 5ms (init.lua, options, keymaps)
2. **Plugin load**: < 20ms (lazy.nvim + essential plugins)
3. **Config**: < 15ms (plugin setup functions)
4. **UI render**: < 10ms (first buffer display)

**Total target: < 50ms**

**By plugin type:**
- Colorscheme: < 2ms
- Treesitter: 5-10ms
- LSP base: < 5ms (servers load on ft)
- Completion: 0ms at startup (loads on InsertEnter)
- File explorer: 0ms at startup (loads on cmd/keys)

## Common Bottlenecks

### Bottleneck 1: Heavy init.lua

**Symptom:**
```
002.456  002.333: sourcing ~/.config/nvim/init.lua
```

**Causes:**
- Complex Lua logic at top level
- Synchronous file operations
- Heavy computations

**Fix:**
```lua
-- Bad
local files = vim.fn.glob("~/.config/nvim/plugin/*.lua", true, true)
for _, file in ipairs(files) do
  dofile(file)  -- Slow!
end

-- Good
vim.defer_fn(function()
  -- Deferred loading
end, 100)
```

### Bottleneck 2: Too Many Plugins at Startup

**Symptom:**
```
:Lazy profile shows many "startup" reasons
```

**Fix:**
Add lazy-loading:
```lua
-- Before
return {
  "plugin/name",
}

-- After
return {
  "plugin/name",
  event = "VeryLazy",
}
```

### Bottleneck 3: Slow Plugin Configuration

**Symptom:**
```
025.123  009.334: setup telescope  ← 9ms is slow!
```

**Fix:**
Simplify config or defer:
```lua
return {
  "nvim-telescope/telescope.nvim",
  cmd = "Telescope",  -- Don't configure at startup
  config = function()
    require("telescope").setup({
      -- Config runs when first used
    })
  end,
}
```

### Bottleneck 4: Treesitter Parsers

**Symptom:**
Slow initial file opening

**Fix:**
Only install parsers for languages you use:
```lua
require("nvim-treesitter.configs").setup({
  ensure_installed = {
    "lua", "vim", "vimdoc",  -- Only what you need
    "typescript", "python",
  },
})
```

### Bottleneck 5: LSP Server Startup

**Symptom:**
File opening delayed waiting for LSP

**Check:**
```vim
:LspInfo  " See attached servers
:checkhealth lsp
```

**Fix:**
Lazy-load by filetype:
```lua
return {
  "neovim/nvim-lspconfig",
  ft = { "lua", "python", "typescript" },
}
```

## Optimization Workflow

### Step 1: Profile Baseline

```bash
nvim --startuptime startup-before.log -c 'qa!'
```

Record total time.

### Step 2: Identify Top 5 Slowest Items

```bash
cat startup-before.log | sort -k2 -nr | head -5
```

### Step 3: Optimize Each Item

For each item:
1. Identify cause (plugin, config, sourcing)
2. Add lazy-loading or simplify
3. Re-measure

### Step 4: Use Lazy Profile

```vim
:Lazy profile
```

Verify:
- Few plugins load at startup
- Most have lazy-loading triggers
- Total time improved

### Step 5: Compare Results

```bash
nvim --startuptime startup-after.log -c 'qa!'
```

Compare before/after times.

## Automation

### Auto-profile Script

```bash
#!/bin/bash
# profile-nvim.sh

LOG="startup-$(date +%Y%m%d-%H%M%S).log"
nvim --startuptime "$LOG" -c 'qa!'

echo "Startup time:"
tail -1 "$LOG" | awk '{print $1 "ms"}'

echo -e "\nTop 10 slowest items:"
cat "$LOG" | sort -k2 -nr | head -10 | awk '{printf "%-8s %s\n", $2, $NF}'
```

**Usage:**
```bash
chmod +x profile-nvim.sh
./profile-nvim.sh
```

### CI Integration

```yaml
# .github/workflows/performance.yml
name: Startup Performance
on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Neovim
        run: |
          sudo add-apt-repository ppa:neovim-ppa/unstable
          sudo apt-get update
          sudo apt-get install neovim
      - name: Measure startup
        run: |
          nvim --startuptime startup.log --headless -c 'qa!'
          TIME=$(tail -1 startup.log | awk '{print $1}')
          echo "Startup time: ${TIME}ms"
          if (( $(echo "$TIME > 100" | bc -l) )); then
            echo "::error::Startup time exceeded 100ms"
            exit 1
          fi
```

## Benchmarking Different Configs

### Compare Configs

```bash
# Test config A
nvim -u ~/.config/nvim-a/init.lua --startuptime config-a.log -c 'qa!'

# Test config B
nvim -u ~/.config/nvim-b/init.lua --startuptime config-b.log -c 'qa!'

# Compare
diff <(tail -1 config-a.log) <(tail -1 config-b.log)
```

### Test Minimal Config

```bash
# Create minimal init.lua
cat > /tmp/minimal-init.lua << 'EOF'
vim.opt.number = true
require("lazy").setup({})
EOF

# Test
nvim -u /tmp/minimal-init.lua --startuptime minimal.log -c 'qa!'
```

**Expected: < 20ms**

## Advanced Techniques

### Lazy-Load lua/ Modules

```lua
-- Don't require at top level
-- Bad
local utils = require("utils")  -- Loads at startup

-- Good
local M = {}
function M.do_something()
  local utils = require("utils")  -- Loads when called
  utils.helper()
end
return M
```

### Profile Individual Functions

```lua
local function profile(name, func)
  local start = vim.loop.hrtime()
  local result = func()
  local duration = (vim.loop.hrtime() - start) / 1000000
  print(string.format("%s: %.2fms", name, duration))
  return result
end

-- Usage
profile("telescope setup", function()
  require("telescope").setup({})
end)
```

### Memory Profiling

```lua
-- Before operation
local mem_before = collectgarbage("count")

-- Operation
require("heavy.plugin")

-- After operation
local mem_after = collectgarbage("count")
print(string.format("Memory used: %.2f KB", mem_after - mem_before))
```

## Interpreting Results

**Startup time breakdown:**
```
Total: 045.123ms
├─ Init: 003.456ms (7.7%)
├─ Plugin load: 018.789ms (41.6%)
├─ Config: 012.345ms (27.4%)
└─ UI render: 010.533ms (23.3%)
```

**Good distribution:**
- Init: < 10%
- Plugin load: 30-40%
- Config: 20-30%
- UI render: 20-30%

**Warning signs:**
- Init > 20% (heavy init.lua)
- Plugin load > 50% (too many at startup)
- Config > 40% (heavy setup() functions)

## Checklist

After profiling, verify:

- [ ] Total startup < 50ms
- [ ] No single item > 10ms
- [ ] Colorscheme loads first (priority 1000)
- [ ] Only essential plugins at startup
- [ ] Heavy plugins lazy-loaded
- [ ] LSP loads on filetype
- [ ] Completion loads on InsertEnter
- [ ] UI enhancements deferred (VeryLazy)

Use these profiling techniques to maintain a fast, responsive Neovim configuration.
