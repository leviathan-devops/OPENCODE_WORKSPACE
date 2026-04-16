# 🔧 Qwen Code Multi-Terminal Scaling Issue - Help Request

**Copy and paste this entire prompt to GLM web chat:**

---

## Problem Statement

I'm running **3-4 Qwen Code CLI terminals simultaneously** and want to scale to **10 concurrent terminals**. However, I keep getting this Node.js error that leads to API timeouts:

```
(node:XXXXXX) MaxListenersExceededWarning: Possible EventTarget memory leak detected. 
11 abort listeners added to [AbortSignal]. MaxListeners is 10. 
Use events.setMaxListeners() to increase limit
```

After this warning appears, API calls start timing out and the terminals become unusable.

---

## My Setup

### Environment (DIAGNOSTICS ALREADY RUN)
- **OS:** Linux (Ubuntu-based)
- **Node.js:** v20.20.1
- **Qwen Code CLI:** v0.12.6
- **Installation:** `/home/leviathan/OPENCODE_WORKSPACE/.npm-global/bin/qwen` (symlink to `../lib/node_modules/@qwen-code/qwen-code/cli.js`)
- **Current terminals running:** 7 processes (3-4 active terminals)
- **Available RAM:** 30Gi total, 17Gi free, 23Gi available
- **NODE_OPTIONS:** Not set (currently)
- **Concurrent terminals:** Currently 3-4, want to scale to 10

### Terminal Configuration
Each terminal runs:
```bash
qwen --yolo
```

Sometimes with double yolo:
```bash
qwen --yolo --yolo
```

### What I'm Doing
- Each terminal has an active Qwen Code session
- Terminals are making API calls to GLM API (`https://api.z.ai/api/coding/paas/v4`)
- Sessions can last 1-4 hours
- Terminals are independent (different projects/tasks)

---

## What I've Tried

### Not Yet Tried (Waiting for Your Advice)
- [ ] Setting `NODE_OPTIONS` environment variable
- [ ] Modifying Qwen Code CLI source
- [ ] Using a process manager
- [ ] Any other solutions

### Current Workaround
- Closing unused terminals when not in use
- But this defeats the purpose of having multiple active sessions

---

## Technical Details

### Error Pattern
1. Terminal runs fine for 10-30 minutes
2. Warning appears: `MaxListenersExceededWarning: 11 abort listeners added to [AbortSignal]`
3. Shortly after, API calls start timing out
4. Terminal becomes unresponsive or very slow
5. Restarting the terminal temporarily fixes it

### My Hypothesis
Each Qwen Code terminal creates ~3-4 AbortSignal listeners for API timeout handling. With 3-4 terminals running, we hit the Node.js default limit of 10 listeners per EventTarget.

The listeners aren't being cleaned up after API calls complete, causing accumulation.

---

## What I Need From You

### 1. Root Cause Analysis
Explain **exactly** what's causing this:
- Is it the Qwen Code CLI not cleaning up listeners?
- Is it Node.js default limits being too conservative?
- Is it something about how the GLM API client handles connections?
- Is it connection pooling issues?

### 2. Multiple Solution Options

Provide **at least 3 different approaches** with pros/cons:

**Option A: Environment Variable Fix**
- What `NODE_OPTIONS` should I set?
- Where do I set it (`.bashrc`, per-terminal, etc.)?
- What are the trade-offs?

**Option B: Qwen Code CLI Modification**
- What file(s) in the Qwen Code CLI need to be modified?
- What exact code change is needed?
- How do I find the CLI source code?

**Option C: Process/Connection Management**
- Should I limit concurrent API calls per terminal?
- Should I use a connection pooler?
- Should I stagger terminal API usage?

**Option D: Alternative Architecture**
- Should I use a single "master" terminal that distributes work?
- Should I use tmux/screen instead of separate terminals?
- Other architectural suggestions?

### 3. Step-by-Step Implementation

For your **recommended solution**, provide:

```bash
# Exact commands to run
# Exact files to edit
# Exact configuration changes
# How to verify it's working
```

### 4. Scaling Calculation

Help me understand:
- If I want **10 concurrent terminals**, what should I set the limits to?
- How much RAM will each terminal need?
- Are there other bottlenecks I'll hit at 10 terminals?
- What's the theoretical maximum number of terminals I can run?

### 5. Monitoring & Debugging

Teach me how to:
- Monitor listener count in real-time
- Check for memory leaks
- Identify which terminal is causing issues
- Set up alerts before hitting limits

---

## Constraints & Requirements

