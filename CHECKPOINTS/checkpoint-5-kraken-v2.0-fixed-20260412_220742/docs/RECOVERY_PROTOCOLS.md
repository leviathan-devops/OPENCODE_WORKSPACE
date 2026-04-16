# RECOVERY PROTOCOLS - WHEN THINGS GO WRONG

**Purpose:** Step-by-step recovery procedures when things break
**Binding:** ALL agents, ALL recovery operations

---

## 🚨 IF SESSION CRASHES ON RELOAD

**Symptom:** Chat history crashes when reloading session

**Causes:**
1. Database too large (>2GB causes OOM)
2. Corrupted session data
3. Plugin conflict

**DO NOT:**
- Kill running processes
- Edit opencode.json directly

**DO:**
1. Check database size: `ls -lah ~/.local/share/opencode/opencode.db`
2. If >2GB, run compaction via opencode (not manual delete)
3. Archive old sessions to reduce DB size
4. Check plugin compatibility

---

## 🚨 IF COPY/PASTE STOPS WORKING

**Symptom:** Cannot copy by highlighting text

**Causes:**
1. Terminal mouse mode enabled
2. Shell clipboard intercept
3. Wayland/X11 clipboard issue

**DO:**
1. Check terminal: Mouse mode may be active (抯 irssi-style)
2. Try: `tmux` paste or `ctrl+shift+c/v`
3. Check if `DISABLE_CLIPBOARD` env var set

---

## 🚨 IF KRAKEN V2.0 BREAKS OPENCODE

**Symptom:** After Kraken V2.0 ship, vanilla OpenCode broken

**Root Causes Found:**
1. Hook array format wrong
2. Experimental hooks caused crashes
3. Agent registration corrupted config

**DO NOT:**
- Kill processes
- Edit opencode.json while running

**DO:**
1. Restore from checkpoint
2. Fix hook format (must be single functions, not arrays)
3. Remove experimental hooks
4. Test in TUI container before re-ship

---

## 🚨 IF COMPACTION DERAILS BUILDS

**Symptom:** Context lost during compaction, builds restart

**Root Cause:** Compaction was pushing to context instead of file

**DO:**
1. Use `session.compacting` hook properly (write to FILE not context)
2. Set `output.context = []` to clear instead of push
3. Preserve essential state to disk before compaction

---

## 🚨 IF MEMORY SPIKES CAUSE CRASHES

**Symptom:** 24GB memory used, OOM, context loss

**Causes:**
1. Database bloat (2.89GB seen)
2. Multiple opencode instances
3. Memory leaks in plugins

**DO NOT:**
- Kill processes to "fix" memory

**DO:**
1. Use tool summarization (50KB → 200 chars)
2. Archive old sessions
3. Implement memory guardian in plugins
4. Schedule vacuum when session idle

---

## 🚨 PREVENTIVE MAINTENANCE

### Weekly:
- Check database size: `ls -lah ~/.local/share/opencode/opencode.db`
- Vacuum if >500MB
- Archive old sessions

### Before Ship:
- Run MANDATORY_PRE_SHIP_CHECKLIST.md
- Create checkpoint
- Test in TUI container

### After Recovery:
- Update GUARDRAILS.md with lessons
- Document what went wrong
- Prevent recurrence

---

**VIOLATION OF RECOVERY PROTOCOLS = MAKE THINGS WORSE**
**FOLLOW THE DO/DO NOT RULES EXACTLY**
