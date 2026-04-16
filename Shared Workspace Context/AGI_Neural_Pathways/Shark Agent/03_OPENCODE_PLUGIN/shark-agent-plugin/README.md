# Shark Agent Plugin for Vanilla OpenCode

**🦈 100% Standalone Plugin - Zero External Dependencies**

This is a standalone Shark Agent plugin for vanilla OpenCode 1.2.0+ that provides dual-brain AI architecture with mechanical safety enforcement.

## 🚨 Critical Design Principle

**This plugin has ZERO dependencies on opencode-ultra or any other plugins.**

- ✅ Works with vanilla OpenCode 1.2.0+
- ✅ Uses only `@opencode-ai/plugin` and `@opencode-ai/sdk`
- ✅ No external plugin dependencies required

## 🎯 Features

### Dual-Brain Architecture
- **Micro Engineer (Free/Local)**: DeepSeek Chat (thinks) + local vLLM Qwen (executes)
- **Macro Engineer (Paid/Cloud)**: GLM 5 (primary) + DeepSeek R1 (advisory)
- **Automatic Brain Switching**: Visible in OpenCode chat UI

### 4-Layer Safety Stack
1. **Guardian**: Filesystem protection (blocks `/etc`, `/usr`, `~/.ssh/`)
2. **FirewallMesh**: 4 parallel security screens (<50ms overhead)
3. **StagnationDetector**: Prevents repetitive failure loops
4. **Workflow Enforcement**: PLAN→BUILD→TEST→VERIFY→SHIP brick-wall

### Mode Selector Wizard
- Launches automatically on new sessions
- Uses OpenCode's built-in `Question.ask()` tool
- Same UX pattern as OpenCode's plan mode

## 📦 Installation

```bash
# Install dependencies (vanilla OpenCode only)
npm install

# Build the plugin
npm run build

# The plugin is now ready for OpenCode
```

## 🔧 Configuration

Add to your OpenCode configuration:

```json
{
  "plugin": ["shark-agent-plugin"],
  "shark": {
    "default_mode": "micro",
    "auto_launch_wizard": true,
    "safety": {
      "guardian_enabled": true,
      "firewall_mesh_enabled": true
    }
  }
}
```

## 🚀 Usage

1. Start OpenCode in a project
2. Shark Agent wizard launches automatically
3. Choose Micro Engineer (free) or Macro Engineer (paid)
4. Plugin activates with dual-brain coordination
5. Brain switching visible in chat UI

## 🧪 Development

```bash
# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Run tests
npm test
```

## 📁 Project Structure

```
shark-agent-plugin/
├── src/
│   ├── index.ts              # Main plugin entry (vanilla OpenCode hooks)
│   ├── wizard/               # Mode selector (uses Question.ask())
│   ├── coordinator/          # Dual-brain coordination
│   ├── safety/              # Safety stack integration
│   ├── hooks/               # OpenCode hook implementations
│   └── utils/               # Utilities and adapters
├── dist/                    # Compiled plugin
├── package.json             # ZERO opencode-ultra dependencies
└── README.md               # This file
```

## ⚠️ Important Notes

- **NO OPENCODE-ULTRA**: This plugin does NOT require or use opencode-ultra
- **VANILLA OPENCODE ONLY**: Designed for standard OpenCode installation
- **ZERO PLUGIN DEPENDENCIES**: Completely standalone

## 📄 License

MIT

## 🙏 Acknowledgments

- Shark Frankenstein Team - Original dual-brain architecture
- OpenCode Team - Plugin system and SDK

---

**Status**: 🔄 In Development  
**Version**: 1.0.0  
**Compatibility**: OpenCode 1.2.0+
