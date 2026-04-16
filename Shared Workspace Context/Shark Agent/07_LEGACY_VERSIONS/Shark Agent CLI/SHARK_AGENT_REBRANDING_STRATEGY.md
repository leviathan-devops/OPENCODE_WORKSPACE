# 🦈 SHARK AGENT REBRANDING STRATEGY

**Date**: March 30, 2026  
**Goal**: Transform "OpenCode" into "Shark Agent" while preserving user familiarity  
**Approach**: Gradual, user-centric rebranding with mechanical enforcement as differentiator

---

## 🎯 REBRANDING PHILOSOPHY

### **Core Principle**: "OpenCode Shell, Shark Engine"
- **Externally**: Still feels like OpenCode
- **Internally**: Significantly enhanced with Shark intelligence
- **Branding**: "Shark Agent" as the enhanced version, not replacement

### **User Experience Goals**:
1. **Familiarity**: OpenCode users feel immediately at home
2. **Delight**: "This is OpenCode but smarter and safer"
3. **Trust**: Mechanical enforcement provides confidence
4. **Clarity**: Understand what "Shark-enhanced" means

---

## 🎨 VISUAL IDENTITY & BRANDING

### **Logo & Iconography**
```
Current OpenCode:   [OC]
Shark Agent:        [🦈] or [SA]

Progression:
1. Initial: [🦈 OC]  (Shark + OpenCode)
2. Transition: [🦈 Agent]
3. Mature: [🦈] with "Shark Agent" text
```

### **Color Scheme**
```css
/* OpenCode Base Colors (preserved) */
--opencode-primary: #007acc;
--opencode-secondary: #6c757d;

/* Shark Enhancement Colors (accent) */
--shark-primary: #ff6b35;    /* Shark orange - attention/action */
--shark-secondary: #2a9d8f;  /* Ocean teal - intelligence/depth */
--shark-accent: #e9c46a;     /* Gold - value/enhancement */

/* Usage: Shark colors for enhancement indicators only */
```

### **Typography**
```
Primary: OpenCode's existing font stack
Accent: Slight differentiation for Shark elements
- Status indicators: Monospace with shark color
- Mode labels: Bold with shark accent
```

---

## 🚀 LAUNCH EXPERIENCE REBRANDING

### **Initial Launch Flow**
```
BEFORE (Vanilla OpenCode):
$ opencode
[OpenCode TUI loads immediately]

AFTER (Shark Agent):
$ opencode
┌─────────────────────────────────────────┐
│            🦈 SHARK AGENT v2.0           │
│        (OpenCode Enhanced Edition)       │
├─────────────────────────────────────────┤
│  Welcome to Shark Agent!                 │
│  Choose your operating mode:             │
│                                          │
│  🦈 [1] Shark Mode (Recommended)         │
│      Autonomous with mechanical safety   │
│                                          │
│  📝 [2] Plan Mode                        │
│      Manual planning assistance          │
│                                          │
│  🔨 [3] Build Mode                       │
│      Direct execution                    │
│                                          │
│  [4] Learn about Shark enhancements      │
│  [5] Use vanilla OpenCode                │
└─────────────────────────────────────────┘
> 
```

### **Mode Descriptions**
```markdown
## 🦈 Shark Mode (Recommended)
**Intelligent autonomous coding with mechanical enforcement**

Features:
• Dual-brain coordination (DeepSeek thinks → Qwen executes)
• Guardian filesystem protection (blocks dangerous writes)
• 4-layer firewall mesh (parallel safety checks)
• AutoDebug pattern-based error fixing
• Workflow enforcement (PLAN→BUILD→TEST→VERIFY→SHIP)

Best for: Production work, complex tasks, safety-critical operations

## 📝 Plan Mode  
**Manual planning with AI assistance**

Features:
• Standard OpenCode planning capabilities
• AI assistance for design and architecture
• Manual control over execution

Best for: Design phases, learning, when you want full control

## 🔨 Build Mode
**Direct execution without planning**

Features:
• Immediate code generation and execution
• No planning overhead
• Fast iteration

Best for: Quick fixes, simple tasks, experimentation
```

---

## 🖥️ TUI ENHANCEMENTS

### **Header Redesign**
```
BEFORE:
[OpenCode]─────────────────────────────────────

AFTER:
[Shark Agent v2.0]─────────────────────────────
│ Mode: 🦈 Shark (auto)      Model: GLM-5 (128K) │
│                                                │
│ > fix the bug in main.py                       │
│                                                │
│ [Guardian: Active] [Workflow: BUILD] [Firewalls: 4/4] │
└────────────────────────────────────────────────┘
```

