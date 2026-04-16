# Decision: Architecture Fix for Manta Agent Hooks (v1.3.5-hotfix)

**Date:** 2026-04-11
**Context:** The Manta Agent hooks (`compacting` and `system-transform`) were "always active" in CLI mode because they couldn't find the `agent` field in their input, causing them to run for all agent sessions.

**Decision:**
Implement `isMantaAgent` checks in all hooks by correctly extracting the `agent` identity from the available input/output fields.

**Rationale:**
- Improves efficiency by preventing unnecessary hook execution for non-manta agents.
- Ensures consistent behavior across CLI and daemon modes.

**Status:** Implemented and verified in `kraken-agent-v1.1/manta-agent/`.
