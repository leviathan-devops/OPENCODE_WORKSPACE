# 🦈 SHARK-ENHANCED OPENCODE: IMPLEMENTATION PLAN

**Date**: March 30, 2026  
**Phase**: Detailed Technical Implementation  
**Target**: Week 1 - Foundation & Proof of Concept

---

## 🎯 WEEK 1: FOUNDATION & PROOF OF CONCEPT

### **DAY 1: Repository Setup & Analysis**

#### 1.1 Fork OpenCode Repository
```bash
# Clone OpenCode
cd /home/leviathan/OPENCODE_WORKSPACE/projects/
git clone https://github.com/anomalyco/opencode.git opencode-shark-enhanced
cd opencode-shark-enhanced

# Create shark-enhanced branch
git checkout -b shark-enhanced-v1

# Initial commit with analysis
echo "# Shark Enhanced OpenCode - Mechanical Enforcement Integration" > README-SHARK.md
git add README-SHARK.md
git commit -m "feat: Initial Shark enhancement branch"
```

#### 1.2 Analyze OpenCode Architecture
**Key Directories to Map**:
```
opcode-shark-enhanced/
├── packages/
│   ├── opencode/          # Core engine
│   │   ├── src/
│   │   │   ├── agent/     # Agent system
│   │   │   ├── tool/      # Tool execution
│   │   │   ├── session/   # Session management
│   │   │   ├── config/    # Configuration
│   │   │   └── cli/       # CLI entry points
│   │   └── package.json
│   └── ui/                # TUI components
└── package.json           # Root workspace
```

**Critical Files for Integration**:
1. `packages/opencode/src/tool/registry.ts` - Tool execution entry point
2. `packages/opencode/src/session/processor.ts` - Session flow control
3. `packages/opencode/src/agent/agent.ts` - Base agent class
4. `packages/opencode/src/cli/cmd/tui/index.ts` - TUI entry point

#### 1.3 Create Integration Map
```typescript
// Integration point mapping
const INTEGRATION_POINTS = {
  toolExecution: {
    file: 'packages/opencode/src/tool/registry.ts',
    method: 'executeTool',
    hookType: 'wrapper',
    priority: 'HIGH'
  },
  sessionStart: {
    file: 'packages/opencode/src/session/processor.ts',
    method: 'process',
    hookType: 'interceptor',
    priority: 'HIGH'
  },
  agentCreation: {
    file: 'packages/opencode/src/agent/factory.ts',
    method: 'createAgent',
    hookType: 'decorator',
    priority: 'MEDIUM'
  },
  configLoad: {
    file: 'packages/opencode/src/config/config.ts',
    method: 'loadConfig',
    hookType: 'enhancer',
    priority: 'MEDIUM'
  }
};
```

### **DAY 2: Shark Integration Plugin Skeleton**

#### 2.1 Create Plugin Structure
```bash
# Create shark integration plugin
mkdir -p packages/shark-integration/src
cd packages/shark-integration

# Package.json
cat > package.json << 'EOF'
{
  "name": "@shark-enhanced/opencode-integration",
  "version": "0.1.0",
  "description": "Shark mechanical enforcement integration for OpenCode",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    "@opencode/opencode": "workspace:*",
    "@shark-enhanced/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
EOF

# Create source structure
mkdir -p src/{hooks,integrations,utils}
```

#### 2.2 Core Integration Files
```typescript
// src/index.ts - Main plugin entry
export { SharkIntegrationPlugin } from './plugin';
export { SharkToolRegistry } from './integrations/tool-registry';
export { SharkSessionProcessor } from './integrations/session-processor';
export { SharkEnhancedAgent } from './integrations/agent-enhancer';

// src/plugin.ts - Plugin definition
import { Plugin } from '@opencode/opencode';
import { SharkToolRegistry } from './integrations/tool-registry';
import { SharkSessionProcessor } from './integrations/session-processor';

export class SharkIntegrationPlugin implements Plugin {
  name = 'shark-integration';
  version = '0.1.0';
  
  async activate(context) {
    // Register tool execution wrapper
    context.toolRegistry.registerWrapper(new SharkToolRegistry());
    
    // Enhance session processor
    context.sessionProcessor.addInterceptor(new SharkSessionProcessor());
    
    // Initialize Shark systems
    await this.initializeSharkSystems();
    
    console.log('🦈 Shark Integration Plugin activated');
  }
  
  private async initializeSharkSystems() {
    // Load Shark Guardian, FirewallMesh, etc.
    // from existing shark-frankenstein codebase
  }
}
```

