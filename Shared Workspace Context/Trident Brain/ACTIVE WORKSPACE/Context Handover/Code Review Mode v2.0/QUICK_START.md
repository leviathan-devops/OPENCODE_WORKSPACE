# TRIDENT BRAIN - 2-MINUTE SETUP

## Deploy Plugin

```bash
# Copy compiled files to plugin directory
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/dist/* \
  ~/.config/opencode/plugins/trident-brain/
```

## Configure OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugins": {
    "trident-brain": {
      "enabled": true,
      "path": "/home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/dist"
    }
  },
  "agent": {
    "trident": {
      "name": "trident",
      "description": "TRIDENT v2.0 - Algorithmic code review",
      "mode": "primary",
      "permission": { "task": "allow" },
      "color": "#8B5CF6"
    }
  }
}
```

## Restart OpenCode

Select **trident** from the tab toggle agent selector.

## Test It

Say: `"audit this"`

---

## Commands

| Say This | Action |
|----------|--------|
| "audit this" | Scan current directory |
| "verify that [claim]" | Proof verification |
| "analyze hook isolation" | Cross-plugin check |
| "resource footprint" | Memory/token analysis |
| "show me the full report" | Detailed findings |
| "show status" | Current state |

---

## Troubleshooting

**"trident" not in tab toggle?**
- Verify plugin path exists
- Verify agent config is correct
- Restart OpenCode completely

**Plugin crashes?**
- Check for console errors
- Plugin may need rebuild: `cd trident-brain-code-review && npm run build`

---

*Quick Start Guide - Full documentation in 01_CONTEXT_LIBRARY.md*
