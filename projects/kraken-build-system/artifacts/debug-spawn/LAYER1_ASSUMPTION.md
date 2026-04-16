# LAYER 1: ASSUMPTION STATEMENT

**Problem Being Solved:** `opencode run 'spawn a shark agent'` fails with `TypeError: schema._zod.def`

---

## 1.1 Explicit Assumption

**Assumption:** The Zod schema error occurs because the `spawn_cluster_task` tool's schema is being processed incorrectly by OpenCode's runtime in version 1.4.3, specifically when parsing tool arguments for tools that spawn Docker containers.

---

## 1.2 Reasoning Chain

1. The plugin initializes correctly (clusterCount: 3, totalAgents: 11, krakenHiveReady: true)
2. The error `schema._zod.def` appears at runtime when `opencode run` executes a task
3. The spawn tools use Zod schemas to validate their arguments
4. OpenCode 1.4.3 may have changed how it processes tool schemas at runtime
5. The error is in the OpenCode runtime (bun bundle), not in our plugin code

---

## 1.3 Success Criteria

1. `opencode run 'spawn a shark agent'` completes without TypeError
2. A Docker container is spawned (visible via `docker ps`)
3. The spawned container runs the expected shark agent

---

## 1.4 Confirmation / Disproof Criteria

**Would confirm:** 
- Command executes successfully
- `docker ps` shows new container running

**Would disprove:**
- Same error occurs regardless of changes
- Error is in OpenCode core, not fixable in our plugin

---

## Anti-Derailment Check

- [x] Assumption is EXPLICIT
- [x] Reasoning chain shows WHY
- [x] Success criteria are OBSERVABLE
- [x] Acknowledged what would disprove assumption
