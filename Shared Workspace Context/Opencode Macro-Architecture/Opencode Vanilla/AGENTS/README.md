# OpenCode Vanilla — Built-in Agents

Documentation for the 7 built-in agents in OpenCode core.

---

## Agent Overview

| Agent | Mode | Native | Hidden | Purpose |
|-------|------|--------|--------|---------|
| `build` | primary | yes | no | Default execution agent |
| `plan` | primary | yes | no | Planning mode (no edits) |
| `general` | subagent | yes | no | General-purpose research |
| `explore` | subagent | yes | no | Codebase exploration |
| `compaction` | primary | yes | yes | Session compaction |
| `title` | primary | yes | yes | Session title generation |
| `summary` | primary | yes | yes | Session summary generation |

---

## Default Permission Ruleset (Base)

All agents inherit this base ruleset, merged with agent-specific overrides and user config:

```
"*": "allow"
doom_loop: "ask"
external_directory: {
  "*": "ask"
  "<skill-dirs>/*": "allow"
}
question: "deny"
plan_enter: "deny"
plan_exit: "deny"
read: {
  "*": "allow"
  "*.env": "ask"
  "*.env.*": "ask"
  "*.env.example": "allow"
}
```

---

## Agent Specifications

### 1. BUILD Agent

**Mode:** primary  
**Native:** yes  
**Hidden:** no

**Description:** The default agent. Executes tools based on configured permissions.

**Permission Config (merged over defaults):**
```
question: "allow"
plan_enter: "allow"
```

**Config Override:**
```json
{
  "agent": {
    "build": {
      "model": { "providerID": "openai", "modelID": "gpt-4o" },
      "temperature": 0.7,
      "top_p": 0.9,
      "mode": "primary",
      "color": "#10b981",
      "description": "Custom description",
      "steps": 100
    }
  }
}
```

**Tab Toggle:** Shows as primary tab when no default_agent configured.

---

### 2. PLAN Agent

**Mode:** primary  
**Native:** yes  
**Hidden:** no

**Description:** Plan mode. Disallows all edit tools.

**Permission Config (merged over defaults):**
```
question: "allow"
plan_exit: "allow"
external_directory: {
  "<GLOBAL_PATH>/plans/*": "allow"
}
edit: {
  "*": "deny"
  ".opencode/plans/*.md": "allow"
  "<worktree>/.opencode/plans/*.md": "allow"
}
```

**Config Override:**
```json
{
  "agent": {
    "plan": {
      "model": { "providerID": "anthropic", "modelID": "claude-sonnet-4-20250514" },
      "prompt": "Custom planning instructions...",
      "mode": "primary"
    }
  }
}
```

**Tab Toggle:** Shows as primary tab. Cannot delegate to subagents.

---

### 3. GENERAL Agent

**Mode:** subagent  
**Native:** yes  
**Hidden:** no

**Description:** General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.

**Permission Config (merged over defaults):**
```
todowrite: "deny"
```

**Config Override:**
```json
{
  "agent": {
    "general": {
      "model": { "providerID": "openai", "modelID": "gpt-4o" },
      "temperature": 0.5,
      "mode": "subagent",
      "description": "Custom description"
    }
  }
}
```

**Tab Toggle:** Does NOT show as primary tab (subagent mode).

---

### 4. EXPLORE Agent

**Mode:** subagent  
**Native:** yes  
**Hidden:** no

**Description:** Fast agent specialized for exploring codebases. Use this agent when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase. Specify thoroughness: "quick", "medium", or "very thorough".

**Permission Config (merged over defaults):**
```
"*": "deny"
grep: "allow"
glob: "allow"
list: "allow"
bash: "allow"
webfetch: "allow"
websearch: "allow"
codesearch: "allow"
read: "allow"
external_directory: {
  "*": "ask"
  "<skill-dirs>/*": "allow"
}
```

**Config Override:**
```json
{
  "agent": {
    "explore": {
      "model": { "providerID": "anthropic", "modelID": "claude-haiku-4-20250514" },
      "prompt": "PROMPT_EXPLORE (from prompt/explore.txt)",
      "mode": "subagent"
    }
  }
}
```

**Tab Toggle:** Does NOT show as primary tab (subagent mode).

---

### 5. COMPACTION Agent

**Mode:** primary  
**Native:** yes  
**Hidden:** yes

**Description:** Internal agent for session compaction. Used to compress conversation history.

**Permission Config:**
```
"*": "deny"
```

**Config Override:**
```json
{
  "agent": {
    "compaction": {
      "prompt": "PROMPT_COMPACTION (from prompt/compaction.txt)",
      "mode": "primary",
      "hidden": true
    }
  }
}
```

**Tab Toggle:** Hidden — does not show in tabs.

---

### 6. TITLE Agent

**Mode:** primary  
**Native:** yes  
**Hidden:** yes

**Description:** Internal agent for generating session titles.

**Permission Config:**
```
"*": "deny"
```

**Temperature:** 0.5

**Config Override:**
```json
{
  "agent": {
    "title": {
      "prompt": "PROMPT_TITLE (from prompt/title.txt)",
      "temperature": 0.5,
      "mode": "primary",
      "hidden": true
    }
  }
}
```

**Tab Toggle:** Hidden — does not show in tabs.

---

### 7. SUMMARY Agent

**Mode:** primary  
**Native:** yes  
**Hidden:** yes

**Description:** Internal agent for generating session summaries.

**Permission Config:**
```
"*": "deny"
```

**Config Override:**
```json
{
  "agent": {
    "summary": {
      "prompt": "PROMPT_SUMMARY (from prompt/summary.txt)",
      "mode": "primary",
      "hidden": true
    }
  }
}
```

**Tab Toggle:** Hidden — does not show in tabs.

---

## Custom Agent Override Pattern

All agents (including custom ones) support these config fields:

```json
{
  "agent": {
    "<agent-name>": {
      "disable": true,           // Remove built-in agent
      "model": {                 // Override model
        "providerID": "string",
        "modelID": "string"
      },
      "variant": "string",        // Agent variant
      "prompt": "string",        // Override system prompt
      "description": "string",  // Override description
      "temperature": 0.7,         // Override temperature
      "top_p": 0.9,              // Override top_p
      "mode": "primary|subagent|all",  // Override mode
      "color": "#hex",           // UI color
      "hidden": false,           // Show/hide from tabs
      "name": "string",          // Rename agent
      "steps": 100,              // Max steps
      "options": {},             // Additional options
      "permission": {}           // Merge permission rules
    }
  }
}
```

---

## Mode Semantics

| Mode | Can be default | Shows in tabs | Can delegate |
|------|----------------|---------------|--------------|
| `primary` | yes | yes | yes |
| `subagent` | no | no | yes (but not to self) |
| `all` | yes | yes | yes |

**Note:** An agent with `mode: "subagent"` cannot be set as `default_agent` and will throw an error if attempted.
