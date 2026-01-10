# Pi-DCP Bug Fixes: Tool Use/Result Pairing

## Summary

Fixed critical bugs in pi-dcp extension that caused Claude API errors when message pruning broke tool_use/tool_result pairing.

## Issues Fixed

### 1. Critical: Broken Tool Use/Result Pairing

**Problem**: When pruning messages, the extension could prune a `tool_use` message but keep the corresponding `tool_result` message (or vice versa). This violates Claude's API requirement that every `tool_result` block must have a matching `tool_use` block in the previous assistant message.

**Error**:
```
Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"messages.6.content.1: unexpected `tool_use_id` found in `tool_result` blocks: toolu_01VzLnitYpwspzkRMSc2bhfA. Each `tool_result` block must have a corresponding `tool_use` block in the previous message."}}
```

**Solution**: Created new `tool-pairing` rule that:
- Extracts tool_use_id from all messages during prepare phase
- During process phase, ensures tool_use and tool_result pairs are never separated:
  - If a tool_use is kept, its tool_result must also be kept (or both pruned)
  - If a tool_result is kept, its tool_use must also be kept (or both pruned)
- Runs BEFORE the recency rule to ensure protection is applied

**Files Changed**:
- `src/rules/tool-pairing.ts` - NEW: Implements tool pairing protection
- `src/metadata.ts` - Added helper functions: `extractToolUseIds`, `hasToolUse`, `hasToolResult`
- `index.ts` - Registered new rule in correct order
- `src/config.ts` - Added to default configuration

### 2. TypeError in hashMessage Function

**Problem**: The `hashMessage` function assumed all items in `message.content` array have a `type` property, but some messages had undefined or malformed content parts.

**Error**:
```
[ERROR] Error in prepare phase for rule "deduplication" {"error":"Cannot read properties of undefined (reading 'type')","rule":"deduplication","index":2}
```

**Solution**: Added defensive checks in `hashMessage`:
- Check if part exists and is an object before accessing `.type`
- Use optional chaining for nested properties
- Provide fallback values for missing data

**Files Changed**:
- `src/metadata.ts` - Fixed `hashMessage` function with safety checks

## Testing

### Before Fix
```
2026-01-10T07:09:45.212Z [ERROR] Error in prepare phase for rule "deduplication" 
{"error":"Cannot read properties of undefined (reading 'type')","rule":"deduplication","index":2}

Error: 400 {"type":"error","error":{"type":"invalid_request_error",
"message":"messages.6.content.1: unexpected `tool_use_id` found in `tool_result` blocks..."}}
```

### After Fix
- No more TypeError in deduplication rule
- Tool use/result pairs remain intact even when other messages are pruned
- Debug logs show protection in action:
  ```
  [pi-dcp] Tool-pairing: protecting tool_use at index 5 (referenced by tool_result at index 6)
  ```

## Rule Ordering

**Critical**: Rules must be applied in this order:

1. `deduplication` - Remove duplicates
2. `superseded-writes` - Remove old file versions  
3. `error-purging` - Remove resolved errors
4. **`tool-pairing`** - ⚠️ MUST run before recency to protect pairs
5. `recency` - Override all decisions for recent messages

The `tool-pairing` rule MUST run before `recency` because:
- Recency can override pruning decisions
- If recency protects a tool_result but not its tool_use (or vice versa), we'd still have broken pairs
- Tool-pairing ensures both are protected/pruned together before recency makes its final decision

## Configuration

Updated default configuration to include the new rule:

```typescript
const DEFAULT_CONFIG = {
  enabled: true,
  debug: true,
  rules: [
    "deduplication", 
    "superseded-writes", 
    "error-purging",
    "tool-pairing",  // NEW - CRITICAL for API compliance
    "recency"
  ],
  keepRecentCount: 10,
};
```

## Migration

**No migration needed** - The extension will automatically use the new rule on next load. Users with custom `dcp.config.ts` files should add `"tool-pairing"` to their rules array before `"recency"`.

## Related Documentation

- Claude API Message Format: https://docs.anthropic.com/claude/reference/messages_post
- Tool Use Documentation: https://docs.anthropic.com/claude/docs/tool-use
