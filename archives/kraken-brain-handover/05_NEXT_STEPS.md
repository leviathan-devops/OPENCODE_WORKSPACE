# 🦈 SHARK CLI - Next Steps

**Project**: Shark Frankenstein (Dual-Brain AI Coding Assistant)  
**Current State**: V2 Integration Complete, GLM 5 Upgraded  
**Last Updated**: 2026-03-28

---

## Immediate Next Steps (Priority Order)

### 1. Run Stage 2 Local Tests 🔴 HIGH PRIORITY

**Status**: PENDING  
**Requirement**: API keys must be set in environment

**Commands**:
```bash
# Set API keys
export GOOGLE_API_KEY="your-key"
export GLM_API_KEY="your-key"
export DEEPSEEK_API_KEY="your-key"

# Run Stage 2 tests
cd /home/leviathan/shark-frankenstein
bash testing/run-stage2.sh --api-test

# Or quick test without API calls
bash testing/run-stage2.sh --quick

# Or sandbox mode for safety
bash testing/run-stage2.sh --sandbox
```

**Expected Results**:
- Interactive wizard tests
- TTY feature tests
- Real API call tests
- Performance tests

**Success Criteria**: All tests pass with real API keys

---

### 2. Audit Placeholder Code 🟡 MEDIUM PRIORITY

**Status**: NOT STARTED  
**Goal**: Find and document all TODOs and placeholders

**Approach**:
```bash
# Search for TODOs
grep -r "TODO" --include="*.ts" /home/leviathan/shark-frankenstein/src/

# Search for FIXMEs
grep -r "FIXME" --include="*.ts" /home/leviathan/shark-frankenstein/src/

# Search for placeholder patterns
grep -rE "placeholder|stub|mock|hardcoded" --include="*.ts" /home/leviathan/shark-frankenstein/src/

# Search for empty implementations
grep -rE "// \.\.\.|\{\s*\}" --include="*.ts" /home/leviathan/shark-frankenstein/src/
```

**Deliverable**: Create `PLACEHOLDERS.md` with findings

---

### 3. Create Model-Async Data Storage 🟢 LOW PRIORITY

**Status**: NOT STARTED  
**Goal**: Dedicated folder for model response logging

**Location**: `/home/leviathan/shark-data/`

**Structure**:
```
/home/leviathan/shark-data/
├── model-logs/
│   ├── glm/
│   ├── gemma/
│   ├── deepseek/
│   └── vllm/
├── audit-trails/
├── stagnation-events/
└── config.json
```

**Implementation**:
1. Create directory structure
2. Update BaseCoordinator to log model responses
3. Add configuration for retention policy
4. Create analysis tools

---

### 4. Clean Up V2 File Naming 🟢 LOW PRIORITY

**Status**: NOT STARTED  
**Goal**: Rename (V2) files to avoid parentheses issues

**Current Files**:
```
cli(V2).ts
coordinator(V2).ts
coordinator-base(V2).ts
coordinator-micro(V2).ts
coordinator-macro(V2).ts
executor(V2).ts
firewall-mesh(V2).ts
audit(V2).ts
stagnation-detector(V2).ts
state-integrity(V2).ts
```

**Proposed Renaming**:
```
cli.v2.ts
coordinator.v2.ts
coordinator-base.v2.ts
...
```

**Process**:
1. Rename all V2 files
2. Update all imports
3. Update tests
4. Rebuild and verify

---

## Medium-Term Goals

### 5. Merge V2 into Main Codebase

**Goal**: Make V2 the default, archive V1

**Steps**:
1. Verify all V2 tests pass
2. Stage 2 tests with real API keys
3. Backup V1 files to `archive/` folder
4. Rename V2 files to standard names
5. Update documentation
6. Tag release

---

### 6. Add Kraken Ultra Integration

**Goal**: Connect Shark CLI with Kraken Ultra debug agents

**Current State**:
- Kraken Ultra debug agents exist in `/home/leviathan/Kraken Brain/Kraken Ultra/`
- Not yet integrated with Shark CLI

**Integration Points**:
```typescript
// In stagnation-detector(V2).ts
if (stagnationDetected) {
  // Spawn Kraken Ultra debug agent
  const agent = ultraConnector.spawnDebugAgent({
    agentType: 'hephaestus',
    model: 'glm-5',
    task: debugPrompt
  })
}
```

**Steps**:
1. Import UltraConnector
2. Add stagnation escalation to debug agent
3. Handle debug agent results
4. Test integration

---

### 7. Implement Verification Gates

**Goal**: Full verification gate implementation

**Current State**:
- Verification gates defined in types
- `/verify` command exists in CLI
- Not fully implemented

**Gates to Implement**:
- `FUNCTIONAL`: Does the code work?
- `INTENT`: Does it match the original request?
- `SECURITY`: Is it safe?

**Implementation**:
```typescript
async runVerificationGate(gate: VerificationGate): Promise<GateResult> {
  switch (gate) {
    case VerificationGate.FUNCTIONAL:
      // Run tests, check for errors
      return await this.verifyFunctional()
    case VerificationGate.INTENT:
      // Compare output to original prompt
      return await this.verifyIntent()
    case VerificationGate.SECURITY:
      // Run security checks
      return await this.verifySecurity()
  }
}
```

