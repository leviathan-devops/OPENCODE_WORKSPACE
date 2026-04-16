# 🦈 SHARK-ENHANCED OPENCODE: ARCHITECTURE ANALYSIS & IMPLEMENTATION BLUEPRINT

**Date**: March 30, 2026  
**Status**: Current Analysis → Option C Implementation Plan  
**Target**: Transform OpenCode into "Shark Agent" with mechanical enforcement while preserving UI/UX

---

## 🎯 EXECUTIVE SUMMARY

**Current State**: Shark Frankenstein exists as two disconnected systems:
1. **Shark Launcher** (`shark`) - Simple OpenCode wrapper with fragments (NO enforcement)
2. **Shark CLI** (`shark-cli`) - Standalone TypeScript CLI with full mechanical enforcement (NOT integrated)

**Desired State**: **Option C** - Shark-enhanced OpenCode where:
- OpenCode UI/UX remains intact
- Engine is significantly enhanced with Shark/Kraken OS architecture
- Mechanical enforcement is baked into OpenCode core
- Initial launch rebranded to "Shark Agent" with mode wizard
- Still feels like OpenCode but with intelligent system design behind the scenes

---

## 🔍 CURRENT ARCHITECTURE FLAWS (DETAILED)

### 1. **Dual System Architecture Failure**
```
┌─────────────────┐    ┌─────────────────┐
│   Shark Launcher │    │    Shark CLI     │
│   (bash wrapper) │    │  (TypeScript)    │
├─────────────────┤    ├─────────────────┤
│ • Creates        │    │ • Guardian       │
│   fragments      │    │ • FirewallMesh   │
│ • Launches       │    │ • WorkflowBlocker│
│   OpenCode       │    │ • DualBrain      │
│ • NO enforcement │    │ • Full           │
└─────────────────┘    │   enforcement    │
        │              └─────────────────┘
        ▼                      │
┌─────────────────┐            │
│    OpenCode     │            │
│   (vanilla)     │            │
│ • No Shark      │◄───────────┘
│   integration   │
│ • Bypasses all  │
│   firewalls     │
└─────────────────┘
```

**Impact**: Users get Shark branding without Shark protection.

### 2. **Mechanical Enforcement - Exists But Not Connected**
**✅ Systems Built**:
- **Guardian**: Filesystem protection (blocks `/etc/passwd`, audit logs)
- **FirewallMesh**: 4 parallel firewalls (<50ms overhead)
- **WorkflowBlocker**: PLAN→BUILD→TEST→VERIFY→SHIP brick wall
- **StagnationDetector**: Loop prevention (3 identical failures → escalation)
- **ToolExecutor**: Constitutional anchor (all actions flow through)

**❌ Integration Gap**: None of these connect to OpenCode tool execution.

### 3. **Test Suite Failures**
1. **Gemma API**: "Your API key was reported as leaked" - test key compromised
2. **DeepSeek API**: `response.substring is not a function` - assumes string response
3. **GLM**: Works but slow (4910ms response)

### 4. **Placeholder Code & Duplication**
- **12 TODO/FIXME comments** in source (excluding pattern detection)
- **V1/V2 file duplication**: `executor.ts` vs `executor_v2.ts`, inconsistent imports
- **Minimal logging**: `.shark/logs/` has only 8 audit entries

---

## 🎯 OPTION C: SHARK-ENHANCED OPENCODE ARCHITECTURE

### **Core Philosophy**: "OpenCode Shell, Shark Engine"
```
┌─────────────────────────────────────────────────────────┐
│                 USER EXPERIENCE LAYER                    │
├─────────────────────────────────────────────────────────┤
│  Initial Launch: "Shark Agent" wizard                    │
│  • Choose mode: Shark (auto) / Plan / Build              │
│  • Model selection visible next to agent mode            │
│  • UI remains OpenCode but with Shark enhancements       │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│               MECHANICAL ENFORCEMENT LAYER               │
├─────────────────────────────────────────────────────────┤
│  OpenCode Core + Shark Integration Hooks                 │
│  • All tool execution flows through Shark ToolExecutor   │
│  • Guardian protects filesystem in real-time             │
│  • WorkflowBlocker enforces 5-step sequence              │
│  • DualBrain coordinator auto-routes tasks               │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                 INTELLIGENT SYSTEM LAYER                 │
├─────────────────────────────────────────────────────────┤
│  Shark/Kraken OS Architecture                            │
│  • Micro Engineer: DeepSeek thinks → vLLM Qwen executes  │
│  • Macro Engineer: GLM 5 primary + DeepSeek advisory     │
│  • Kraken Brain: Multi-agent orchestration               │
│  • AutoDebug: Pattern-based error fixing                 │
└─────────────────────────────────────────────────────────┘
```

