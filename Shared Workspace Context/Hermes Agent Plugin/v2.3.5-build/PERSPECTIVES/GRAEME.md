# Graeme — 3-Agent Self-Improving Supervisor + 4-Marker Protocol

Source: Twitter/gkisokay — autonomous agent loop patterns
Full analysis: `~/hermes-workspace/context/engineering/THREAD_ANALYSIS_COMPLETE.md`

---

## The 3-Agent Self-Improving Loop

Graeme's framework uses 3 agents that continuously improve:

```
┌─────────────────────────────────────────────────────────┐
│  AGENT 1: OPERATOR                                     │
│  - Executes tasks                                      │
│  - Calls for help when stuck                           │
│  - Logs everything                                      │
└─────────────────────┬───────────────────────────────────┘
                      │ reports to
                      ▼
┌─────────────────────────────────────────────────────────┐
│  AGENT 2: SUPERVISOR (monitor → propose → verify)     │
│  - Monitors logs for patterns                          │
│  - Detects: failed tasks, stale jobs, repeated bugs    │
│  - Proposes fixes with risk classification            │
│  - Verifies fixes worked                               │
└─────────────────────┬───────────────────────────────────┘
                      │ audits
                      ▼
┌─────────────────────────────────────────────────────────┐
│  AGENT 3: AUDITOR                                       │
│  - Verifies supervisor proposals before apply         │
│  - Cross-references patterns from prior sessions      │
│  - Escalates if fix is high-risk                      │
└─────────────────────────────────────────────────────────┘
```

---

## Risk Classification

Every proposed fix is classified:

| Risk | Action | Example |
|------|--------|---------|
| **LOW** | Auto-apply + log | Lint fix, format fix, readme update |
| **MEDIUM** | Apply + notify | Config change, dependency bump |
| **HIGH** | Escalate to human | Architecture change, data migration |

**Rule**: If Agent 3 can't verify the fix is safe, it escalates.

---

## The 4-Marker Intent Protocol

When agents communicate (via messages or tool results):

```
[STATUS_REQUEST]
→ "Agent 1 asks Agent 2 for status"
→ "What is the current state of X?"

[REVIEW_REQUEST]
→ "Agent 2 asks for review"
→ "Please verify my proposal"

[ESCALATION_NOTICE]
→ "Human notified of issue"
→ "Problem detected: [description]"
→ "Action required: [what user must decide]"

[ACK]
→ "Terminal. Stop. Neither bot replies."
→ "Max loop depth: 3 messages"
→ "After [ACK], the conversation is done"
```

---

## Message Rules

1. **One marker per message** — no stacking
2. **One @mention per message** — who you're talking to
3. **[ACK] is terminal** — stop immediately, no reply
4. **Max loop depth: 3** — after 3 messages, escalate or end
5. **No reply chains** — one message per turn, no "responding to"

---

## Hermes Implementation

### Supervisor Agent (Agent 2)

```typescript
const SUPERVISOR_PROMPT = `You are @supervisor — Graeme's Agent 2.

## Your Role
Monitor logs, propose fixes, classify risk, verify fixes worked.

## 3-Agent Loop
- Agent 1 (Operator): Executes tasks, reports to you
- You (Supervisor): Monitor, propose, verify
- Agent 3 (Auditor): Verifies your proposals before apply

## Your Process

### Monitor
- Poll agent-swarm logs (localhost:3013) every 60 seconds
- Detect patterns:
  - Same task failed 3+ times
  - Agent stuck waiting for input > 5 minutes
  - Repeated bug with no fix applied
  - Quality score degraded

### Propose
For each detected pattern:
1. Diagnose root cause
2. Propose fix with risk level (LOW/MEDIUM/HIGH)
3. Explain why LOW risk: "config change, easily reversible"
4. Explain why HIGH risk: "requires data migration, not easily reversible"

### Verify
After fix is applied:
1. Confirm fix worked
2. Log improvement
3. If fix failed: propose alternative

## Risk Classification

| Risk | When | Action |
|------|------|--------|
| LOW | Lint, format, readme, simple config | Auto-apply + log |
| MEDIUM | Dependency bump, non-critical config | Apply + notify user |
| HIGH | Architecture, data migration | Escalate via [ESCALATION_NOTICE] |

## 4-Marker Protocol

When communicating with Agent 3 (Auditor):

[REVIEW_REQUEST] @auditor
Please verify my proposal: Fix for repeated auth bug.
Risk: MEDIUM (non-critical config change)
Proposal: Add retry logic to token refresh.

## Anti-Rationalization

- [ ] I monitored logs before proposing
- [ ] My risk classification is justified
- [ ] I verified fixes worked
- [ ] I escalated HIGH risk issues
- [ ] I used correct marker format
`;
```

---

## Supervisor Loop Implementation

```typescript
// Supervisor service — runs continuously
export async function runSupervisorLoop() {
  const LOG_POLL_INTERVAL = 60_000; // 60 seconds
  
  while (true) {
    await sleep(LOG_POLL_INTERVAL);
    
    // 1. Monitor: Get recent logs
    const logs = await pollAgentLogs();
    const patterns = detectPatterns(logs);
    
    for (const pattern of patterns) {
      // 2. Propose: Generate fix proposal
      const proposal = await supervisorAgent.proposeFix(pattern);
      
      // 3. Audit: Get auditor verification
      if (proposal.risk === "LOW") {
        // Auto-apply for LOW risk
        await applyFix(proposal);
        await logFix(proposal);
      } else {
        // MEDIUM/HIGH: ask auditor
        const verified = await auditorAgent.verify(proposal);
        
        if (verified && proposal.risk === "MEDIUM") {
          await applyFix(proposal);
          await notifyUser(proposal);
        } else if (verified && proposal.risk === "HIGH") {
          await escalateToUser(proposal);
        }
      }
    }
  }
}
```

---

## Integration with Hermes

- Supervisor loop runs as background service in `src/services/supervisor.ts`
- `@supervisor` agent is Agent 2 in the loop
- Auditor is a separate invocation of `@supervisor` in verification mode
- Logs are fed via `supervisor-ingest` hook from all tool executions
- [ACK] marker enforced via `intent-marker` hook
