# Shark Agent Plugin - Project Overview

## 🎯 Mission
Create a **100% standalone Opencode plugin** that integrates Shark Frankenstein's dual-brain architecture with mechanical safety enforcement, featuring autonomous brain switching visible in the Opencode chat UI.

## 🚨 Critical Constraints

### 🔴 **ZERO DEPENDENCIES ON OTHER PLUGINS**
- **MUST** work with **vanilla OpenCode 1.2.0+**
- **MUST NOT** depend on `opencode-ultra` or any other plugins
- **MUST** use only `@opencode-ai/plugin` and `@opencode-ai/sdk` as dependencies

### 🦈 **Shark Frankenstein V2 Architecture Focus**
- Extract and adapt **V2 components only** (`*_v2.ts` files)
- **Critical integration**: Connect `WorkflowBlocker` to `ToolExecutor` (currently disconnected)
- **File renaming**: Fix shell-incompatible filenames (`integration-test(V2).ts` → `integration-test_v2.ts`)

### 💰 **Dual-Brain Economics**
- **Micro Engineer (FREE)**: DeepSeek Chat thinks + local vLLM Qwen 2.5 Coder executes
- **Macro Engineer (PAID)**: GLM 5 primary + DeepSeek R1 advisory (~$0.02-0.08/task)

## 🎭 User Experience Goals

### 🧙 **Mode Selector Wizard**
- Launches automatically on new sessions
- Uses OpenCode's built-in `Question.ask()` tool (identical UX to plan mode)
- Clear Micro vs Macro Engineer choice with cost transparency
- Configuration collection for required API keys

### 🔄 **Visible Brain Switching**
- Model indicators in Opencode chat UI when coordinator switches brains
- Planning brain (e.g., DeepSeek) → Execution brain (e.g., Qwen/GLM) transitions visible
- "Shark Mode" toggle in agent harness UI

### 🛡️ **Mechanical Safety Enforcement**
- 4-layer safety stack integrated via OpenCode hooks:
  1. **Guardian** (filesystem protection) → `tool.execute.before` hook
  2. **FirewallMesh** (4 parallel screens) → <50ms overhead target
  3. **StagnationDetector** (3 failures → escalation)
  4. **Workflow Enforcement** (PLAN→BUILD→TEST→VERIFY→SHIP brick wall)

## 🏗️ Architecture Principles

### **Earth Density Philosophy**
- AI autonomy (water) + mechanical enforcement (earth density riverbanks) = purposeful flow
- **Anti-Slop Focus**: Warn on theatrical code but don't block flow
- **Only block `rm -rf /` exact**: Legitimate commands like `rm -rf node_modules` MUST work

### **ToolExecutor Constitutional Anchor**
- Single chokepoint where ALL agent actions flow through for enforcement
- All safety checks converge at the `ToolExecutor` before execution

### **Connect, Don't Create**
- Leverage existing OpenCode systems rather than rebuilding
- Use OpenCode hooks, Question tool, and UI integration points

## 📊 Current Status (March 30, 2025)

### ✅ **Completed Analysis**
1. **Shark Frankenstein codebase** fully analyzed
2. **OpenCode plugin SDK** studied (`@opencode-ai/plugin`, `@opencode-ai/sdk`)
3. **Architecture documentation** created (corrected for vanilla OpenCode)

### ⚠️ **Shark Frankenstein Blockers**
1. **Critical Integration Missing**: V2 `WorkflowBlocker` not connected to V2 `ToolExecutor`
2. **File Naming Issues**: Parentheses in filenames (`integration-test(V2).ts`) break shell compatibility
3. **Stage 2 Test Failures**: 2/3 tests failing (need API keys: `GLM_API_KEY`, `DEEPSEEK_API_KEY`, `GOOGLE_API_KEY`)

### 🟡 **Ready for Implementation**
- **Plugin project structure** defined
- **Hook mapping strategy** designed
- **Component extraction plan** created
- **7-week implementation roadmap** documented

## 🎯 Success Metrics

### **Technical Success**
- [ ] Plugin loads without errors in **vanilla OpenCode 1.2.0+**
- [ ] Wizard launches on new sessions using `Question.ask()`
- [ ] Brain switching works with UI indicators
- [ ] Safety stack prevents dangerous operations
- [ ] Performance overhead <100ms per tool call

### **User Experience Success**
- [ ] Wizard completes in <30 seconds
- [ ] Mode selection is clear and intuitive
- [ ] Brain switches are visible in UI
- [ ] Toggle interface works seamlessly

### **Quality Success**
- [ ] 90%+ test coverage
- [ ] All TypeScript errors resolved
- [ ] Documentation complete
- [ ] Performance benchmarks met

## 📁 File Structure

```
shark-agent-plugin/
├── src/
│   ├── index.ts              # Main plugin entry (vanilla OpenCode hooks)
│   ├── wizard/               # Mode selector (uses Question.ask())
│   ├── coordinator/          # Dual-brain coordination (V2 components)
│   ├── safety/              # Safety stack integration
│   ├── hooks/               # OpenCode hook implementations
│   └── utils/               # Utilities and adapters
├── package.json             # Dependencies: @opencode-ai/plugin, @opencode-ai/sdk, zod
├── tsconfig.json
└── README.md
```

## 🔗 Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and design
- **[CURRENT_STATE.md](CURRENT_STATE.md)** - Current status and blockers  
- **[ROADMAP.md](ROADMAP.md)** - Implementation roadmap
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Immediate next steps for build team

## 🚀 Next Steps

1. **Create clean plugin project** with zero opencode-ultra dependencies
2. **Extract Shark Frankenstein V2 components** (coordinator, safety stack)
3. **Implement core OpenCode hooks** (wizard, safety, model switching)
4. **Fix Shark Frankenstein blockers** (WorkflowBlocker integration, file renaming)
5. **Test with vanilla OpenCode** to verify standalone compatibility

---
**Last Updated**: March 30, 2025  
**Status**: Ready for Implementation  
**Priority**: High - Critical integration work needed in Shark Frankenstein base