### **Key Integration Points**

#### 1. **Initial Launch & Branding**
```typescript
// Current: opencode (command) → OpenCode TUI
// Target: opencode (command) → Shark Agent wizard → Enhanced OpenCode TUI

// Enhancement: Wrap OpenCode entry point
function main() {
  if (firstLaunch || noSession) {
    showSharkWizard();  // Mode selection: Shark/Plan/Build
    applySharkEnhancements();
  }
  launchEnhancedOpenCode();
}
```

#### 2. **Tool Execution Pipeline**
```typescript
// Current: OpenCode tool registry → direct execution
// Target: OpenCode tool registry → Shark ToolExecutor → execution

// Integration hook:
class EnhancedToolRegistry extends OpenCodeToolRegistry {
  async executeTool(toolCall) {
    // 1. FirewallMesh check (parallel)
    const meshResult = await sharkFirewallMesh.check(toolCall);
    if (!meshResult.allowed) return blockedResult;
    
    // 2. Guardian permission check
    const guardianDecision = sharkGuardian.checkPermission(toolCall);
    if (guardianDecision.denied) return blockedResult;
    
    // 3. Workflow step validation
    const workflowAllowed = sharkWorkflowBlocker.checkOperation(toolCall);
    if (!workflowAllowed) return blockedResult;
    
    // 4. Execute with original OpenCode logic
    return super.executeTool(toolCall);
  }
}
```

#### 3. **Dual-Brain Integration**
```typescript
// Current: OpenCode uses single model per agent
// Target: OpenCode agents enhanced with dual-brain coordination

class SharkEnhancedAgent extends OpenCodeAgent {
  async processTask(task) {
    if (this.mode === 'shark') {
      // Auto-route: Micro vs Macro based on complexity
      const engineerType = sharkCoordinator.analyzeTask(task);
      
      if (engineerType === 'micro') {
        // DeepSeek plans → vLLM Qwen executes
        const plan = await deepSeekClient.plan(task);
        return await qwenExecutor.execute(plan);
      } else {
        // GLM 5 primary + DeepSeek advisory
        return await glmMacroEngineer.execute(task);
      }
    } else {
      // Fallback to original OpenCode behavior
      return super.processTask(task);
    }
  }
}
```

#### 4. **UI Enhancements**
```markdown
## Visual Changes (Subtle but meaningful)

[Shark Agent v2.0]───────────────────────────────────────
│ Mode: 🦈 Shark (auto)      Model: GLM-5 (128K)         │
│                                                       │
│ > fix the bug in main.py                             │
│                                                       │
│ [Guardian: Active] [Workflow: BUILD] [Firewalls: 4/4]│
└───────────────────────────────────────────────────────┘

New UI elements:
• Mode indicator: 🦈 Shark / 📝 Plan / 🔨 Build
• Guardian status: Active/Blocked/Bypassed
• Workflow step: PLAN→BUILD→TEST→VERIFY→SHIP
• Firewall status: 4 parallel firewalls
```

---

## 🛠️ IMPLEMENTATION ROADMAP

### **PHASE 1: Foundation (Week 1)**
1. **Fork & Analyze OpenCode**
   - Clone OpenCode repository
   - Map critical integration points
   - Identify hook locations for Shark systems

2. **Create Shark Integration Plugin**
   - Basic plugin structure
   - Tool execution wrapper
   - Configuration system

3. **Fix Test Suite**
   - Update Gemma API key
   - Fix DeepSeek response parsing
   - Add integration tests

### **PHASE 2: Core Integration (Week 2)**
1. **Mechanical Enforcement Hooks**
   - Integrate Guardian into file operations
   - Add FirewallMesh to tool execution
   - Connect WorkflowBlocker to session management

2. **Dual-Brain Coordination**
   - Integrate Shark coordinator
   - Add Micro/Macro routing logic
   - Model switching preservation

3. **UI Enhancements**
   - Initial wizard ("Shark Agent")
   - Status indicators
   - Mode selection integration

### **PHASE 3: Advanced Features (Week 3)**
1. **Kraken Brain Integration**
   - Multi-agent orchestration
   - Parallel execution coordination
   - Context management

2. **AutoDebug System**
   - Pattern-based error fixing
   - Integration with OpenCode error handling
   - Mechanical fix suggestions

3. **Comprehensive Logging**
   - Model-async data storage
   - Performance metrics
   - Audit trail integration

### **PHASE 4: Polish & Release (Week 4)**
1. **User Experience**
   - Documentation updates
   - Migration guide (vanilla → Shark-enhanced)
   - Troubleshooting guide