---

### 8. Add Configuration File Support

**Goal**: Support `shark.config.json` for persistent settings

**Current State**: Only environment variables

**Proposed Config**:
```json
{
  "defaultMode": "micro",
  "maxIterations": 15,
  "gemmaRegion": "sea",
  "guardianLevel": "balanced",
  "workflowEnforcement": true,
  "autoDebug": true,
  "logging": {
    "level": "info",
    "file": "~/.shark/logs/shark.log"
  }
}
```

**Steps**:
1. Define config schema
2. Create config loader
3. Add config validation
4. Update components to use config
5. Add `shark config` command

---

## Long-Term Goals

### 9. Add Plugin System

**Goal**: Extensible plugin architecture

**Use Cases**:
- Custom firewalls
- Custom brain clients
- Custom tools
- Custom verification gates

**Design**:
```typescript
interface SharkPlugin {
  name: string
  version: string
  register(context: PluginContext): void
}

// Example plugin
class CustomFirewallPlugin implements SharkPlugin {
  register(context: PluginContext) {
    context.addFirewall(new MyCustomFirewall())
  }
}
```

---

### 10. Add Web UI

**Goal**: Browser-based interface for Shark CLI

**Features**:
- Task input form
- Mode selection
- Real-time output display
- Guardian status dashboard
- Workflow visualization
- Firewall statistics charts

**Tech Stack**:
- Frontend: React/Vue
- Backend: Express/Fastify
- Real-time: WebSockets
- CLI Integration: Child process spawn

---

### 11. Add Multi-Project Support

**Goal**: Manage multiple projects from single Shark instance

**Features**:
- Project switcher
- Per-project configuration
- Project-specific Guardian rules
- Cross-project search

---

### 12. Add Team Collaboration

**Goal**: Share Shark sessions across team

**Features**:
- Session sharing
- Collaborative editing
- Review workflows
- Permission management

---

## Technical Debt

### 13. Add Comprehensive Unit Tests

**Current State**: Mostly integration tests

**Needed**:
- Unit tests for each brain client
- Unit tests for each firewall
- Unit tests for Guardian
- Unit tests for Workflow

**Goal**: 80%+ code coverage

---

### 14. Add Error Handling Tests

**Current State**: Basic error handling

**Needed**:
- API timeout handling
- Rate limit handling
- Network error handling
- Invalid response handling
- Malformed tool call handling

---

### 15. Add Performance Benchmarks

**Current State**: No benchmarks

**Needed**:
- Tool execution latency
- Firewall overhead
- Brain response time
- Memory usage
- CPU usage

**Tool**: Use Node.js `perf_hooks` or benchmark.js

---

## Documentation Tasks

### 16. Write User Guide

**Goal**: Complete user documentation

**Sections**:
- Getting Started
- Mode Selection
- Commands Reference
- Configuration
- Troubleshooting
- FAQ

---

### 17. Write Developer Guide

**Goal**: Documentation for contributors

**Sections**:
- Architecture Overview
- Adding New Brains
- Adding New Tools
- Adding New Firewalls
- Testing Guide
- Debugging Guide

---

### 18. Create API Reference

**Goal**: Auto-generated API docs

**Tool**: TypeDoc or similar

**Command**:
```bash
npx typedoc --out docs/api src/
```

---

## Deployment Tasks

### 19. Create Docker Production Image

**Goal**: Optimized Docker image for deployment

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
CMD ["node", "dist/cli.js"]
```

---

### 20. Set Up CI/CD Pipeline

**Goal**: Automated testing and deployment

**Pipeline**:
1. On PR: Run lint, typecheck, tests
2. On merge to main: Build, test, deploy
3. On tag: Publish to npm

**Tools**:
- GitHub Actions
- npm publish
- Docker Hub

---

## Quick Start Commands

### For New Session

```bash
# 1. Read this handover
cat "/home/leviathan/OPENCODE WORKSPACE/Kraken Brain Handover 6/05_NEXT_STEPS.md"

# 2. Read build reports
cat "/home/leviathan/OPENCODE WORKSPACE/Kraken Brain Handover 6/01_BUILD_REPORTS.md"

# 3. Check current state
cd /home/leviathan/shark-frankenstein
git status
bun run build
bun run "testing/integration-test(V2).ts"

# 4. Run Stage 2 tests (with API keys)
bash testing/run-stage2.sh --api-test

# 5. Continue with next steps above
```

---

## Key Files to Read

| File | Purpose |
|------|---------|
| `SHIP_REPORT.md` | Current build status |
| `testing/integration-test(V2).ts` | V2 integration tests |
| `src/cli(V2).ts` | Main CLI entry point |
| `src/brain/coordinator-base(V2).ts` | Base coordinator with FirewallMesh |
| `src/tools/executor(V2).ts` | Tool executor with FirewallMesh |
| `src/tools/firewall-mesh(V2).ts` | Parallel firewall execution |

---

## Contact Points

If stuck, check:
1. This handover package
2. `SHIP_REPORT.md` for current state
3. `testing/TESTING_PROTOCOL.md` for test instructions
4. Source code comments (well-documented)

---

*Next Steps Document generated: 2026-03-28*
