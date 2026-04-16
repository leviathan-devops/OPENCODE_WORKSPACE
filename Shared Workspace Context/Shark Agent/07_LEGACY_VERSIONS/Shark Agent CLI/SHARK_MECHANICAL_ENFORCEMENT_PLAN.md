# 🦈 SHARK MECHANICAL ENFORCEMENT IMPLEMENTATION PLAN

## 📋 EXECUTIVE SUMMARY

**Objective**: Transform the Shark Agent Plugin into a **mechanically enforced** Shark architecture within vanilla OpenCode, achieving **100% firewall compliance** with zero opencode-ultra dependencies.

**Current Status**: Plugin built and tested (19/19 tests passing), GLM API fixed, ready for mechanical enforcement integration.

**Critical Gap**: Plugin has basic safety checks but lacks comprehensive mechanical enforcement of all 9 firewalls.

---

## 🎯 SUCCESS CRITERIA

### **Technical Requirements**
- [ ] Guardian blocks ALL PERSONAL/SYSTEM paths (100% blocking rate)
- [ ] 5-step workflow enforced with "Brick Wall" blocking
- [ ] Mock mode detection blocks "I would run..." language
- [ ] Theatrical code detection via AST analysis
- [ ] Single-word naming style enforcement
- [ ] Repo root test prevention
- [ ] 3-verification gate system (functional, intent, security)
- [ ] Theatrical documentation validation
- [ ] All 9 firewalls pass crash test

### **User Experience Requirements**
- [ ] CLI shows "🦈 Shark Agent" branding (not "opencode")
- [ ] Mode wizard shows context BEFORE selection
- [ ] Enforcement errors are clear and actionable
- [ ] Performance impact < 10% overhead
- [ ] Session state persists correctly

### **Integration Requirements**
- [ ] All OpenCode tools work with enforcement
- [ ] No conflicts with other plugins
- [ ] Backward compatible with existing workflows
- [ ] Zero opencode-ultra dependencies maintained

---

## 🔍 CURRENT ARCHITECTURE ANALYSIS

### **Existing Plugin Structure**
```
shark-agent-plugin/
├── src/
│   ├── index.ts              # Main plugin entry (hooks)
│   ├── wizard/index.ts       # Session-only wizard
│   ├── safety/safety-stack.ts # Safety adapter
│   ├── coordinator/coordinator-manager.ts
│   ├── shark-core/          # V2 components from Shark Frankenstein
│   └── types/               # Type definitions
├── dist/index.js            # Built plugin (470KB)
└── test/                    # 19 passing tests
```

### **Current Hook Implementation**
```typescript
// In src/index.ts
export default async function sharkPlugin(input: PluginInput): Promise<Hooks> {
  return {
    async 'chat.message'(eventInput, eventOutput): Promise<void> {
      // Wizard launch logic
    },
    async 'tool.execute.before'(input, output): Promise<void> {
      // Basic safety check via safety.checkTool()
    },
    async 'chat.params'(input, output): Promise<any> {
      // Model parameter adjustment
    },
    tool: {
      'shark_toggle': { /* Mode toggle tool */ }
    }
  };
}
```

### **Gap Analysis**
1. **`tool.execute.before` hook**: Only basic safety check, not comprehensive enforcement
2. **Workflow enforcement**: `WorkflowBlocker` exists but not integrated with 5-step process
3. **Behavioral validation**: Missing mock mode, theatrical code, style enforcement
4. **Verification system**: No 3-gate verification
5. **Shark branding**: CLI still shows "opencode"

---

## 🔧 CRITICAL EDITS REQUIRED

### **1. ENHANCE `tool.execute.before` HOOK** (Most Critical)
**File**: `src/index.ts`
**Current**: Basic safety check
**Required**: Comprehensive firewall enforcement

