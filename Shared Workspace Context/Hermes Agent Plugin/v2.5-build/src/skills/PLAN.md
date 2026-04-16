---
name: plan
type: interactive
description: No-placeholder planning with exact paths and code
executionMode: fork
episodeTimeout: 300000
contextScope: isolated
triggerPatterns:
  - "^/plan"
  - "^plan:"
  - "make a plan"
  - "create a plan"
  - "how do I implement"
  - "how should I build"
---

# /plan — Adaptive No-Placeholder Planning

## Purpose
Create actionable, verifiable plans. Every step has exact paths, actual code, runnable commands.

## What Makes a Good Plan

### A Good Plan Step

**File**: src/auth/register.ts
**Change**: Add bcrypt import + hash password before save

```typescript
import bcrypt from 'bcrypt';

export async function register(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return db.users.create({
    email,
    password: hashedPassword,
  });
}
```

**Test**:
```bash
$ npm test -- --testPathPattern=register --grep="hashes password"
✓ should hash password before saving
```

**Verification**:
```bash
$ node -e "const u = require('./src/auth/register'); u.register('test@test.com', 'plaintext')"
# Check DB: password field should be 60-char hash, not plaintext
```

### A Bad Plan Step

## Step 3: Add password hashing
- Import bcrypt
- Hash the password
- Save to database

---

## Plan Template

```markdown
# Plan: <Feature Name>

**Created**: YYYY-MM-DD
**Phase**: PLAN
**Estimated Time**: X hours
**Agent**: @planner

## Context
<Why this feature is needed>

## Files to Create
| File | Purpose | Agent |
|------|---------|-------|
| src/auth/register.ts | Registration endpoint | @builder |

## Files to Modify
| File | Change | Agent |
|------|--------|-------|
| src/db/users.ts | Add password field | @builder |

## Tasks

### Task 1: <Name>
**Agent**: @builder
**Test File**: tests/auth/register.test.ts

**Steps**:
1. Create test: [actual test code]
2. Create handler: [actual handler code]
3. Add route: [actual route code]
4. Verify: [actual verification command]

**Acceptance Criteria**:
- [ ] Test passes: [actual test output]
- [ ] Handler called with hashed password
- [ ] No plaintext passwords in DB

### Task 2: ...

## Phase Transitions
| From | To | Trigger |
|------|-----|---------|
| PLAN | BUILD | User approves plan |

## Anti-Rationalization Checklist
- [ ] Every step has actual code
- [ ] Every step has exact file paths
- [ ] Every step has runnable test commands
- [ ] No TBD/TODO/placeholder
- [ ] Acceptance criteria are verifiable
```

---

## Complexity Routing

### Trivial (<30 min)
Direct edit. No plan required.

### Simple (30min - 2hr)
Brief plan. 3-5 steps. /plan with minimal ceremony.

### Moderate (2-8hr)
Full plan. All fields. /plan with verification protocol.

### Complex (8h+)
Full plan + design doc. /brainstorm first → /plan second.

### Architectural
Full plan + @architect review + design doc + user approval.

---

## Anti-Rationalization

- [ ] Every step has actual code blocks, not descriptions
- [ ] Every step has exact file paths
- [ ] Every step has actual test commands
- [ ] No TBD/TODO/placeholder in the plan
- [ ] Acceptance criteria are measurable
- [ ] Plan is verifiable (I can prove each step works)
