# Patterns Reference — All 170+ Patterns

## L1: THEATRICAL VERIFICATION (18 patterns)

Block verification that "counts" instead of "runs":
```typescript
const THEATRICAL_PATTERNS = [
  /grep.*\|.*wc/i,           // Counting theater
  /cat.*\|.*wc/i,
  /\|\s*wc\s+-l/i,
  /cat.*\|.*grep.*>/i,       // Verification save
  /grep.*\|.*tee/i,
  /wc\s+-l.*dist\/index\.js/i,  // Counting as proof
  /wc\s+-l.*src\/.*\.ts/i,
  /grep.*"setCurrentAgent".*src/i,  // Pattern existence as proof
  /grep.*"isSharkAgent".*src/i,
];
```

**Why Block:** `grep pattern | wc -l` = counting theater, not actual verification

---

## L2: FAKE TEST RUNNER (13 patterns)

Block test frameworks that bypass OpenCode hooks:
```typescript
const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
];
```

**Why Block:** These run OUTSIDE OpenCode, hooks don't fire, no mechanical proof

**CORRECT:** `opencode run "shark-status" --agent shark`

---

## L3: SOURCE INSPECTION (12 patterns)

Block "file exists = it works" logic:
```typescript
const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-f\s+\$\{?.*\}/i,
  /test\s+-e\s+\$\{?.*\}/i,
  /if\s+\[\s*-[fes]\s+.*\]\s*;/i,
  /grep\s+-r\s+.*src\//i,
  /ls\s+-l.*dist\//i,
];
```

**Why Block:** `test -f dist/index.js` = file exists ≠ works, need RUNTIME proof

---

## L4: WRONG CONTAINER (5 patterns)

Block hallucinated "opencode container" commands:
```typescript
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
];
```

