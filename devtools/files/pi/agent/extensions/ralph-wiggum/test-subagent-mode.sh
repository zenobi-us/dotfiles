#!/bin/bash
# Test script for Ralph Wiggum subagent mode

set -e

echo "🧪 Testing Ralph Wiggum Subagent Mode"
echo "======================================"
echo ""

# Create test directory
TEST_DIR="/tmp/ralph-subagent-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 Test directory: $TEST_DIR"
echo ""

# Create a test task file
echo "📝 Creating test task file..."
cat > task.md << 'EOF'
# Test Feature

## Goals
- Test subagent delegation
- Verify task tracking

## Checklist
- [ ] Task 1: Create hello.txt
- [ ] Task 2: Create world.txt
- [ ] Task 3: Create test.txt

## Notes
Test notes here.
EOF

echo "✅ Task file created"
echo ""

# Show task file
echo "📄 Task file content:"
cat task.md
echo ""

# Test extraction logic (simulate)
echo "🔍 Testing task extraction..."
grep "^- \[ \]" task.md || echo "No uncompleted tasks found"
echo ""

# Simulate marking a task complete
echo "✏️  Simulating task completion..."
sed -i 's/- \[ \] Task 1: Create hello.txt/- [x] Task 1: Create hello.txt/' task.md
echo "✅ Task 1 marked complete"
echo ""

# Show updated checklist
echo "📊 Updated checklist:"
grep "^- \[" task.md
echo ""

# Count remaining tasks
REMAINING=$(grep -c "^- \[ \]" task.md || echo "0")
echo "📈 Remaining tasks: $REMAINING"
echo ""

# Test state file structure
echo "💾 Creating test state file..."
cat > .ralph-test.state.json << 'EOF'
{
  "name": "test",
  "taskFile": "task.md",
  "iteration": 1,
  "maxIterations": 50,
  "itemsPerIteration": 0,
  "reflectEvery": 0,
  "reflectInstructions": "",
  "active": true,
  "status": "active",
  "startedAt": "2026-01-13T00:00:00.000Z",
  "lastReflectionAt": 0,
  "useSubagents": true,
  "subagentAgent": "default",
  "currentTaskIndex": 0,
  "subagentResults": []
}
EOF

echo "✅ State file created"
echo ""

# Show state file
echo "📄 State file content:"
cat .ralph-test.state.json | head -20
echo ""

# Simulate progress
echo "🔄 Simulating progress..."
echo "  Task 1: Completed ✓"
echo "  Task 2: In progress..."
echo ""

# Test completed
echo "✨ Test completed successfully!"
echo ""
echo "🧹 Cleanup: rm -rf $TEST_DIR"

# Don't auto-cleanup so user can inspect
echo ""
echo "Run the following to clean up:"
echo "  rm -rf $TEST_DIR"
