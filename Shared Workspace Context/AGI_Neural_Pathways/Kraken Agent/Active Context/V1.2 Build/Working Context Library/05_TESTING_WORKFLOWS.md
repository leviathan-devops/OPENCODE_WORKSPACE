# Testing Workflows — Kraken v1.2

## Build Commands

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

## Deploy Commands

```bash
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v1.2/dist/
```

## Host Test Commands

```bash
# Test identity wall
opencode run "write_file" --agent vanilla
# Expected: BLOCKED - non-kraken agent cannot write to kraken paths

# Test Kraken status
opencode run "kraken-status" --agent kraken
# Expected: Shows cluster status

# Test cluster spawning
opencode run "spawn_shark_agent" --agent kraken
# Expected: Task queued, outputs must be retrieved
```

## Container Test Workflow

```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'kraken-status' --agent kraken"
```

## Evidence Collection

### L2 False Completion Evidence
```json
{
  "taskId": "task_123",
  "status": "completed",
  "outputsRetrieved": true,
  "outputFiles": [
    "/tmp/build/artifacts/index.js",
    "/tmp/build/artifacts/manifest.json"
  ],
  "verifiedOnHost": true
}
```

### L7 Coordination Gate Evidence
```json
{
  "gateId": "output-retrieval-gate",
  "passed": true,
  "criteria": {
    "outputs-retrieved": true,
    "files-verified": true,
    "merge-prepared": true
  },
  "evidence": {
    "taskId": "task_123",
    "retrievedFiles": 5,
    "hostPathsConfirmed": true
  }
}
```

## Test Cases

### L0 Identity Wall
| Tool | Agent | Path | Expected |
|------|-------|------|----------|
| write_file | vanilla | kraken-path | BLOCK |
| write_file | kraken | kraken-path | ALLOW |
| read_file | vanilla | kraken-path | ALLOW |
| write_file | vanilla | other-path | ALLOW |

### L1 Orchestration Theater
| Tool Call | Expected |
|----------|----------|
| spawn_shark_agent + claims "done" | BLOCK |
| spawn_shark_agent + get_cluster_status | ALLOW |
| report_to_kraken + outputs retrieved | ALLOW |

### L2 False Completion
| Scenario | Expected |
|----------|----------|
| Task complete, outputs not retrieved | BLOCK |
| Task complete, outputs retrieved | ALLOW |
| Task in progress | ALLOW |

### L4 Wrong Cluster
| Task Type | Assigned Cluster | Expected |
|----------|------------------|----------|
| debug | cluster-alpha | BLOCK |
| debug | cluster-beta | ALLOW |
| build | cluster-alpha | ALLOW |
| build | cluster-beta | BLOCK |

---
*Last Updated: 2026-04-12*