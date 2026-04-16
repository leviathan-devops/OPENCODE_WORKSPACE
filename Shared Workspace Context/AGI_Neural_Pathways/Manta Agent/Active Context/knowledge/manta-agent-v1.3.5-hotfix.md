# Manta Agent V1.3.5-hotfix Knowledge

## Current State
- **Version:** 1.3.5-hotfix
- **Architecture:** Dual-brain sequential (Plan ↔ Build) with mechanical coordinator.
- **Gate Chain:** PLAN $\rightarrow$ BUILD $\rightarrow$ TEST $\rightarrow$ VERIFY $\rightarrow$ AUDIT $\rightarrow$ DELIVERY.
- **Hooks Status:** All hooks (`session`, `compacting`, `system-transform`) now correctly use `isMantaAgent` to ensure they only run for manta agent sessions, fixing the CLI-mode "always-active" bug.

## Key Findings
- The `isMantaAgent` check is now correctly implemented in all hooks in the mounted plugin.
- Automated tests (via `bun test`) passed (55 pass, 0 fail).

## Improvement Areas
- **Gate Transition Reliability**: The transitions for `TEST $\rightarrow$ VERIFY`, `VERIFY $\rightarrow$ AUDIT`, and `AUDIT $\rightarrow$ DELIVERY` need more robust, deterministic triggers.
- **Automated Security/Audit**: Automate SAST and secrets scanning upon entering the `AUDIT` gate.
- **Iteration Loop**: Verify the end-to-end loop for `VERIFY` failures and escalation.
- **Evidence Collection**: Ensure all gates are producing complete evidence archives.