#### 2.3 Tool Execution Wrapper
```typescript
// src/integrations/tool-registry.ts
import { ToolRegistry, ToolCall, ToolResult } from '@opencode/opencode';
import { Guardian } from '@shark-enhanced/core/guardian';
import { FirewallMesh } from '@shark-enhanced/core/firewall-mesh';

export class SharkToolRegistry implements ToolRegistry.Wrapper {
  private guardian: Guardian;
  private firewallMesh: FirewallMesh;
  
  constructor() {
    this.guardian = new Guardian({ protectionLevel: 'balanced' });
    this.firewallMesh = new FirewallMesh(this.guardian);
  }
  
  async beforeExecute(toolCall: ToolCall): Promise<ToolCall | null> {
    // 1. FirewallMesh check
    const meshResult = await this.firewallMesh.checkToolCall(toolCall);
    if (!meshResult.allowed) {
      console.log(`🛡️ Firewall blocked: ${meshResult.reason}`);
      return null; // Block execution
    }
    
    // 2. Guardian permission check (for file operations)
    if (toolCall.name.includes('file')) {
      const filePath = toolCall.arguments.file_path;
      const decision = this.guardian.checkPermission(filePath, 'write');
      if (decision === 'DENY') {
        console.log(`🛡️ Guardian blocked write to: ${filePath}`);
        return null;
      }
    }
    
    return toolCall; // Allow execution
  }
  
  async afterExecute(toolCall: ToolCall, result: ToolResult): Promise<ToolResult> {
    // Log execution for audit trail
    this.logAudit(toolCall, result);
    return result;
  }
  
  private logAudit(toolCall: ToolCall, result: ToolResult) {
    // Log to .shark/logs/
  }
}
```

### **DAY 3: Fix Current Test Suite**

#### 3.1 Update API Keys & Fix Tests
```bash
# Backup current test scripts
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
cp testing/stage2-local/test-real-api.sh testing/stage2-local/test-real-api.sh.backup

# Fix DeepSeek response parsing
sed -i "s/response.substring(0, 50)/response.content.substring(0, 50)/" testing/stage2-local/test-real-api.sh

# Create new test key management
cat > testing/api-keys.md << 'EOF'
# API Key Management

## Test Keys (DO NOT COMMIT)
- Gemma: Use environment variable GOOGLE_API_KEY_TEST
- DeepSeek: Use environment variable DEEPSEEK_API_KEY_TEST  
- GLM: Use environment variable GLM_API_KEY_TEST

## Production Keys
- Set via environment variables without _TEST suffix
EOF
```

#### 3.2 Create Integration Test
```typescript
// testing/integration/shark-opencode.test.ts
import { SharkIntegrationPlugin } from '../../packages/shark-integration/src';
import { OpenCode } from '@opencode/opencode';

describe('Shark OpenCode Integration', () => {
  test('Tool execution passes through Guardian', async () => {
    const opencode = new OpenCode();
    opencode.registerPlugin(new SharkIntegrationPlugin());
    
    // Attempt to write to protected path
    const result = await opencode.executeTool({
      name: 'write_file',
      arguments: {
        file_path: '/etc/passwd',
        content: 'test'
      }
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Guardian blocked');
  });
  
  test('Shark mode wizard appears on first launch', async () => {
    // Test initial wizard integration
  });
});
```

### **DAY 4: Initial Wizard Integration**

#### 4.1 Modify OpenCode CLI Entry
```typescript
// packages/opencode/src/cli/cmd/tui/index.ts - Modified
import { SharkModeWizard } from '@shark-enhanced/ui/wizard';

export async function tuiCommand(args) {
  // Check if first launch or no active session
  const isFirstLaunch = !fs.existsSync(getConfigPath());
  
  if (isFirstLaunch) {
    // Show Shark Agent wizard
    const mode = await SharkModeWizard.show();
    
    // Apply mode-specific enhancements
    applySharkMode(mode);
    
    console.log(`🎯 Shark Agent Mode: ${mode}`);
    console.log(`🔧 Mechanical enforcement: ACTIVE`);
  }
  
  // Continue with enhanced OpenCode
  return originalTuiCommand(args);
}
```

#### 4.2 Create Mode Wizard
```typescript
// packages/shark-integration/src/ui/wizard.ts
export class SharkModeWizard {
  static async show(): Promise<'shark' | 'plan' | 'build'> {
    const { default: enquirer } = await import('enquirer');
    
    const response = await enquirer.prompt({
      type: 'select',
      name: 'mode',
      message: '🦈 Welcome to Shark Agent',
      choices: [
        {
          name: 'shark',
          message: '🦈 Shark Mode (Recommended)',
          hint: 'Autonomous dual-brain coordination with mechanical enforcement'
        },
        {
          name: 'plan',
          message: '📝 Plan Mode',
          hint: 'Manual planning with AI assistance'
        },
        {
          name: 'build',
          message: '🔨 Build Mode',
          hint: 'Direct execution without planning'
        }
      ],
      initial: 'shark'
    });
    
    return response.mode;
  }
}
```

### **DAY 5: Build & Test Integration**

#### 5.1 Build Script
```bash
#!/bin/bash
# build-shark-enhanced.sh

echo "🔨 Building Shark Enhanced OpenCode..."

# Build OpenCode core
cd packages/opencode
npm run build

# Build Shark integration
cd ../shark-integration
npm run build

# Build UI enhancements
cd ../ui
npm run build

echo "✅ Build complete"
echo ""
echo "To test:"
echo "  npm run test:integration"
echo "  npm run dev:shark"
```

