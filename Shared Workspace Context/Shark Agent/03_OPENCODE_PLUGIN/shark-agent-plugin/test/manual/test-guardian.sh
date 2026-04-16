#!/bin/bash

cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin

set -e

echo "Testing Guardian path blocking..."

# Test Guardian protection
result=$(enforceSharkArchitecture({
  tool: "write",
  args: {
    filePath: "/home/leviathan/.ssh/config",
    content: "test content"
  },
  sessionID: "test-session",
  workflowStep: "plan",
  agent: "test-agent",
  context: {}
})

if [ "$result" == "allowed: false" ]; then
  echo "✅ PASS: Guardian correctly blocked write to ~/.ssh"
  echo "  Reason: ${result.reason}"
  exit 0
else
  echo "❌ FAIL: Guardian did not block ~/.ssh write"
  echo "  Expected: allowed=false"
  echo "  Actual result: ${result.allowed}"
  echo "  Reason: ${result.reason}"
  exit 1
fi