### **Status Indicators**
```typescript
// New status bar components
const StatusBar = {
  Guardian: {
    icon: '🛡️',
    states: ['Active', 'Blocked', 'Bypassed', 'Disabled'],
    color: (state) => ({
      Active: 'green',
      Blocked: 'red', 
      Bypassed: 'yellow',
      Disabled: 'gray'
    })[state]
  },
  
  Workflow: {
    icon: '📋',
    steps: ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'SHIP'],
    currentStep: 'BUILD'
  },
  
  Firewalls: {
    icon: '🔥',
    count: 4,
    active: 4,
    status: '4/4'
  },
  
  Brain: {
    icon: '🧠',
    mode: 'Micro', // or 'Macro'
    thinker: 'DeepSeek',
    executor: 'Qwen'
  }
};
```

### **Command Palette Additions**
```
New Shark-specific commands:
/shark-mode      Switch between Shark/Plan/Build modes
/guardian-stats  Show Guardian protection statistics
/firewall-stats  Show firewall activity and blocks
/workflow-status Show current workflow step and requirements
/dual-brain      Show dual-brain coordination status
/debug-mode      Toggle AutoDebug system
```

---

## 📱 BRAND MESSAGING

### **Taglines & Value Propositions**
```
Primary: "OpenCode, enhanced with Shark intelligence"
Secondary: "AI coding with mechanical safety"
Tertiary: "The smart, safe way to code with AI"

Feature Highlights:
• "Guardian: Your filesystem's bodyguard"
• "FirewallMesh: 4 layers of parallel protection"
• "Dual-Brain: Right AI for the right task"
• "Workflow Enforcement: No skipping steps"
```

### **Onboarding Messages**
```markdown
## Welcome to Shark Agent!

You're using **OpenCode enhanced with Shark intelligence**. Here's what's different:

### 🛡️ **Mechanical Safety**
- **Guardian** protects your filesystem from dangerous operations
- **FirewallMesh** runs 4 parallel safety checks on every action
- Your system is protected automatically

### 🧠 **Intelligent Coordination**
- **Dual-Brain** auto-routes tasks: DeepSeek thinks, Qwen executes
- **Micro/Macro** modes choose the right AI for the job
- **AutoDebug** fixes common errors automatically

### 📋 **Workflow Enforcement**
- **PLAN→BUILD→TEST→VERIFY→SHIP** sequence enforced
- No skipping critical steps
- Production-ready code by design

### 🎯 **You're in Control**
- Switch to **Plan Mode** or **Build Mode** anytime
- All original OpenCode features still available
- Mechanical enforcement can be configured or disabled

[Press ? for help, /shark-mode to switch modes]
```

---

## 📦 PACKAGING & DISTRIBUTION

### **Package Names**
```
Primary distribution: `opencode-shark-enhanced`
Alias: `shark-agent` (symlink to opencode)

npm packages:
- opencode-shark-enhanced (main distribution)
- @shark-enhanced/opencode-integration (plugin)
- @shark-enhanced/core (mechanical enforcement library)
```

### **Installation Experience**
```bash
# Installation
npm install -g opencode-shark-enhanced

# First run shows wizard
opencode

# Can still use original command
shark-agent  # alias to opencode

# Or explicit mode
opencode --mode shark "fix the bug"
```

### **Migration Path for Existing Users**
```markdown
## Migrating from Vanilla OpenCode

### Option 1: Upgrade in-place
```bash
npm install -g opencode-shark-enhanced
# Next launch shows Shark wizard
```

### Option 2: Side-by-side installation
```bash
# Keep vanilla OpenCode
npm install -g opencode-shark-enhanced
# Use 'shark-agent' command for enhanced version
# Use 'opencode' command for vanilla version
```

### Configuration Migration:
- Existing OpenCode configs are preserved
- Shark enhancements added as extensions
- No data loss or breaking changes
```

---

## 📚 DOCUMENTATION STRATEGY

### **Documentation Structure**
```
docs/
├── getting-started.md          # Shark Agent introduction
├── modes.md                    # Shark/Plan/Build modes
├── mechanical-enforcement.md   # Guardian, FirewallMesh, etc.
├── dual-brain.md               # Micro/Macro coordination
├── migration.md                # From vanilla OpenCode
├── faq.md                      # Common questions
└── api/                        # Developer documentation
```

### **Help System Integration**
```
# Enhanced help command
/help shark      # Shark-specific features
/help guardian   # Filesystem protection
/help workflow   # Step enforcement
/help dual-brain # AI coordination

# Contextual help
When Guardian blocks an operation:
> "Guardian blocked write to /etc/passwd. Learn more: /help guardian"
```

---

## 🎯 REBRANDING TIMELINE

### **Phase 1: Soft Launch (Week 1-2)**
- **Branding**: "OpenCode Shark Enhanced"
- **Visual**: Shark accents on OpenCode base
- **Experience**: Optional wizard, can skip to vanilla
- **Goal**: Gather feedback, fix issues

### **Phase 2: Feature Parity (Week 3-4)**
- **Branding**: "Shark Agent (OpenCode Enhanced)"
- **Visual**: More prominent Shark elements
- **Experience**: Wizard default, easy access to vanilla
- **Goal**: Complete mechanical enforcement integration

