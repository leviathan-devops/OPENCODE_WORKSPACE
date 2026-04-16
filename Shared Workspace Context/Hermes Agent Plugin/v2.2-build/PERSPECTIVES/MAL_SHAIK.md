# mal_shaik — 7 Secrets from Claude Code Source

Source: Twitter thread analysis, 1.4M impressions
Full analysis: `~/hermes-workspace/context/engineering/THREAD_ANALYSIS_COMPLETE.md`

---

## Secret 1: CLAUDE.md Every TURN (not just session start)

Claude Code reads `CLAUDE.md` on EVERY turn, not just when session starts.

- **40,000 characters** available for conventions
- Includes: project conventions, "never do this" rules, preferred patterns, architectural decisions
- This is why Claude Code "remembers" project-specific rules mid-conversation

**Hermes adaptation**: `~/.hermes/HERMES.md` — same pattern, same 40K limit

---

## Secret 2: Subagent Cache = Free Parallelism

5 parallel subagents cost the same as 1 because they share the context cache.

- Parent context → byte-identical copy → API cache hit
- All 5 agents get cache hits simultaneously
- Cost: ~1x for 5 parallel agents instead of 5x

**Hermes adaptation**: All parallel dispatches happen simultaneously, not sequentially

---

## Secret 3: 3 Execution Models

| Model | Use Case | Cost | Persistence |
|-------|----------|------|-------------|
| **fork** (default) | Most subagent work | ~1x | Cache-optimized |
| **teammate** | Long-running tasks | full context | Separate process + tmux |
| **worktree** | Parallel features | full context | Git-isolated branch |

**Hermes adaptation**: All 3 models available, default to fork

---

## Secret 4: Permission 5-Level Cascade

```
policy  >  flag  >  local  >  project  >  user
(highest override)              (lowest, per-user)
```

| Level | Source | Example |
|-------|--------|---------|
| policy | Built-in rules | Never delete /etc |
| flag | CLI flags | --no-read, --dangerous |
| local | Local config | ~/.claude/settings.json |
| project | Project CLAUDE.md | team conventions |
| user | User preferences | ~/.claude/settings.json |

**Hermes adaptation**: `~/.hermes/settings.json` with allow/deny patterns

---

## Secret 5: 5 Compaction Strategies

| Strategy | Trigger | Action |
|----------|---------|--------|
| **micro** | Every 10 turns | Drop verbatim tool outputs |
| **context collapse** | 50% budget | Summarize conversation spans |
| **session memory** | Proactive | Extract to disk |
| **full** | 95% budget | Summarize everything |
| **PTL** | ??? | ??? |

**Hermes adaptation**: 5-tier system (micro/auto/manual/session/full)

---

## Secret 6: 25+ Hook Lifecycle Events

Claude Code hooks cover the entire lifecycle:

| Event | When |
|-------|------|
| `SessionStart` | New session begins |
| `UserPromptSubmit` | User sends message |
| `PreToolUse` | Before tool execution |
| `PostToolUse` | After tool execution |
| `Stop` | Session ends |

**Hermes adaptation**: All 28 hooks in `HOOKS/INDEX.md`

---

## Secret 7: --continue / --resume / --fork-session

Persistence across sessions:

| Flag | Behavior |
|------|----------|
| `--continue` | Resume last session, pick up where left off |
| `--resume` | Pick specific past session from list |
| `--fork-session` | Branch from past session (new conversation tree) |

**Hermes adaptation**: SessionDB with `--continue/--resume/--fork-session` support

---

## Key Implementation Detail: Tool Execution Model

```
CONCURRENT: read-only operations (glob, grep, read, analyze)
  → All run in parallel, share subagent cache

SERIAL: mutating operations (write, edit, bash, patch)
  → One at a time, in order
```

This is why parallel agents don't corrupt files — reads are parallel, writes are serial.

---

## Source Evidence

These aren't guesses — they're from analyzing Claude Code's actual behavior:

- **Cache hit patterns**: Observed in API traces
- **Hook timing**: Profiled from Claude Code sessions
- **Persistence flags**: `--continue` documented
- **Permission cascade**: Observed in deny/allow behavior
- **40K CLAUDE.md**: Confirmed from Claude Code marketing materials
