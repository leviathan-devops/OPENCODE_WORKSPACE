# Hive Mind OS — Build Execution Plan

**Version:** 1.0
**Date:** 2026-03-31
**Source:** ARCHITECTURE.md verbatim
**Status:** Ready for Execution

---

## Pre-Build Checklist

- [x] ARCHITECTURE.md written to shared workspace
- [x] Old knowledge base archived to `ARCHIVE_PRE_NEURAL_PATHWAYS/`
- [x] `tools/neural-pathways/` directory created
- [x] OpenViking server confirmed running on localhost:1933
- [x] Agent Swarm API confirmed running on localhost:3013
- [x] OpenCode database at `/home/leviathan/.local/share/opencode/opencode.db` (240 sessions)

---

## Build Sequence

### PHASE 1: ETL Pipeline — Session Extractor

**Script:** `/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/session_extractor.py`

**What it does:**
1. Connects to `/home/leviathan/.local/share/opencode/opencode.db`
2. Extracts ALL 240 sessions
3. **DELETES noise sessions directly from DB:**
   - Title matching `^2\+2`, `calculation`, or `test message` with < 3 messages
4. Classifies remaining sessions into 7 categories
5. Outputs JSON Lines to `extracted_sessions.jsonl`

**Session Classification Rules:**

| Pattern in title | Category |
|-----------------|----------|
| `spider`, `guardian`, `firewall` | architecture |
| `build`, `implement`, `workflow` | build |
| `explore`, `forensic`, `analyze` | investigation |
| `swarm`, `migration`, `adapter` | orchestration |
| `review`, `reviewer` | review |
| `space invader`, `gold standard`, `omnicoder` | gold_standard |
| `glm`, `qwen`, `deepseek`, `openviking`, `hive mind` | integration |
| `test`, `failed`, `error`, `permission denied` | failure |

**Extracted fields per session:**
- `session.id`
- `session.title`
- `session.parent_id`
- `session.time_created` / `time_updated`
- `session.directory`
- `message` rows (role, summary, agent, model)
- `part` rows (reasoning, tool calls with args/outputs/errors)
- `session.permission` ruleset

**Run command:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways
python3 session_extractor.py
```

**Expected output:** `extracted_sessions.jsonl` with ≥150 sessions

---

### PHASE 2: Synthesis — T2 Macro Context Generator

**Script:** `/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/session_synthesizer.py`

**What it does:**
1. Reads `extracted_sessions.jsonl`
2. For each session, generates a **T2 Macro Context** using MiniMax M2.7
3. T2 Macro Context includes:
   - GOAL: What the user asked
   - WHAT HAPPENED: Step-by-step narrative
   - KEY BREAKTHROUGHS: Discovery/invention/solution moments
   - PATTERNS OBSERVED: Recurring patterns
   - FAILURE MODES: Errors and how they were resolved
   - TOOL USAGE: What tools were used and how
   - FILES CHANGED: What was modified
   - LESSONS: What to remember
   - CONNECTIONS: Child sessions, related sessions
4. Gold standard sessions get extra detailed breakdowns

**Output structure:**
```
/home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED/
├── architecture/
│   ├── 01_OPENCODE_ENGINE_FORENSICS.md
│   ├── 02_OPENCODE_MCP_INTEGRATION.md
│   ├── 03_HIVE_MIND_PLUGIN_ANALYSIS.md
│   └── 04_SPIDER_ENFORCEMENT_ANATOMY.md
├── build/
│   └── [build session T2s]
├── investigation/
│   └── [investigation session T2s]
├── orchestration/
│   ├── 01_AGENT_SWARM_MIGRATION_PLAN.md
│   ├── 02_OPENCODE_HARNESS_ANALYSIS.md
│   └── [other orchestration T2s]
├── failures/
│   ├── 01_PERMISSION_DENIED_PATTERNS.md
│   ├── 02_WRITE_BLOCKED_ERRORS.md
│   └── [other failure T2s]
├── gold_standard/
│   ├── SPACE_INVADERS_BUILD_LOG.md
│   └── AGENT_BUILD_LOGIC_CHAIN.md
└── integration/
    ├── 01_OPENVIKING_SETUP.md
    ├── 02_AGENT_SWARM_API.md
    └── 03_MULTI_BRAIN_ORCHESTRATION.md