```typescript
// ENHANCEMENT NEEDED
async 'tool.execute.before'(input: any, output: any): Promise<void> {
  const enforcement = await enforceSharkArchitecture({
    tool: input.tool,
    args: output.args,
    sessionID: input.sessionID,
    workflowStep: getCurrentWorkflowStep(input.sessionID),
    agent: getCurrentAgent(input.sessionID)
  });
  
  if (!enforcement.allowed) {
    throw new Error(`🦈 SHARK ENFORCEMENT: ${enforcement.reason}`);
  }
}
```

### **2. CREATE `enforceSharkArchitecture()` FUNCTION**
**New File**: `src/enforcement/enforcer.ts`
**Purpose**: Centralized enforcement of ALL 9 firewalls

```typescript
export async function enforceSharkArchitecture(params: EnforcementParams): 
  Promise<{ allowed: boolean; reason?: string }> {
  
  // Firewall 1-2: Guardian Protection
  const guardianCheck = await checkGuardianProtection(params.tool, params.args);
  if (!guardianCheck.allowed) return guardianCheck;
  
  // Firewall 3: 5-Step Workflow
  const workflowCheck = await checkWorkflowEnforcement(params);
  if (!workflowCheck.allowed) return workflowCheck;
  
  // Firewall 4: Mock Mode Prevention
  const mockCheck = await detectMockMode(params.args);
  if (!mockCheck.allowed) return mockCheck;
  
  // Firewall 5: Theatrical Code Prevention
  const theatricalCheck = await detectTheatricalCode(params);
  if (!theatricalCheck.allowed) return theatricalCheck;
  
  // Firewall 6: Single-Word Naming
  const styleCheck = await enforceStyleGuide(params);
  if (!styleCheck.allowed) return styleCheck;
  
  // Firewall 7: Repo Root Test Prevention
  const testCheck = await preventRepoRootTests(params);
  if (!testCheck.allowed) return testCheck;
  
  // Firewall 8: 3-Verification Gates
  const gateCheck = await enforceVerificationGates(params);
  if (!gateCheck.allowed) return gateCheck;
  
  // Firewall 9: Theatrical Documentation
  const docCheck = await validateDocumentation(params);
  if (!docCheck.allowed) return docCheck;
  
  return { allowed: true };
}
```

### **3. ENHANCE WORKFLOW ENFORCEMENT**
**New Files Required**:
- `src/workflow/machine.ts` - 5-step state machine (PLAN→BUILD→TEST→VERIFY→SHIP)
- `src/workflow/enforcer.ts` - Tool validation against current step
- `src/workflow/artifacts.ts` - `.shark/` artifact management

**Integration Points**:
- Session context for workflow state persistence
- Tool execution validation against workflow step
- Artifact creation/validation at each step

### **4. ADD BEHAVIORAL VALIDATION**
**New Files Required**:
- `src/validation/mock-detector.ts` - Regex patterns for "I would run..."
- `src/validation/theatrical-detector.ts` - AST analysis for unused code
- `src/validation/style-enforcer.ts` - Single-word naming validation

**Detection Patterns**:
```typescript
// Mock mode patterns
const MOCK_PATTERNS = [
  /I would run/,
  /should work/,
  /in a real environment/,
  /mock mode/,
  /simulating/
];

// Theatrical code detection
// AST analysis for:
// - Unused functions
// - Unreachable code
// - Overly complex abstractions
```

### **5. ENHANCE GUARDIAN PROTECTION**
**Current**: Basic Guardian from Shark Frankenstein
**Enhancements Needed**:
1. **Path blocking**: Ensure ALL PERSONAL/SYSTEM paths blocked
2. **Sandbox redirection**: Redirect unsafe writes to sandbox
3. **Audit logging**: Log ALL enforcement decisions
4. **Real-time validation**: Validate before execution

**Critical Test**: Writing to `~/.ssh` must be **BLOCKED** at CLI level

### **6. CREATE VERIFICATION GATE SYSTEM**
**New Files Required**:
- `src/verification/gates.ts` - Gate definitions and validation
- `src/verification/functional-gate.ts` - Tests actually pass
- `src/verification/intent-gate.ts` - Code matches plan
- `src/verification/security-gate.ts` - Guardian scan passes

