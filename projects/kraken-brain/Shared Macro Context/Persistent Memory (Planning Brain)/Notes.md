# 🧠 Persistent Memory - Planning Brain

## Notes.md

**Purpose**: Document micro-architecture patterns, iterative versioning system, and and lessons learned during the build session

---

## 📋 Build Session Summary - March 28, 2026

### Completed Tasks:
1. ✅ Fixed all GLM 4.5-flash references to GLM 4.7 in V2 codebase
2. ✅ Fixed CLI --firewall-stats to show real data (not placeholders)
3. ✅ Integrated vLLM (Qwen 2.5 Coder 7B) as primary Micro Engineer execution brain
4. ✅ Created VLLM client (`src/brain/vllm.ts`)
5. ✅ Updated Micro Coordinator to use vLLM with Gemma fallback
6. ✅ All 11 integration tests passing
7. ✅ TypeScript compiles without errors

---

## 🏗️ Iterative File Versioning System

### Pattern: `(VX)` Suffix with Subfolder Organization

**Example Structure:**
```
src/tools/
├── executor/
│   ├── executor(V1).ts      # Original
│   └── executor(V2).ts      # FirewallMesh integrated
└── firewall-mesh/
    ├── firewall-mesh(V1).ts  # Original
    └── firewall-mesh(V2).ts  # Expanded coverage
```

### Rules:
1. **Clone files before editing** - Create `(VX)` version
2. **Add subfolder** - Move all versions to dedicated folder
3. **Update imports** - Fix all import paths
4. **Add detailed comments** - Document what changed between iterations
5. **Maintain backwards compatibility** - Original files remain untouched

---

## 🔄 Model-Asynchronous Auditability

### Concept: Different models can be used at different workflow stages

**Current Architecture:**
- **Plan Stage**: DeepSeek Reasoner (strategic planning)
- **Build Stage**: GLM 4.7-flash (Macro) / Qwen 2.5 Coder (Micro)
- **Test Stage**: Can use different model
- **Verify Stage**: Can use different model
- **Ship Stage**: Can use different model

### Implementation:
- Each model's decisions are logged separately
- Audit trail includes which model made which decision
- Stats flow: ToolExecutor → Coordinator → CLI
- Evidence files: `.shark/firewall-audit.jsonl`

---

## 🎓 Lessons Learned

### 1. Placeholder Code is a Common Bug
**Issue**: CLI `--firewall-stats` showed hardcoded zeros instead of real data
**Root Cause**: Flag handled before CLI instance was created
**Fix**: Create CLI instance first, then call `getFirewallStats()`
**Location**: `src/cli(V2).ts:645-677`

### 2. Integration Gaps Can Hide in Plain Sight
**Issue**: FirewallMesh was instantiated but never called
**Detection**: Original executor.ts had `new FirewallMesh()` but never called `checkToolCall()`
**Fix**: Add `await firewallMesh.checkToolCall()` before tool execution
**Location**: `src/tools/executor(V2).ts:87`

### 3. Model Names Matter for Documentation
**Issue**: Docs said "GLM 4.5-flash" but user wanted "GLM 4.7"
**Impact**: Confusion about which model is actually being used
**Fix: Search and replace all references
**Files Updated**: 7 files across codebase

### 4. Default Model Selection Should be Local First
**Issue**: Micro Engineer defaulted to cloud Gemma API
**Problem**: API key leaked, limited requests
**Fix**: Default to local vLLM (Qwen 2.5 Coder), with Gemma as fallback
**Location**: `src/brain/coordinator-micro(V2).ts`

---

## 🏗️ MICRO-ARCHITECTURE PATTERNS

### 1. **Parallel Firewall Execution**
- Multiple firewalls run concurrently (Promise.all)
- Each firewall has different priority
- Result aggregation with decision logic
- **Location**: `src/tools/firewall-mesh(V2).ts`

### 2. **Constitutional Logging**
- Every operation logged (no bypasses)
- Audit trail stored in `.shark/firewall-audit.jsonl`
- Includes: timestamp, tool, decision, reason
- **Location**: `src/tools/audit(V2).ts`