**CORRECT Container Test:**
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'shark-status' --agent shark"
```

---

## L5: ANTI-DERAILMENT (140+ patterns)

**CRITICAL:** Text checked must ONLY be `toolArgs` (what agent is DOING), NOT `agentMessage` or `output`

### L5.1: HOST FALLBACK BLOCKER (13 patterns)
```typescript
const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  /use.*host.*instead/i,
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /not.*need.*container/i,
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /host.*prove.*it.*works/i,
];
```

### L5.2: SUCCESS CLAIM BLOCKER (16 patterns) + mechanical evidence required
```typescript
const SUCCESS_CLAIM_PATTERNS = [
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  /believe.*me.*it.*works/i,
  /already.*verified.*by.*myself/i,
  /already.*tested.*and.*works/i,
  /already.*proven.*to.*work/i,
  /obviously.*correct/i,
  /clearly.*works/i,
  /self.*evidently.*correct/i,
  /in.*my.*assessment.*it.*works/i,
  /in.*my.*experience.*it.*works/i,
  /based.*on.*my.*analysis.*works/i,
  /no.*need.*for.*test/i,
  /no.*need.*for.*verification/i,
  /no.*further.*test.*needed/i,
  /test.*not.*necessary/i,
];
```

**Evidence Required:** `ContainerTestResult.json` with `passRate >= 0.96`

### L5.3: MODEL RESTRICTION BLOCKER (15 patterns)
```typescript
const BANNED_MODEL_PATTERNS = [
  /GLM.*coding.*plan/i,
  /glm-4\./i,
  /glm-5\./i,
  /zhipuai/i,
  /deepseek.*api.*direct/i,
  /direct.*deepseek/i,
  /use.*deepseek.*instead/i,
  /use.*glm.*instead/i,
  /free.*model.*works/i,
];
```

**ALLOWED MODELS:**
- `minimax/MiniMax-M2.7` (primary)
- `google/gemma-4-26b-it` (free)
- `google/gemma-4-31b-it` (free)

### L5.4: MOCK/STUB BLOCKER (12 patterns) + mechanical evidence required
```typescript
const MOCK_STUB_PATTERNS = [
  /just.*verify.*file.*valid/i,
  /verify.*file.*syntax/i,
  /check.*if.*file.*valid/i,
  /file.*valid.*javascript/i,
  /maybe.*mock.*approach/i,
  /use.*stub.*instead/i,
  /mock.*instead.*of.*real/i,
  /just.*check.*syntax/i,
  /syntax.*check.*sufficient/i,
  /static.*analysis.*enough/i,
  /lint.*passes.*therefore.*works/i,
  /type.*check.*passes.*works/i,
];
```

**Evidence Required:** `ContainerTestResult.json` with `passRate >= 0.96`

### L5.5: SIMPLIFICATION BLOCKER (11 patterns)
```typescript
const SIMPLIFICATION_PATTERNS = [
  /too.*complex.*let.*simplify/i,
  /overcomplicated.*let.*s.*simplify/i,
  /complex.*approach.*simplify/i,
  /skip.*the.*container/i,
  /skip.*this.*complexity/i,
  /simplify.*by.*skipping/i,
  /use.*simpler.*approach/i,
  /there.*is.*a.*simpler/i,
  /simplify.*by.*using/i,
  /maybe.*overcomplicated/i,
  /probably.*overthinking.*it/i,
];
```

### L5.6: CONFUSION PRETENSE BLOCKER (12 patterns)
```typescript
const CONFUSION_PRETENSE_PATTERNS = [
  /i.*m.*confused/i,
  /i.*am.*confused/i,
  /what.*was.*the.*goal/i,
  /what.*are.*we.*trying.*to.*do/i,
  /remind.*me.*the.*goal/i,
  /maybe.*i.*misunderstand/i,
  /perhaps.*i.*misunderstood/i,
  /unclear.*what.*to.*do/i,
  /not.*sure.*how.*proceed/i,
  /need.*more.*clarification/i,
];
```

### L5.7: SCOPE CREEP BLOCKER (10 patterns)
```typescript
const SCOPE_CREEP_PATTERNS = [
  /while.*we.*re.*at.*it/i,
  /while.*we.*re.*here/i,
  /also.*could.*fix/i,
  /also.*need.*to.*do/i,
  /might.*as.*well.*also/i,
  /this.*is.*related/i,
  /related.*issue.*should/i,
  /similar.*problem.*also/i,
  /additionally.*we.*should/i,
  /we.*should.*also/i,
  /let.*s.*also.*add/i,
];
```

**CRITICAL:** Cross-agent tools (hermes_remember, hive_context, etc.) must be checked MECHANICALLY via tool name, not text search.

### L5.8: UNDERMINING BLOCKER (12 patterns)
```typescript
const UNDERMINING_PATTERNS = [
  /firewall.*not.*working/i,
  /firewall.*broken/i,
  /firewall.*is.*ineffective/i,
  /L1.*false.*positive/i,
  /L1.*too.*aggressive/i,
  /firewalls.*don.*t.*fire/i,
  /can.*you.*bypass/i,
  /can.*we.*skip.*firewall/i,
  /disable.*firewall.*temporarily/i,
];
```

### L5.9: IMPATIENCE BLOCKER (9 patterns)
```typescript
const IMPATIENCE_PATTERNS = [
  /take.*too.*long/i,
  /too.*slow.*skip/i,
  /waiting.*for.*container/i,
  /quick.*test.*suffice/i,
  /brief.*test.*enough/i,
  /this.*is.*wasting.*time/i,
  /not.*worth.*the.*time/i,
  /time.*consuming.*skip/i,
];
```

### L5.10: SELF-REFERENCE BLOCKER (12 patterns)
```typescript
const SELF_REFERENCE_PATTERNS = [
  /i.*have.*verified.*that/i,
  /i.*verified.*it.*works/i,
  /my.*verification.*shows/i,
  /i.*tested.*it.*works/i,
  /i.*ran.*it.*and.*works/i,
  /my.*testing.*confirms/i,
  /i.*know.*it.*works/i,
  /i.*am.*certain.*it.*works/i,
  /my.*assessment.*is/i,
  /in.*my.*assessment/i,
  /my.*analysis.*shows/i,
];
```

---

## Cross-Agent Tool Blocking (L5.7 Extension)

**MUST be mechanical, not text-based:**

```typescript
const CROSS_AGENT_TOOLS = [
  'hermes_remember',
  'hermes_recall', 
  'hermes_context',
  'hive_context',
  'hive_remember',
  'memread',
  'memsearch',
  'knowledge_query',
];

// Check actual tool being called, not text about it
if (CROSS_AGENT_TOOLS.includes(context.toolArgs?.tool)) {
  throw new Error(`[L5.7] CROSS-AGENT SCOPE CREEP BLOCKED`);
}
```