**Gate Requirements**:
1. **Functional Gate**: All tests pass, build succeeds
2. **Intent Gate**: Implementation matches original plan
3. **Security Gate**: No Guardian violations, no security issues

### **7. ENHANCE SHARK BRANDING & UX**
**Enhancements**:
1. **CLI Title**: Change "opencode" to "🦈 Shark Agent"
2. **Status Indicators**: Show Guardian/Workflow status in UI
3. **Mode Wizard**: Show descriptions BEFORE selection prompt
4. **Session Context**: Persist Shark mode across session

**Integration Points**:
- Modify OpenCode TUI components
- Add status bar indicators
- Enhance wizard UX flow

---

## 🏗️ BUILD WORKFLOW (PHASED APPROACH)

### **PHASE 1: CORE ENFORCEMENT** (4-6 hours)
**Goal**: 100% Guardian + Workflow enforcement

| Task | Time | Priority | Dependencies |
|------|------|----------|--------------|
| 1. Enhance `tool.execute.before` hook | 1 hour | CRITICAL | None |
| 2. Create `enforceSharkArchitecture()` | 1 hour | CRITICAL | Task 1 |
| 3. Implement Workflow Machine | 2 hours | CRITICAL | Task 2 |
| 4. Test Guardian blocking | 1 hour | CRITICAL | Task 3 |
| 5. Create test suite | 1 hour | HIGH | Task 4 |

**Deliverables**:
- Enhanced hook with comprehensive enforcement
- Working workflow state machine
- Guardian blocking verified
- Basic test suite

### **PHASE 2: BEHAVIORAL VALIDATION** (3-4 hours)
**Goal**: Mock mode + theatrical code detection

| Task | Time | Priority | Dependencies |
|------|------|----------|--------------|
| 6. Mock mode detection | 1 hour | HIGH | Phase 1 |
| 7. Theatrical code detection | 2 hours | HIGH | Task 6 |
| 8. Style guide enforcement | 1 hour | MEDIUM | Task 7 |

**Deliverables**:
- Mock mode detection working
- AST analysis for theatrical code
- Style guide validation

### **PHASE 3: VERIFICATION SYSTEM** (2-3 hours)
**Goal**: 3-gate verification enforcement

| Task | Time | Priority | Dependencies |
|------|------|----------|--------------|
| 9. Gate definitions | 1 hour | MEDIUM | Phase 2 |
| 10. Gate integration | 1 hour | MEDIUM | Task 9 |
| 11. Documentation validation | 1 hour | LOW | Task 10 |

**Deliverables**:
- 3-gate verification system
- Documentation validation
- Gate integration with workflow

### **PHASE 4: UX & INTEGRATION** (2-3 hours)
**Goal**: Complete Shark identity and user experience

| Task | Time | Priority | Dependencies |
|------|------|----------|--------------|
| 12. Shark branding | 1 hour | MEDIUM | Phase 3 |
| 13. Session management | 1 hour | MEDIUM | Task 12 |
| 14. Final integration | 1 hour | HIGH | Task 13 |

**Deliverables**:
- "🦈 Shark Agent" CLI branding
- Persistent session state
- Fully integrated system

---

## 📊 PRIORITIZED EDIT LIST

### **CRITICAL (Must have for MVP)**
1. **Enhance `tool.execute.before` hook** - Central enforcement point
2. **Create `enforceSharkArchitecture()`** - Unified firewall enforcement  
3. **Implement Workflow Machine** - 5-step enforcement
4. **Test Guardian blocking** - Verify ~/.ssh writes blocked

### **HIGH PRIORITY**
5. **Mock mode detection** - Core Shark principle
6. **Theatrical code detection** - Prevent unused code
7. **Style guide enforcement** - Single-word naming

### **MEDIUM PRIORITY**
8. **Verification gates** - 3-gate system
9. **Shark branding** - CLI identity
10. **Session management** - Mode persistence

