# Spider Agent Fallback Hotfix Debug Log
Date: 2026-04-02
File: /home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js

## Issue
When architect delegates to a coder/sub-agent and that sub-agent runs a long tool 
(e.g., npm run build >3 minutes), the architect's lastModelResponseTime doesn't update 
because responses go to the sub-agent. After 3 minutes, checkModelResponseTimeout() 
incorrectly triggered fallback, assuming the model was rate-limited.

## Root Cause
checkModelResponseTimeout() at dist/index.js:53827 did not check session.delegationActive 
before declaring the model "silent". When delegationActive === true, the architect is waiting 
for a sub-agent - no responses expected = normal behavior, not a rate limit.

## Fix Applied
Lines 53831-53835 (original):

```javascript
if (session.lastModelResponseTime > 0 && (now - session.lastModelResponseTime) > timeoutMs) {
  return true; // Model silent for > 3 minutes - likely rate limited
}
```

Changed to:

```javascript
if (session.lastModelResponseTime > 0 && (now - session.lastModelResponseTime) > timeoutMs) {
  if (session.delegationActive) {
    console.warn(`[Spider] MODEL FALLBACK SUPPRESSED: Model silent for >3min but delegation is active - not switching (would incorrectly trigger during active sub-agent work)`);
    return false;
  }
  return true; // Model silent for > 3 minutes - likely rate limited
}
```

## Backup
Original file backed up to: dist/index.js.backup.fallback-fix

## Verification
- Line count: 68993 → 68997 (+4 lines for the new guard block)
- Fix correctly returns false when delegationActive === true
- console.warn provides diagnostic when suppression occurs

## Telemetry Gap
Note: The silence-based fallback path (3-min timeout) does NOT emit telemetry.modelFallback().
Only the error-based fallback (line ~53348) emits that event. This means genuine 
fallback-triggered silences won't show in telemetry.jsonl events.
