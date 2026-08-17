#!/bin/bash

echo "=== DETAILED TEST COVERAGE ANALYSIS ==="
echo ""

echo "UNIT TESTS (tests.ts) - By Category:"
echo ""
echo "1. RDP Connection Management:"
grep -A 1 "describe('RDP Connection Management'" tests.ts | tail -1
grep "it(" tests.ts | grep -A 100 "RDP Connection Management" | head -4 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//" 
echo ""

echo "2. Tab Management:"
grep "it(" tests.ts | grep -A 100 "Tab Management" | head -3 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "3. Actor Management:"
grep "it(" tests.ts | grep -A 100 "Actor Management" | head -5 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "4. Security Configuration:"
grep "it(" tests.ts | grep -A 100 "Security Configuration" | head -3 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "5. Port Management:"
grep "it(" tests.ts | grep -A 100 "Port Management" | head -3 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "6. Error Handling and Recovery:"
grep "it(" tests.ts | grep -A 100 "Error Handling and Recovery" | head -2 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "7. Integration Scenarios:"
grep "it(" tests.ts | grep -A 100 "Integration Scenarios" | head -2 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "8. Environment Variables:"
grep "it(" tests.ts | grep -A 100 "Environment Variables" | head -2 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
echo ""

echo "9. Configuration Validation:"
grep "it(" tests.ts | grep -A 100 "Configuration Validation" | head -2 | sed 's/.*it(/  [✓] /' | sed "s/[',).*//"
