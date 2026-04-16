# Deep Planning Mode - Troubleshooting

## Common Issues

### Build Errors

#### "Cannot find module '../context-library/patterns'"

**Cause:** TypeScript can't resolve the context-library module.

**Fix:** Ensure the context-library directory exists with all required files:
```
context-library/
├── index.ts
├── patterns.ts
├── lessons.ts
├── templates.ts
└── types.ts
```

#### "No matching export for 'SEVERITY'"

**Cause:** The types.ts re-export doesn't match import.

**Fix:** Check that both src/types.ts and context-library/types.ts export SEVERITY identically.

---

### Pattern Detection Issues

#### "No patterns detected" when patterns exist

**Cause:** Regex pattern doesn't match your test data.

**Fix:** 
1. Verify your test data matches the regex pattern
2. Check if pattern requires context (e.g., `function` keyword)
3. Run `pattern.test('your content')` to debug

#### "Too many duplicate findings"

**Cause:** Non-global regex.exec() returning same match.

**Fix:** Ensure global flag is present:
```typescript
const flags = pattern.regex.flags.includes('g') 
  ? pattern.regex.flags 
  : pattern.regex.flags + 'g';
```

---

### Hook Issues

#### "Tool still executes despite blocking"

**Cause:** Hook not properly registered or output.blocked not set.

**Fix:** Verify hook handler sets `output.blocked = true`:
```typescript
handler: async (input, output) => {
  if (shouldBlock) {
    output.blocked = true;
    output.blockReason = '[MODE] Blocked message';
  }
}
```

#### "Console.log appears in UI"

**Cause:** Console.log in hooks pollutes OpenCode UI.

**Fix:** Remove all console.log statements. Use output.blockReason for feedback.

---

### State Issues

#### "No active plan" when plan should exist

**Cause:** State reset between commands or context not stored.

**Fix:** Ensure state persists - check that routeCommand saves to state:
```typescript
state.context = context;
state.currentPlan = plan;
```

---

### Performance Issues

#### "Plugin hangs on large input"

**Cause:** Missing safetyCount or infinite loop.

**Fix:** Add safetyCount to all while loops:
```typescript
let safetyCount = 0;
while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
  safetyCount++;
  // process
}
```

---

### Testing Issues

#### "Tests pass but real usage fails"

**Cause:** Test data doesn't match real code patterns.

**Fix:** Use real code samples in tests, not synthetic data.

---

## Debug Commands

```bash
# Type check
npm run typecheck

# Run tests with verbose
npm test -- --verbose

# Run specific test
npm test -- patterns.test.ts

# Check for console.log
grep -r "console\." src/
```

---

## Verification Checklist

- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] No console.log in dist/
- [ ] Patterns match test data
- [ ] SafetyCount prevents hangs
- [ ] Hook blocks tools correctly
- [ ] State persists between commands