### **LOW PRIORITY**
11. **Documentation validation** - Theatrical docs
12. **Performance optimizations** - Speed improvements
13. **Advanced features** - Additional firewalls

---

## 🗂️ FILE STRUCTURE AFTER IMPLEMENTATION

```
shark-agent-plugin/
├── src/
│   ├── index.ts                          # Enhanced main plugin
│   ├── enforcement/
│   │   ├── enforcer.ts                   # Central enforcement function
│   │   ├── guardian-enhancer.ts          # Enhanced Guardian protection
│   │   └── audit-logger.ts               # Enforcement audit logging
│   ├── workflow/
│   │   ├── machine.ts                    # 5-step state machine
│   │   ├── enforcer.ts                   # Step validation
│   │   ├── artifacts.ts                  # .shark/ artifact management
│   │   └── state-manager.ts              # Session state persistence
│   ├── validation/
│   │   ├── mock-detector.ts              # Mock mode detection
│   │   ├── theatrical-detector.ts        # AST analysis
│   │   └── style-enforcer.ts             # Single-word naming
│   ├── verification/
│   │   ├── gates.ts                      # Gate definitions
│   │   ├── functional-gate.ts            # Tests pass validation
│   │   ├── intent-gate.ts                # Code matches plan
│   │   └── security-gate.ts              # Security scan
│   ├── ui/
│   │   ├── branding.ts                   # Shark branding
│   │   ├── status-indicators.ts          # UI status display
│   │   └── wizard-enhancer.ts            # Enhanced wizard
│   ├── safety/safety-stack.ts            # Enhanced with new components
│   ├── coordinator/coordinator-manager.ts
│   ├── shark-core/                       # Existing V2 components
│   └── types/                            # Enhanced type definitions
├── test/
│   ├── enforcement/
│   │   ├── guardian.test.ts              # Guardian blocking tests
│   │   ├── workflow.test.ts              # Workflow enforcement tests
│   │   └── behavioral.test.ts            # Behavioral validation tests
│   ├── verification/
│   │   └── gates.test.ts                 # Gate validation tests
│   └── integration/                      # Existing tests
└── dist/                                 # Built plugin
```

---

## ⚠️ RISKS & MITIGATION

### **High Risk**: Hook doesn't intercept all operations
**Risk**: Bash commands or other tools bypass enforcement
**Mitigation**: 
- Test with ALL OpenCode tools
- Add fallback hooks (`chat.message`, `chat.params`)
- Monitor for bypass patterns

### **Medium Risk**: Performance overhead
**Risk**: Real-time AST analysis slows down OpenCode
**Mitigation**:
- Optimize enforcement algorithms
- Add caching for repeated checks
- Make expensive checks optional/configurable

### **Medium Risk**: Plugin conflicts
**Risk**: Conflicts with other OpenCode plugins
**Mitigation**:
- Use unique hook names and tool names
- Test with common plugins
- Add configuration options for conflict resolution

### **Low Risk**: State persistence issues
**Risk**: Workflow state lost between tool calls
**Mitigation**:
- Multiple persistence strategies (memory, file, session API)
- State recovery mechanisms
- Regular state validation

---

## 🔍 ARCHITECTURAL CONSIDERATIONS

### **1. Hook Coverage Analysis**
**Question**: Does `tool.execute.before` intercept ALL OpenCode tools?
**Investigation Needed**: 
- Test with `bash`, `write`, `edit`, `read`, `glob`, `grep` tools
- Check OpenCode SDK documentation for hook coverage
- Add complementary hooks if needed

### **2. Session Context Strategy**
**Options**:
- **Plugin Memory**: Simplest, but lost on plugin reload
- **Session Storage API**: If OpenCode provides one
- **File-based**: `.shark/session-state.json` in workspace
- **Hybrid**: Memory with file backup

**Recommendation**: Start with plugin memory, add file backup for critical state

### **3. Error Handling Strategy**
**Options**:
- **Block with Error**: Throw error, stop execution (strictest)
- **Warn and Continue**: Log warning, allow execution (lenient)
- **Audit Only**: Log violation, continue (monitoring)

