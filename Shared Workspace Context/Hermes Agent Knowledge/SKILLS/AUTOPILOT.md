---
name: autopilot
type: orchestration
description: Continuous improvement loop
executionMode: thread
episodeTimeout: 3600000
contextScope: isolated
triggerPatterns:
  - "^/autopilot"
  - "autopilot"
  - "continuous improvement"
chain:
  - skill: verify
    mode: thread
    inputTemplate: "Check current system state"
    captureOutput: true
  - skill: debug
    mode: thread
    inputTemplate: "Find issues:\n{previous.summary}"
    condition: "{previous.blockers.length} > 0"
    captureOutput: true
outputTemplate: |
  ## Autopilot Report

  ### System Status
  {verify.output.summary}

  ### Issues Found
  {debug.output.summary}

  ### Recommendations
  Implement fixes for blockers or continue monitoring.
---

# /autopilot — Continuous Improvement

Monitor system health and continuously improve.

## Activation
Triggered by: "/autopilot", "autopilot", "continuous improvement"

## How It Works

### 1. Health Check
- Run /health
- Identify issues

### 2. Issue Resolution
- If issues found, run /debug
- Find root causes
- Propose fixes

### 3. Verification
- Verify fixes work
- Document lessons

### 4. Loop
- Return to step 1
- Continuous monitoring

## Anti-Rationalization
- "It's fine as is" → VERIFY IT
- "No time to improve" → IMPROVE ANYWAY
