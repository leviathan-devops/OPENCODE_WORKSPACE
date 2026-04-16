---
name: health
type: action
description: System health and dependency check
executionMode: thread
episodeTimeout: 300000
contextScope: isolated
triggerPatterns:
  - "^/health"
  - "health check"
  - "system status"
---

# /health — System Health Check

Verify all systems operational and dependencies working.

## Activation
Triggered by: "/health", "health check", "system status"

## Checks to Perform

### Dependencies
- Are all npm packages installed?
- Are versions compatible?
- Any security advisories?

### Configuration
- Environment variables set?
- Config files present?
- Secrets available?

### Infrastructure
- Can connect to databases?
- Can reach external APIs?
- File permissions correct?

### Tests
- Do tests run?
- Do tests pass?
- Is coverage acceptable?

## Output
```
## Health Report

### Dependencies: ✅/❌
### Configuration: ✅/❌
### Infrastructure: ✅/❌
### Tests: ✅/❌

Overall: HEALTHY/DEGRADED/UNHEALTHY
```