2. **Testing & Validation**
   - End-to-end testing
   - Security validation
   - Performance benchmarking

3. **Release Strategy**
   - Versioning: `opencode-shark-enhanced`
   - Distribution: npm package
   - Update path for existing users

---

## 🔧 CRITICAL INTEGRATION POINTS (OpenCode Codebase)

### **1. Tool Execution Pipeline**
**Location**: `packages/opencode/src/tool/`
- `registry.ts` - Tool registration/execution
- `batch.ts` - Tool execution wrapper
- `tool.ts` - Tool interface definition

**Hook Strategy**: Wrap `executeTool` method in registry

### **2. Session Management**
**Location**: `packages/opencode/src/session/`
- `processor.ts` - Session processing logic
- `manager.ts` - Session lifecycle

**Hook Strategy**: Inject workflow validation at session transitions

### **3. Agent System**
**Location**: `packages/opencode/src/agent/`
- `agent.ts` - Base agent definition
- `factory.ts` - Agent creation

**Hook Strategy**: Extend base agent class with Shark enhancements

### **4. Configuration System**
**Location**: `packages/opencode/src/config/`
- `config.ts` - Configuration management

**Hook Strategy**: Add Shark-specific configuration options

### **5. UI Components**
**Location**: `packages/ui/src/`
- TUI components
- Status displays
- Mode indicators

**Hook Strategy**: Add Shark status components to existing UI

---

## 🚨 RISK MITIGATION

### **Technical Risks**
1. **OpenCode API Changes**
   - **Mitigation**: Abstract integration layer, follow semantic versioning
   - **Fallback**: Plugin system with graceful degradation

2. **Performance Overhead**
   - **Mitigation**: FirewallMesh parallel execution (<50ms overhead)
   - **Optimization**: Lazy loading of Shark systems

3. **User Confusion**
   - **Mitigation**: Clear documentation, gradual rollout
   - **Education**: "Shark-enhanced" branding, not "replacement"

### **Architectural Risks**
1. **Tight Coupling**
   - **Mitigation**: Plugin architecture, dependency injection
   - **Design**: Shark systems as optional enhancements

2. **Maintenance Burden**
   - **Mitigation**: Automated testing, CI/CD pipeline
   - **Strategy**: Contribute back to OpenCode where possible

---

## 📊 SUCCESS METRICS

### **Quantitative**
1. **Mechanical Enforcement Coverage**: 100% of tool executions protected
2. **Performance Impact**: <100ms overhead for Shark systems
3. **Error Reduction**: 60% auto-fix rate (AutoDebug target)
4. **User Adoption**: Seamless transition from vanilla OpenCode

### **Qualitative**
1. **User Experience**: "Feels like OpenCode but smarter"
2. **Security Confidence**: "Knows my system is protected"
3. **Productivity**: "Gets more done with less manual intervention"
4. **Reliability**: "Fewer hallucinations, more mechanical validation"

---

## 🎯 IMMEDIATE NEXT STEPS

### **Today/Tomorrow**:
1. **Fork OpenCode Repository**
   ```bash
   git clone https://github.com/anomalyco/opencode.git opencode-shark
   cd opencode-shark
   ```

2. **Create Integration Proof-of-Concept**
   - Simple plugin that logs tool executions
   - Basic Guardian integration test
   - Verify hook locations work

3. **Fix Current Test Suite**
   - Update API keys
   - Fix response parsing
   - Ensure Shark CLI tests pass

### **This Week**:
1. **Design Detailed Integration Spec**
   - Exact hook points with code examples
   - Configuration schema
   - Migration path

2. **Build Core Integration**
   - Tool execution wrapper
   - Guardian filesystem protection
   - Basic UI enhancements

3. **Test End-to-End**
   - Verify mechanical enforcement works
   - Test performance impact
   - Validate user experience

---

## 📝 CONCLUSION

**Option C (Shark-enhanced OpenCode)** is the optimal path because:

1. **Preserves Investment**: Leverages existing OpenCode UI/UX
2. **Adds Real Value**: Mechanical enforcement where it matters (execution)
3. **User-Centric**: Still feels like OpenCode, just enhanced
4. **Sustainable**: Plugin architecture allows gradual enhancement
5. **Ambitious but Achievable**: Builds on existing Shark systems

**The vision**: OpenCode that doesn't just assist but **protects** and **enforces** good engineering practices through mechanical systems that cannot be bypassed through persuasion.

**Final deliverable**: `opencode-shark-enhanced` - OpenCode distribution with Shark intelligence baked in, available as drop-in replacement for power users who want mechanical enforcement without losing the OpenCode experience.

---

*Document prepared for Shark Frankenstein team - March 30, 2026*  
*Next review: Implementation planning session*