# LAYER 2: ACTION & EXPECTED OUTPUT

---

## 2.1 Hypothesis for Testing

**Hypothesis:** The Zod error is caused by a schema compatibility issue between our tool definitions and OpenCode 1.4.3's runtime. The `spawn_cluster_task` tool may have a schema structure that OpenCode's runtime processes differently than expected.

---

## 2.2 Action to Test

**Action:** Examine the spawn tool schema definition and compare with a working tool schema to identify differences.

**Command:**
```bash
# Check what tools are registered and their schema structure
docker run --rm kraken-v2.0-ship-test:latest bash -c "opencode debug agent kraken 2>&1" | grep -A50 '"tools"'
```

**Expected Output:**
- Full tool definitions with schemas visible
- Can compare spawn tool schema with working tools

---

## 2.3 Alternative Action

**Action:** Check if the issue is Docker socket availability in the container.

**Command:**
```bash
docker run --rm kraken-v2.0-ship-test:latest bash -c "ls -la /var/run/docker.sock 2>&1"
```

**Expected Output:**
- Either file exists and is socket, or file doesn't exist

---

## 2.4 Test Environment State

| Component | State |
|-----------|-------|
| OpenCode version | 1.4.3 |
| Plugin | kraken-agent loaded |
| Docker socket | Need to check |
| kraken-agent bundle | 59cc4bba07bba0410d1f1dd074c691da |