#### 5.2 Integration Test Suite
```json
// package.json test scripts
{
  "scripts": {
    "test:integration": "jest testing/integration/ --passWithNoTests",
    "test:guardian": "node testing/integration/guardian.test.js",
    "test:firewall": "node testing/integration/firewall.test.js",
    "test:wizard": "node testing/integration/wizard.test.js",
    "dev:shark": "nodemon --watch packages/shark-integration/src --exec 'npm run build && node dist/cli.js'"
  }
}
```

### **DAY 6-7: Documentation & Validation**

#### 6.1 Create User Documentation
```markdown
# Shark Enhanced OpenCode - User Guide

## What is Shark Enhanced OpenCode?
OpenCode with mechanical enforcement systems baked in:
- **Guardian**: Protects your filesystem automatically
- **FirewallMesh**: 4 parallel safety checks on every action
- **Dual-Brain**: Auto-routes tasks to appropriate AI systems
- **Workflow Enforcement**: PLAN→BUILD→TEST→VERIFY→SHIP sequence

## Getting Started
```bash
# Install
npm install -g opencode-shark-enhanced

# First launch (shows wizard)
opencode

# Subsequent launches
opencode "fix the bug in main.py"
```

## Modes
- **🦈 Shark Mode**: Full autonomous with mechanical enforcement
- **📝 Plan Mode**: Manual planning assistance  
- **🔨 Build Mode**: Direct execution without planning

## Configuration
```json
// ~/.config/opencode/shark.json
{
  "mode": "shark",
  "guardian": {
    "protectionLevel": "balanced",
    "blockedPaths": ["/etc", "/usr", "~/.ssh"]
  },
  "firewalls": {
    "guardian": true,
    "workflow": true,
    "theatrical": true,
    "secrets": true
  }
}
```
```

#### 6.2 Validation Checklist
```markdown
# Week 1 Validation Checklist

## ✅ Core Integration
- [ ] OpenCode repository forked and analyzed
- [ ] Shark integration plugin skeleton created
- [ ] Tool execution wrapper implemented
- [ ] Guardian integration tested
- [ ] FirewallMesh integration tested

## ✅ Test Suite
- [ ] Current Shark CLI tests fixed
- [ ] Integration tests created
- [ ] API key management updated
- [ ] Test automation working

## ✅ User Experience
- [ ] Initial wizard implemented
- [ ] Mode selection working
- [ ] UI enhancements planned
- [ ] Documentation created

## ✅ Build System
- [ ] Build scripts created
- [ ] Development workflow established
- [ ] Dependency management working
- [ ] Versioning strategy defined
```

---

## 🚀 WEEK 1 DELIVERABLES

### **Code Deliverables**:
1. `opencode-shark-enhanced/` - Forked repository with Shark integration
2. `packages/shark-integration/` - Plugin with mechanical enforcement
3. `testing/integration/` - Comprehensive test suite
4. `build-shark-enhanced.sh` - Build automation

### **Documentation Deliverables**:
1. `INTEGRATION_MAP.md` - Detailed hook points and strategies
2. `USER_GUIDE.md` - End-user documentation
3. `DEVELOPER_GUIDE.md` - Contributor documentation
4. `ROADMAP.md` - Phase 2-4 implementation plan

### **Validation Deliverables**:
1. **Proof of Concept**: Guardian blocking `/etc/passwd` write in OpenCode
2. **Performance Baseline**: <100ms overhead for Shark systems
3. **User Flow**: Initial wizard → enhanced TUI working end-to-end
4. **Test Coverage**: 80%+ on integration tests

---

## 🔧 TECHNICAL DECISIONS & TRADEOFFS

### **Decision 1: Plugin vs Fork**
**Chosen**: Hybrid approach - Fork OpenCode but use plugin architecture internally
**Reason**: Need to modify entry points (wizard) but want maintainable integration

### **Decision 2: Integration Depth**
**Chosen**: Deep integration at tool execution level
**Reason**: Mechanical enforcement must be at the execution point to be effective

### **Decision 3: UI Changes**
**Chosen**: Subtle enhancements preserving OpenCode feel
**Reason**: User familiarity is critical for adoption

### **Decision 4: Performance**
**Chosen**: Accept <100ms overhead for safety
**Reason**: Mechanical enforcement worth minor performance cost

---

## 🎯 SUCCESS CRITERIA FOR WEEK 1

1. **Technical**: Guardian successfully blocks protected file writes in OpenCode
2. **User Experience**: Initial wizard appears and mode selection works
3. **Performance**: Tool execution overhead <50ms with all firewalls
4. **Reliability**: No regression in existing OpenCode functionality
5. **Maintainability**: Clean separation between OpenCode and Shark code

---

## 📞 ESCALATION PATHS

### **Technical Blockers**:
1. **OpenCode API limitations** → Implement graceful fallback
2. **Performance issues** → Optimize FirewallMesh parallel execution
3. **Build system complexity** → Simplify with workspace references

### **Architecture Decisions**:
1. **Review required for**: Major hook point changes
2. **Consultation needed for**: UI/UX design changes
3. **Approval needed for**: Breaking changes to OpenCode APIs

---

*Implementation plan prepared for Week 1 foundation work*  
*Next: Begin fork and analysis (Day 1 tasks)*