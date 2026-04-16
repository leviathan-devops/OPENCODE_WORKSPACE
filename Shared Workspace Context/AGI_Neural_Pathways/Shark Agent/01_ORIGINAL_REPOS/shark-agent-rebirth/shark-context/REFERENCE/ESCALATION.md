# SHARK AGENT V4 — Escalation Protocol

**Purpose:** T2 reference for human escalation procedures
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## Escalation Philosophy

**Auto-debug first. Escalate only when stuck.**

Shark Agent's first response to any problem is automatic debugging (60% of errors are known patterns). Escalation is the last resort when:
1. Auto-debug cannot fix the issue
2. The problem is unknown or unprecedented
3. Human decision is required
4. Security-critical issue detected

---

## Escalation Triggers

### Critical (STOP EVERYTHING)

```
⛔ Secret/API key detected in code
⛔ SAST critical/high vulnerability
⛔ Guardian zone breach (execution outside workspace)
⛔ Data exfiltration attempt
⛔ Dependency with known critical CVE
```

**Response:** Immediate stop. Cannot proceed until human resolves.

---

### High (Block ship)

```
⚠ Same error 3+ times (auto-debug exhausted)
⚠ Unknown error after auto-debug attempts
⚠ Coverage < 80% after attempts
⚠ Build fails after auto-debug
⚠ Security concern (medium severity)
```

**Response:** Block ship, attempt auto-debug 3x, escalate if unresolved.

---

### Medium (Note and continue)

```
⚠ Non-critical SAST finding
⚠ Deprecated dependency
⚠ Performance concern
⚠ Code style violation (non-blocking)
```

**Response:** Log, continue, report at delivery.

---

## Escalation Format

Every escalation to human must follow this exact format:

```
═══════════════════════════════════════════════════════════════════════════
⚠ SHARK ESCALATION — [{variant}/{brain}]

ISSUE: {one-line summary of the problem}
SEVERITY: Critical | High | Medium

FOUND:
  Location: {file path, line number, or workflow phase}
  When: {gate/phase where issue was detected}
  Evidence: {specific output, error message, or finding}

IMPACT:
  What happens if this ships: {consequence description}
  What happens if not fixed: {risk description}

AUTO-DEBUG ATTEMPTS: {number of attempts made}
AUTO-FIX RESULT: {what happened when auto-debug ran}

RECOMMENDED ACTION:
  1. {specific step to resolve}
  2. {specific step to resolve}
  3. {specific step to resolve}

CONTEXT FOR RESOLUTION:
  {relevant code snippet, error trace, or configuration}

STOP SHIP UNTIL RESOLVED.
═══════════════════════════════════════════════════════════════════════════
```

---

## Escalation Examples

### Example 1: Secret Detected

```
═══════════════════════════════════════════════════════════════════════════
⚠ SHARK ESCALATION — [macro/system-brain]

ISSUE: API key detected in committed code
SEVERITY: Critical

FOUND:
  Location: src/config.js:15
  When: review-gate (SAST scan)
  Evidence: "GitHub token detected: ghp_xxxxxxxxxxxxx"

IMPACT:
  What happens if this ships: Credentials exposed in repo, potential account compromise
  What happens if not fixed: Security breach, credential rotation required

AUTO-DEBUG ATTEMPTS: 0 (immediate escalation for secrets)
AUTO-FIX RESULT: Cannot auto-fix — requires human decision

RECOMMENDED ACTION:
  1. Remove the API key from code immediately
  2. Rotate the exposed GitHub token at https://github.com/settings/tokens
  3. Use environment variables or secrets manager for credentials
  4. Re-run secrets scan after fix

CONTEXT FOR RESOLUTION:
  ```javascript
  // src/config.js:15
  const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxx';  // REMOVE THIS
  ```
  Should be: process.env.GITHUB_TOKEN

STOP SHIP UNTIL RESOLVED.
═══════════════════════════════════════════════════════════════════════════
```