```

**MiniMax M2.7 API call format:**
```python
# API endpoint: https://api.minimaxi.com/v1/text/chatcompletion_v2
# Model: MiniMax-M2.7
# max_completion_tokens: 10240 (NOT max_tokens — deprecated)
# temperature: 1.0, top_p: 0.95, stream: false
# Paid tier rate limit: 500 RPM / 20M TPM — use 1s delay between calls
# Free tier: 20 RPM / 1M TPM — use 3s delay between calls
```

**Run command:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways
python3 session_synthesizer.py
```

**Expected output:** `T2_SYNTHESIZED/` with all 7 category directories populated

---

### PHASE 3: OpenViking Loader — Bulk Ingest

**Script:** `/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/openviking_loader.py`

**What it does:**
1. Reads all `T2_SYNTHESIZED/*.md` files
2. Ingests into OpenViking at `viking://resources/hive-mind/shared/knowledge/`
3. Uses HTTP API or CLI to create resources
4. Deletes old default workspace data (only keep `shared/`)

**API endpoint:** `http://localhost:1933/api/v1/resources`
**Headers:** `X-API-Key: ${OPENVIKING_API_KEY}`

**Run command:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways
python3 openviking_loader.py
```

**Expected output:** `ov tree viking://resources/hive-mind/shared/` shows clean `knowledge/` structure

---

### PHASE 4: OpenCode Harness Adapter

**Files to create in `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/src/providers/`:**

#### `opencode_adapter.ts`
Provider adapter implementing:
```typescript
interface ProviderAdapter {
  readonly name: "opencode"
  createSession(config: ProviderSessionConfig): Promise<ProviderSession>
  canResume(sessionId: string): Promise<boolean>
  formatCommand(commandName: string): string
}
```

#### `opencode_session.ts`
Session wrapper that:
- Spawns `opencode` CLI with `--session` flag
- Streams stdout/stderr as events
- Maps OpenCode tool calls → swarm task results
- 30-minute timeout

#### `index.ts` update
Add to provider factory switch:
```typescript
case "opencode": return new OpenCodeAdapter()
```

#### Dockerfile update
Add to `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/Dockerfile`:
```dockerfile
RUN npm install -g opencode-ai
ENV OPENCODE_API_KEY=${OPENCODE_API_KEY}
```

---

### PHASE 5: HiveMindPlugin Enhancement

**File:** `/home/leviathan/OPENCODE_WORKSPACE/projects/hive-mind/plugin/src/index.ts`

**New tools to add:**

#### `memread_session`
Read full session from `opencode.db` by session ID.
```typescript
memread_session: tool({
  args: {
    session_id: z.string(),
    level: z.enum(["abstract", "overview", "full"]).default("overview")
  },
  execute: async ({ session_id, level }) => {
    // Query opencode.db for session
    // Generate T1 overview on-the-fly
    // Return with appropriate detail level
  }
})
```

#### `memlink_parent`
Link current session to parent session in OpenViking.
```typescript
memlink_parent: tool({
  args: {
    parent_session_id: z.string()
  },
  execute: async ({ parent_session_id }) => {
    // Read parent T1 from OpenViking
    // Create link in current session's OpenViking entry
  }
})
```

**Enhance auto-commit:**
- Change session end detection from 5min to **20min inactivity**
- On session end: generate T1 overview, write to `viking://.../sessions/{id}/`
- Breakthrough detection: auto-tag to `viking://.../knowledge/breakthroughs/`

---

### PHASE 6: Session Monitor Daemon

**Script:** `/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/session_monitor.py`