### 3. **Statistics Flow Pattern**
- Data flows: ToolExecutor → Coordinator → CLI
- Real-time stats available via `getFirewallStats()`
- Top violations tracked
- **Location**: `src/cli(V2).ts:258-266`

### 4. **Workflow Context Propagation**
- `getWorkflowStep()` callback pattern
- Workflow state passed through execution chain
- Context available for all firewalls
- **Location**: `src/tools/executor(V2).ts:85`

### 5. **YOLO Mode Emergency Override**
- Controlled bypass with audit trail
- `skipFirewalls` flag at all firewalls
- Bypass logged with reason "YOLO mode enabled"
- **Location**: `src/tools/firewall-mesh(V2).ts:120`

### 6. **Backward Compatibility Layer**
- V1 and V2 files coexist
- Same public API (no breaking changes)
- Migration path: Phase 1 → Phase 2 → Phase 3 → Phase 4
- **Location**: All V2 files

---

## 🔧 Recommended Improvements (Future Work)

### 1. **Workflow Step Context**
**Current**: Returns 'UNKNOWN' (placeholder)
**Need**: Integrate with WorkflowMachine
**Location**: `src/brain/coordinator-base(V2).ts:130`

### 2. **Enhanced Command Validation**
**Current**: Basic dangerous pattern detection
**Need**: Expand Guardian to validate `run_command` operations
**Location**: `src/tools/firewall-mesh(V2).ts:150`

### 3. **Path Traversal Protection**
**Current**: Minimal search parameter checking
**Need**: Add path traversal detection for `search` operations
**Location**: `src/tools/firewall-mesh(V2).ts:180`

### 4. **Unit Test Coverage**
**Current**: Only integration tests
**Need**: Jest unit tests for individual components
**Location**: `testing/unit/` (new directory)

### 5. **Iterative File Versioning Automation**
**Current**: Manual file cloning
**Need**: Build script for automatic file versioning
**Location**: `scripts/version.sh` (new file)

---

## 📊 Key Metrics

### Build Performance:
- TypeScript compilation: <2 seconds
- Integration tests: <1 second
- Total build time: <3 seconds

### Test Coverage:
- Integration tests: 11/11 passing
- Manual tests: 7/9 passed (78% success rate)
- Compilation: 0 errors

### Code Quality:
- Files created: 11 V2 files
- Lines added: ~3,000
- Comments added: Comprehensive headers
- Breaking changes: 0 (100% backward compatible)

---

## 🚀 Next Steps

### Immediate (Before Deployment):
1. ✅ Run integration tests
2. ✅ Verify TypeScript compiles
3. ⚠️ Manual testing with real API keys (blocked by Gemma/DeepSeek issues)
4. ✅ Fix CLI --firewall-stats placeholder bug
5. ✅ Update all GLM 4.5 references to 4.7

### Short Term (Next Sprint):
1. Create Jest unit tests
2. Integrate WorkflowMachine for workflow step context
3. Expand command validation for `run_command`
4. Add path traversal protection for `search`
5. Create automated file versioning script

### Long Term (Future Releases):
1. Machine learning firewalls
2. Custom firewall plugins
3. Real-time dashboard
4. Distributed audit log aggregation
5. Performance optimization

---

## 📝 File Organization Best Practices

### V2 Files Structure:
```
src/
├── tools/
│   ├── executor/
│   │   ├── executor(V1).ts
│   │   └── executor(V2).ts
│   ├── firewall-mesh/
│   │   ├── firewall-mesh(V1).ts
│   │   └── firewall-mesh(V2).ts
│   └── audit/
│       ├── audit(V1).ts
│       └── audit(V2).ts
```

### Documentation Updates:
- Build reports: `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/BUILD_REPORTS/`
- Architecture docs: `PROJECT_ARCHITECTURE.md`
- Continuity rules: `CONTINUITY_RULES.md`
- This file: `Notes.md`

### Testing Strategy:
- Integration tests: `testing/integration-test(V2).ts`
- Manual tests: `testing/stage1-docker/` and `testing/stage2-local/`
- Build reports: `testing/reports/`

---

**Last Updated**: March 28, 2026
**Build Agent**: Claude (Anthropic AI)
**Session Duration**: ~45 minutes
