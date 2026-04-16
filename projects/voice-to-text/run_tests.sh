#!/bin/bash
# Test runner for voice-to-text application
# This script runs tests and outputs JSON results

set -e

STAGE=$1
if [ -z "$STAGE" ]; then
    echo "Usage: $0 <stage>"
    echo "  stage: 1 or 2"
    exit 1
fi

RESULTS_DIR=".shark/test-results"
mkdir -p "$RESULTS_DIR"

RESULTS_FILE="$RESULTS_DIR/stage$STAGE.json"

# Run tests
echo "Running stage $STAGE tests..."
if go test -v ./test/... > /tmp/test_output_$STAGE.txt 2>&1; then
    SUCCESS=true
    EXIT_CODE=0
else
    SUCCESS=false
    EXIT_CODE=$?
fi

# Capture test output
TEST_OUTPUT=$(cat /tmp/test_output_$STAGE.txt)

# Create JSON result
cat > "$RESULTS_FILE" <<EOF
{
  "stage": $STAGE,
  "success": $SUCCESS,
  "exitCode": $EXIT_CODE,
  "timestamp": "$(date -Iseconds)",
  "output": $(echo "$TEST_OUTPUT" | jq -Rs .)
}
EOF

echo "Test results written to $RESULTS_FILE"
exit $EXIT_CODE