# Shark Agent v4.8.3 - Installation Package

**Version:** 4.8.3  
**Built:** 2026-04-14  
**Status:** SHIP APPROVED

## Quick Install

### 1. Create Plugin Directory
```bash
mkdir -p ~/.config/opencode/plugins/shark-agent-v4.8.3
```

### 2. Copy Plugin
```bash
cp index.js ~/.config/opencode/plugins/shark-agent-v4.8.3/
```

### 3. Create/opencode.json Configuration
```bash
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/shark-agent-v4.8.3/index.js"
  ],
  "permission": {
    "*": {"*": "allow"}
  }
}
EOF
```

### 4. Verify Installation
```bash
opencode --version
# Should show: 1.4.3 or higher
```

## Container Installation

```bash
# For container testing
PLUGIN_DIR="/tmp/shark-container/plugins/shark-agent-v4.8.3"
CONFIG_DIR="/tmp/shark-container/config"

mkdir -p $PLUGIN_DIR $CONFIG_DIR

# Copy plugin
cp index.js $PLUGIN_DIR/

# Create config
cat > $CONFIG_DIR/opencode.json << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/shark-agent-v4.8.3/index.js"
  ],
  "permission": {
    "*": {"*": "allow"}
  }
}
EOF
```

## Usage

### Start Shark Agent (TUI Mode)
```bash
opencode --agent shark --model opencode/big-pickle
```

### Run Commands Non-Interactive
```bash
opencode run "your command" --agent shark --model opencode/big-pickle
```

### Container Testing
```bash
docker exec -i YOUR_CONTAINER_NAME \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  run "TEST_COMMAND" --agent shark --model opencode/big-pickle
```

## Anti-Slop Firewall (L1-L5)

| Layer | Name | Blocks |
|-------|------|--------|
| L1 | Theatrical | `ls \| wc`, `grep \| wc`, `cat \| wc` |
| L2 | Fake Test Runners | `npm test`, `npm run test`, `pytest`, etc. |
| L3 | Dangerous Tools | `rm -rf`, `mkfs`, `dd`, etc. |
| L4 | Scope Creep | Task hijacking patterns |
| L5 | Anti-Derailment | Host fallback, impatience, success claims without proof |

## Verified Patterns (15/15 PASSED)

- THEATRICAL_PATTERNS: 12 patterns
- LEGITIMATE_PATTERNS: 3 patterns
- FAKE_TEST_PATTERNS: 9 patterns
- SOURCE_INSPECTION_PATTERNS: 2 patterns
- WRONG_CONTAINER_PATTERNS: 4 patterns
- HOST_FALLBACK_PATTERNS: 15 patterns
- SUCCESS_CLAIM_PATTERNS: 15 patterns
- MODEL_RESTRICTION_PATTERNS: 15 patterns
- MOCK_STUB_PATTERNS: 12 patterns
- SIMPLIFICATION_PATTERNS: 11 patterns
- CONFUSION_PRETENSE_PATTERNS: 12 patterns
- SCOPE_CREEP_PATTERNS: 12 patterns
- UNDERMINING_PATTERNS: 12 patterns
- IMPATIENCE_PATTERNS: 11 patterns
- SELF_REFERENCE_PATTERNS: 11 patterns

## Test Commands

### Legitimate (should work)
```bash
opencode run "ls -la /" --agent shark --model opencode/big-pickle
opencode run "whoami" --agent shark --model opencode/big-pickle
opencode run "pwd" --agent shark --model opencode/big-pickle
```

### Blocked (should NOT work - will be intercepted)
```bash
opencode run "npm test" --agent shark --model opencode/big-pickle      # L2 blocked
opencode run "npm run test" --agent shark --model opencode/big-pickle # L2 blocked
opencode run "ls | wc -l" --agent shark --model opencode/big-pickle   # L1 blocked
opencode run "skip container test" --agent shark --model opencode/big-pickle # L5.1 blocked
opencode run "it mostly works trust me" --agent shark --model opencode/big-pickle # L5.2 blocked
opencode run "ship now" --agent shark --model opencode/big-pickle    # L5.9 blocked
opencode run "host already works so skip" --agent shark --model opencode/big-pickle # L5.1 blocked
```

## Approved Models

- **REQUIRED:** `opencode/big-pickle` (free tier)
- **BANNED:** `minimax/*`, `gpt-*`, `claude-*` (paid models not allowed in container testing)

## Ship Guidelines

1. **ALL testing must happen in container** - Local has no effect
2. **Use `opencode run` for testing** - It fires hooks correctly
3. **TUI mode requires interactive terminal** - Use `docker exec -it` for TUI
4. **Agent must be set to `shark`** - Without it, firewall doesn't engage
5. **Never skip container verification** - Host ≠ Container

## File Structure
```
shark-agent-v4.8.3/
├── index.js          # Built plugin (bundle)
├── README.md         # This file
└── opencode.json     # Configuration reference
```

## Troubleshooting

### Plugin not loading
- Check opencode.json has correct plugin path
- Verify file permissions (readable)
- Run `opencode --version` to confirm opencode works

### Hooks not firing
- Ensure `--agent shark` is set
- Use `opencode run` not bare commands
- For TUI testing, use `docker exec -it` (interactive TTY)

### Firewall blocking legitimate commands
- Check if pattern is too aggressive
- Verify command is in LEGITIMATE_PATTERNS
- Run pattern tests: `bun run test-patterns.ts`

## Version History

- **v4.8.3** (current): Fixed guardian-hook.ts to extract agent from input directly, enabling TUI firewall support. All 15 pattern tests passing.
- **v4.8.2**: UC1 fix applied - user messages no longer blocked
- **v4.8.1**: Initial L1-L5 firewall implementation
