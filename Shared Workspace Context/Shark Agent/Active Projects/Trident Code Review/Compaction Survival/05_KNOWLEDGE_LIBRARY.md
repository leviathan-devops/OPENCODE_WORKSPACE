# TRIDENT BRAIN v3.2 — KNOWLEDGE LIBRARY

**Date:** 2026-04-16T03:15 UTC
**Purpose:** API keys, patterns, testing reference

---

## API KEYS

### Google Gemma (Container Testing)
```
AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4
```
**Usage:** Set `GOOGLE_API_KEY` environment variable in container
**Model:** `gemma-4-26b-it`

---

## CONTAINER TESTING RULES

### CRITICAL RULE: DevOps Hygiene
1. **NEVER pollute other project containers** (kraken, shark, manta, etc.)
2. **Always create dedicated sandbox** for your testing
3. **Use descriptive names:** `<project>-test` not `test`
4. **Clean up when done:** `docker stop <name> && docker rm <name>`

### Proper Container Setup
```bash
# WRONG - Polluting another project
docker exec kraken-v1.3-test opencode

# CORRECT - Create dedicated sandbox
docker run -dit --name trident-v32-test leviathan/opencode:python3-enabled-1.4.3
docker exec trident-v32-test opencode
```

### Container for Trident Testing
```bash
# Create
docker run -dit --name trident-v32-test --entrypoint /bin/sh \
  -v /home/leviathan:/home/leviathan \
  leviathan/opencode:python3-enabled-1.4.3 \
  -c "while true; do sleep 3600; done"

# Deploy plugin
docker exec trident-v32-test mkdir -p ~/.config/opencode/plugins/trident-brain
docker exec trident-v32-test cp -r /home/leviathan/.config/opencode/plugins/trident-brain/* ~/.config/opencode/plugins/trident-brain/

# Test in TUI
docker exec -it trident-v32-test opencode

# Clean up when done
docker stop trident-v32-test && docker rm trident-v32-test
```

---

## PATTERN REFERENCE

### 3-Layer Artifact Structure

```
## LAYER 1: INITIAL ANALYSIS
   └── What is this project, what went wrong

## LAYER 2: FINDINGS BY CATEGORY
   ├── CRITICAL [BANNED]
   │   ├── WHY this is a problem
   │   ├── HOW to fix (steps)
   │   └── Mechanical verification (command)
   ├── HIGH
   └── MEDIUM/LOW/INFO

## LAYER 3: CONSOLIDATED FIX WORKFLOW
   ├── Critical Path
   ├── Verification Commands
   └── Prevention
```

### Artifact File Naming
```
TRIDENT_CODE_REVIEW_{CONTEXT}_{DATE}.md
Example: TRIDENT_CODE_REVIEW_CALCULATOR_2026-04-16.md
```

---

## BUILD COMMANDS

```bash
# Navigate to project
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Trident\ Brain/Code\ Review\ Mode/Code\ Review\ v3.2

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy to host
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# Run mechanical tests
npm test
```

---

## DEBUGGING

### Check Plugin Loaded
```bash
ls -la ~/.config/opencode/plugins/trident-brain/
# Should show: index.js, algorithmic-core.js, artifact-writer.js
```

### Check Plugin Content
```bash
head -20 ~/.config/opencode/plugins/trident-brain/index.js
# Should show: "TRIDENT BRAIN v3.2"
```

### Check opencode.json
```bash
grep trident ~/.config/opencode/opencode.json
# Should show: file:///home/leviathan/.config/opencode/plugins/trident-brain/index.js
```

---

## RELOAD ANCHOR REFERENCE

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor v3.2/`

**Quick Deploy:**
```bash
cp -r "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor v3.2/dist/"* ~/.config/opencode/plugins/trident-brain/
```

---

## END OF KNOWLEDGE LIBRARY