**What it does (runs continuously):**
- Polls `opencode.db` every 60 seconds
- Tracks `time_updated` on sessions
- For any session updated since last check:
  - If session ended (no new messages in 20 minutes): generate T1 overview
  - Write T1 to `viking://resources/hive-mind/shared/sessions/{id}/`
  - Update session index at `viking://.../sessions/INDEX.md`
- Maintains state in `monitor_state.json`

**T1 Overview format:**
```markdown
# SESSION: {title}

**ID:** {session_id} | **Category:** {category} | **Duration:** {n}min
**Agents:** {primary_agent} + {subagents if any}
**Model:** {model_id}

## ONE-LINE
{一句话 summary in English}

## KEY TOOL CALLS
- `{tool}` ×{count}: {what it did}

## RESULT
{success|failure|partial} — {brief outcome}

## BREAKTHROUGH?
{your breakthrough here} or "none"
```

**Run command (as daemon):**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways
python3 session_monitor.py &
```

---

### PHASE 7: Swarm ↔ OpenViking Bidirectional Sync

**Configuration in Agent Swarm:**

Sync rules for these events → OpenViking writes:

| Event | OpenViking URI |
|-------|---------------|
| `send_task` | `viking://resources/hive-mind/shared/swarm/tasks/{task_id}/` |
| `store_progress` (complete) | Same as above + result summary |
| `inject_learning` | `viking://resources/hive-mind/shared/swarm/learnings/{learning_id}/` |
| Agent joins | `viking://resources/hive-mind/shared/swarm/agents/{agent_id}/` |
| Task fails | `viking://resources/hive-mind/shared/swarm/failures/{task_id}/` |

**`agent_swarm_memory_search` enhancement:**
- Query Agent Swarm SQLite memory first
- ALSO query OpenViking at `viking://resources/hive-mind/shared/knowledge/`
- Merge results by semantic relevance

---

## Verification Commands

After each phase, run these to verify:

```bash
# PHASE 1 VERIFY
python3 -c "
import sqlite3, json
conn = sqlite3.connect('/home/leviathan/.local/share/opencode/opencode.db')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM session')
total = cursor.fetchone()[0]
cursor.execute(\"SELECT COUNT(*) FROM session WHERE title NOT LIKE '%2+2%' AND title NOT LIKE '%calculation%' AND title NOT LIKE '%Test message%'\")
meaningful = cursor.fetchone()[0]
print(f'Total sessions: {total}')
print(f'Meaningful sessions: {meaningful}')
import os
print(f'JSONL lines: {sum(1 for _ in open(\"/home/leviathan/OPENCODE_WORKSPACE/tools/neural-pathways/extracted_sessions.jsonl\"))}')
"

# PHASE 2 VERIFY
find /home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED/ -name "*.md" | wc -l

# PHASE 3 VERIFY
cd /home/leviathan/OPENCODE_WORKSPACE/projects/OpenViking
source .venv/bin/activate 2>/dev/null || true
ov tree viking://resources/hive-mind/shared/ --account default --user hive-mind

# PHASE 4 VERIFY
curl -s -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" \
  http://localhost:3013/api/providers 2>/dev/null | python3 -m json.tool

# PHASE 5-7 VERIFY
# Test memread_session and memlink_parent in a new OpenCode session
# Monitor OpenViking for new session entries after 20min inactivity
```

---

## Troubleshooting

**OpenViking not responding:**
```bash
ps aux | grep openviking
# Restart if needed
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive-mind/scripts
./start-openviking.sh
```

**Agent Swarm not responding:**
```bash
curl -s -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" \
  http://localhost:3013/api/agents
```

**opencode.db locked:**
```bash
# Check for running opencode sessions
ps aux | grep opencode
# db is locked during active sessions
```

**MiniMax API rate limit:**
- Add delay between synthesis calls (2s)
- If rate limited, pause and retry after 60s

---

**This plan is the verbatim build execution guide.**
**Follow PHASE 1 → 2 → 3 → 4 → 5 → 6 → 7 in order.**