### Must-Haves
- ✅ Support for **10 concurrent Qwen Code terminals**
- ✅ Each terminal can run for **4+ hours** without issues
- ✅ **No manual intervention** required during sessions
- ✅ **Minimal performance impact** on API calls

### Nice-to-Haves
- ⚡ Ability to scale to 15+ terminals in the future
- ⚡ Automatic cleanup of stale listeners
- ⚡ Monitoring/dashboard for terminal health

### Cannot Change
- ❌ Cannot switch to a different CLI (need Qwen Code)
- ❌ Cannot reduce number of terminals (workflow requirement)
- ❌ Cannot significantly increase API timeout (build requirements)

---

## Questions to Ask Me (If Needed)

I've already run the diagnostics. Here are the results:

```bash
# Node.js version
node --version
# Output: v20.20.1

# Qwen Code version
qwen --version
# Output: 0.12.6

# Running Qwen processes
pgrep -af "node.*qwen" | wc -l
# Output: 7 processes (3-4 terminals)

# Available RAM
free -h
# Output: 30Gi total, 17Gi free, 23Gi available

# Qwen installation path
which qwen
# Output: /home/leviathan/OPENCODE_WORKSPACE/.npm-global/bin/qwen

# Installation details
ls -la /home/leviathan/OPENCODE_WORKSPACE/.npm-global/bin/qwen
# Output: lrwxrwxrwx -> ../lib/node_modules/@qwen-code/qwen-code/cli.js

# NODE_OPTIONS
echo $NODE_OPTIONS
# Output: not set
```

Use this information for your analysis.

---

## Expected Output Format

Please structure your response as:

```markdown
## Root Cause
[Your analysis of what's causing the issue]

## Recommended Solution
[Your primary recommendation with justification]

## Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
...

## Alternative Solutions
### Option B
[Description, pros/cons, implementation]

### Option C
[Description, pros/cons, implementation]

## Scaling Calculator
- For 10 terminals: [specific settings]
- For 15 terminals: [specific settings]
- Memory estimate: [X MB per terminal]

## Verification
[How to confirm the fix is working]

## Monitoring
[How to watch for issues in the future]
```

---

## Context: Why I Need This

I'm building a **multi-terminal AI development workflow** where:
- Each terminal has a specialized role (coding, debugging, testing, documentation, etc.)
- Terminals need to stay active for hours at a time
- I cannot afford API timeouts mid-build
- Reliability is more important than raw speed

This is for **personal/internal use**, not a production SaaS. I just need it to work reliably for my workflow.

---

**Please provide a detailed, actionable solution. I'm ready to implement whatever you recommend.**

```

---

## Follow-Up Questions (After Initial Response)

Once GLM provides their initial analysis, ask these follow-ups:

```
Thanks for the analysis. A few follow-up questions:

1. **Safety of increasing limits**: If I set `--max-listeners=100`, is there any risk of actual memory leaks or crashes? Or is it just removing a safety warning?

2. **Qwen Code CLI source**: You mentioned modifying the CLI. How do I find where the AbortSignal listeners are created in the Qwen Code codebase? What file paths should I look at?

3. **Connection pooling**: Should I be using a persistent connection pool for the GLM API calls? Would that reduce listener creation?

4. **Terminal management**: Is there a better way to manage 10 terminals? Should I use tmux with a single Qwen Code instance and multiple windows?

5. **Graceful degradation**: If one terminal hits the limit, can I make it auto-restart without affecting the other 9 terminals?

Please be specific with code examples where applicable.
```

---

## Quick Diagnostic Commands (Run These First)

Before sending the prompt, you can run these to have the info ready:

```bash
# Check Node.js version
node --version

# Check Qwen Code version
qwen --version

# Count running Qwen processes
pgrep -af "node.*qwen" | wc -l

# Check available RAM
free -h

# Find Qwen Code installation
which qwen

# Check if Qwen is a symlink
ls -la $(which qwen)

# Look at Qwen Code entry point
head -30 $(which qwen) 2>/dev/null || cat $(which qwen)
```

Include the output of these commands when you send the prompt to GLM.

---

**Ready to send?** Copy this entire prompt and paste into GLM web chat. All diagnostics are already included.

---

## DIAGNOSTIC OUTPUT (For Quick Reference)

```
Node.js: v20.20.1
Qwen Code: 0.12.6
Running processes: 7 (3-4 terminals)
Available RAM: 30Gi total, 17Gi free, 23Gi available
Qwen path: /home/leviathan/OPENCODE_WORKSPACE/.npm-global/bin/qwen
NODE_OPTIONS: not set
```