---

### Example 2: Recurring Error

```
═══════════════════════════════════════════════════════════════════════════
⚠ SHARK ESCALATION — [micro/plan-brain]

ISSUE: Docker build failing with EACCES permission error (3 attempts)
SEVERITY: High

FOUND:
  Location: Dockerfile:23 (USER directive)
  When: build-gate
  Evidence: "EACCES: permission denied, mkdir '/usr/local/lib/node_modules'"

IMPACT:
  What happens if this ships: Docker image cannot be built
  What happens if not fixed: CI/CD pipeline fails, no deployment

AUTO-DEBUG ATTEMPTS: 3
AUTO-FIX RESULT: Attempted 1) npm install with --prefix, 2) create dirs before USER,
                 3) chmod 777 on directories. Error persists — unknown root cause.

RECOMMENDED ACTION:
  1. Check if Dockerfile requires node_modules pre-built in base image
  2. Consider using multi-stage build to isolate root operations
  3. Verify the base image supports the USER directive being used
  4. Share full Dockerfile for manual review

CONTEXT FOR RESOLUTION:
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install --production
  USER node                    # ← Error occurs after this
  CMD ["node", "server.js"]
  ```

STOP SHIP UNTIL RESOLVED.
═══════════════════════════════════════════════════════════════════════════
```

---

## Escalation Response Protocol

### Human Response Steps

```
1. READ: Read the escalation format completely
         │
         ▼
2. ASSESS: Evaluate severity and impact
         │
         ▼
3. RESOLVE: Take recommended action or determine alternative
         │
         ▼
4. COMMUNICATE: Tell Shark Agent what was done
         │
         ▼
5. VERIFY: Shark Agent re-runs verification
         │
         ▼
6. CONTINUE: Execution resumes (if resolved)
```

---

## Escalation Prevention

### Auto-Debug Before Escalation

Before any escalation, Shark MUST attempt auto-debug:

```python
def attempt_auto_debug(error):
    signature = hash_error(error)
    
    if signature in KNOWN_ERRORS:
        fix = KNOWN_ERRORS[signature]
        if apply_fix(fix):
            return ("auto-fixed", fix)
    
    if signature in RECURRING_ERRORS:
        return ("escalate", "recurring error")
    
    return ("escalate", "unknown error")
```

### Known Error Signatures

| Error Type | Signature | Auto-fix |
|-----------|-----------|----------|
| Docker perms | EACCES mkdir node_modules | Create dirs before USER |
| npm EACCES | permission denied npm | Check npm prefix config |
| TypeScript types | Cannot find module | Install @types package |
| stdin.isTTY | isTTY undefined | Explicit tty check |
| Timeout | request timeout | Increase SHARK_TIMEOUT |
| Port in use | EADDRINUSE | Kill existing process |

---

## Recovery After Escalation

When human resolves an escalation:

```
1. Human communicates resolution
   "Rotated the GitHub token, removed from code, added .gitignore"
         │
         ▼
2. Shark re-verifies
   → Re-run affected gate
   → Collect new evidence
   → Confirm issue resolved
         │
         ▼
3. Shark continues
   → Resume execution from point of failure
   → Or restart gate if necessary
         │
         ▼
4. Document in escalation log
   → .shark/escalations/{timestamp}.md
   → What happened, what was done, resolution
```

---

## Escalation Log

All escalations are logged to `.shark/escalations/` with:

```
.shark/escalations/
├── 2026-04-05T10-24-00_SECRET_IN_CODE.md
├── 2026-04-05T11-30-00_DOCKER_BUILD_FAIL.md
└── index.json              # Escalation index
```

Each escalation file contains:
- Full escalation message
- Human's response
- Resolution confirmation
- Time to resolve
- Prevention measures added

---

*Escalation Protocol*
*Shark Agent V4 — T2 Reference*