**Recommendation**: Block for security violations (Guardian), warn for style issues

### **4. Performance Optimization**
**Techniques**:
- Lazy loading of expensive validators
- Caching of validation results
- Parallel validation where possible
- Configurable validation depth

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
- Guardian blocking tests (PERSONAL/SYSTEM paths)
- Workflow step validation tests
- Mock mode detection tests
- Style guide enforcement tests

### **Integration Tests**
- Full plugin loading and initialization
- Hook integration with OpenCode
- Tool execution with enforcement
- Session state persistence

### **Firewall Crash Tests**
1. **Guardian Test**: Attempt write to `~/.ssh` → Must be BLOCKED
2. **Workflow Test**: Attempt BUILD without PLAN → Must be BLOCKED
3. **Mock Mode Test**: Use "I would run..." → Must be BLOCKED
4. **Theatrical Code Test**: Create unused function → Must be DETECTED
5. **Style Test**: Use multi-word variable → Must be BLOCKED
6. **Repo Root Test**: Run tests from repo root → Must be BLOCKED
7. **Verification Test**: Attempt SHIP without gates → Must be BLOCKED
8. **Documentation Test**: Create theatrical docs → Must be BLOCKED

### **Performance Tests**
- Tool execution time with/without enforcement
- Memory usage monitoring
- Concurrent session handling

---

## 📈 SUCCESS METRICS

### **Quantitative Metrics**
- **Firewall Compliance**: 100% pass rate on crash tests
- **Performance Impact**: < 10% overhead on tool execution
- **Test Coverage**: > 90% code coverage
- **Error Rate**: < 1% false positives/negatives

### **Qualitative Metrics**
- **User Experience**: Clear error messages, intuitive workflow
- **Integration**: Seamless with existing OpenCode workflows
- **Maintainability**: Clean code, good documentation
- **Reliability**: Consistent enforcement across sessions

---

## 🚀 DEPLOYMENT PLAN

### **Pre-Deployment Checklist**
- [ ] All 9 firewall crash tests pass
- [ ] Performance impact measured and acceptable
- [ ] Integration tests pass with real OpenCode
- [ ] Error handling tested and robust
- [ ] Documentation updated
- [ ] Backup/rollback plan created

### **Deployment Steps**
1. **Phase 1 Deployment**: Core enforcement only
2. **Monitor**: Performance, error rates, user feedback
3. **Phase 2 Deployment**: Behavioral validation
4. **Phase 3 Deployment**: Verification system
5. **Phase 4 Deployment**: UX enhancements
6. **Final Validation**: Full system testing

### **Rollback Plan**
- Keep previous plugin version as backup
- Environment variable to disable enforcement
- Gradual rollout with canary testing

---

## 📞 SUPPORT & MAINTENANCE

### **Monitoring**
- Enforcement decision logging
- Performance metrics collection
- Error rate tracking
- User feedback collection

### **Maintenance Tasks**
- Regular updates for OpenCode compatibility
- Firewall rule updates as needed
- Performance optimization
- Bug fixes and enhancements

### **Documentation**
- User guide for Shark enforcement
- Developer guide for plugin extension
- Troubleshooting guide
- API documentation

---

## 🎯 FINAL DELIVERABLE

A **mechanically enforced Shark Agent Plugin** that:
- **Intercepts ALL OpenCode tool execution** via enhanced hooks
- **Enforces 100% of 9 firewalls** with no bypasses
- **Maintains zero opencode-ultra dependencies**
- **Provides clear Shark branding and UX**
- **Performs with < 10% overhead**
- **Passes all crash tests with 100% compliance**

**Success Verification**: Space Invaders game **CANNOT** be built violating any firewall when plugin is active.

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-30  
**Status**: READY FOR IMPLEMENTATION  
**Estimated Completion Time**: 11-16 hours  
**Priority Order**: Phase 1 → Phase 2 → Phase 3 → Phase 4