### **Phase 3: Full Rebrand (Week 5-6)**
- **Branding**: "Shark Agent"
- **Visual**: Distinct but familiar identity
- **Experience**: Shark Agent as primary, vanilla as fallback
- **Goal**: Establish as preferred OpenCode distribution

### **Phase 4: Ecosystem (Week 7-8)**
- **Branding**: "Shark Agent" with plugin ecosystem
- **Visual**: Mature design system
- **Experience**: Seamless with OpenCode plugin compatibility
- **Goal**: Become standard for power users

---

## 📊 SUCCESS METRICS

### **Adoption Metrics**
1. **Installation Rate**: % of OpenCode users installing Shark-enhanced
2. **Mode Usage**: Distribution of Shark vs Plan vs Build mode usage
3. **Retention**: Do users continue using Shark mode after first try?
4. **Switching**: Frequency of mode switching (indicates fit)

### **User Satisfaction**
1. **NPS Score**: Net Promoter Score for Shark Agent
2. **Feature Usage**: Which Shark features are most used?
3. **Block Rate**: How often is Guardian actually blocking?
4. **Fix Rate**: AutoDebug success rate for common errors

### **Technical Metrics**
1. **Performance**: Overhead of Shark systems (<100ms target)
2. **Reliability**: Crash rate vs vanilla OpenCode
3. **Security**: Number of dangerous operations prevented
4. **Integration**: Plugin compatibility with OpenCode ecosystem

---

## 🚨 RISK MITIGATION

### **Risk 1: User Confusion**
**Mitigation**: 
- Clear "OpenCode Enhanced" messaging
- Gradual rollout with opt-in wizard
- Easy fallback to vanilla mode
- Comprehensive documentation

### **Risk 2: Brand Dilution**
**Mitigation**:
- Maintain OpenCode compatibility
- Position as "enhancement" not "replacement"
- Contribute improvements back to OpenCode
- Clear value proposition

### **Risk 3: Performance Impact**
**Mitigation**:
- Optimize FirewallMesh parallel execution
- Lazy loading of Shark systems
- Configurable enforcement levels
- Performance monitoring and alerts

### **Risk 4: Community Fragmentation**
**Mitigation**:
- Open source from day one
- Engage with OpenCode community
- Plugin architecture for compatibility
- Clear migration paths both directions

---

## 🎯 KEY DECISIONS & TRADEOFFS

### **Decision 1: Brand Name**
**Options**: Shark Agent vs OpenCode Shark vs Shark-enhanced OpenCode
**Chosen**: "Shark Agent" with "(OpenCode Enhanced)" subtitle
**Reason**: Distinct but connected, emphasizes enhancement

### **Decision 2: Default Mode**
**Options**: Default to Shark vs Default to Vanilla vs Wizard choice
**Chosen**: Wizard with Shark as recommended default
**Reason**: Educates users while respecting choice

### **Decision 3: Visual Changes**
**Options**: Major redesign vs Subtle enhancements vs Theme system
**Chosen**: Subtle enhancements preserving OpenCode familiarity
**Reason**: Reduces cognitive load for existing users

### **Decision 4: Feature Rollout**
**Options**: All at once vs Phased vs Opt-in per feature
**Chosen**: Phased with core mechanical enforcement first
**Reason**: Manage complexity, gather feedback incrementally

---

## 📝 COMMUNICATION PLAN

### **Internal Communication**
```markdown
## Team Announcement
Subject: Shark Agent - OpenCode Enhancement Project

Key Points:
- Goal: Enhance OpenCode with mechanical enforcement
- Approach: Preserve OpenCode UI/UX, add Shark intelligence
- Timeline: 8-week phased rollout
- Success: Measured by adoption and safety improvements

## Weekly Updates
- Progress against roadmap
- User feedback highlights
- Technical challenges and solutions
- Next week's priorities
```

### **External Communication**
```markdown
## GitHub Repository
README: "Shark Agent: OpenCode enhanced with mechanical enforcement"

## Release Notes
v0.1.0: Initial release with Guardian integration
v0.2.0: FirewallMesh and dual-brain coordination
v0.3.0: Workflow enforcement and AutoDebug
v1.0.0: Feature complete, production ready

## Community Engagement
- OpenCode plugin compatibility
- Contribution guidelines
- Feedback channels
- Roadmap transparency
```

---

## 🎯 IMMEDIATE NEXT STEPS

### **Week 1 Tasks**:
1. **Design Finalization**: Complete visual design mockups
2. **Wizard Implementation**: Initial mode selection wizard
3. **Brand Assets**: Create logos, icons, color palette
4. **Documentation**: Draft user guide and migration docs
5. **Communication**: Prepare internal announcement

### **Success Criteria for Week 1**:
- [ ] Wizard appears on first launch
- [ ] Mode selection persists between sessions
- [ ] Visual enhancements implemented in TUI
- [ ] Documentation draft complete
- [ ] Team briefed on rebranding strategy

---

*Rebranding strategy prepared for Shark Agent launch*  
*Next: Begin visual design and wizard implementation*