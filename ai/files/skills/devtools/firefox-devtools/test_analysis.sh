#!/bin/bash

echo "=== FIREFOX DEVTOOLS SKILL TEST ANALYSIS ==="
echo ""
echo "FILE STRUCTURE:"
ls -lh *.ts *.md
echo ""
echo "=== TESTS.TS ANALYSIS ==="
echo "Total lines: $(wc -l < tests.ts)"
echo "Describe blocks: $(grep -c "describe(" tests.ts)"
echo "Test cases (it): $(grep -c "it(" tests.ts)"
echo ""
echo "Test categories:"
grep "describe(" tests.ts | sed 's/.*describe(./  - /' | sed "s/[',].*//" | sort -u
echo ""
echo "=== INTEGRATION.TEST.TS ANALYSIS ==="
echo "Total lines: $(wc -l < integration.test.ts)"
echo "Describe blocks: $(grep -c "describe(" integration.test.ts)"
echo "Test cases (it): $(grep -c "it(" integration.test.ts)"
echo ""
echo "Test categories:"
grep "describe(" integration.test.ts | sed 's/.*describe(./  - /' | sed "s/[',].*//" | sort -u
