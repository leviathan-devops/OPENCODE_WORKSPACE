# KRAKEN V2.0 PROPER BUILD - GUARDIAN SAFETY PROTOCOL

## Version: 1.0
## Purpose: Prevent catastrophic local config overwrites during development

---

## THE PROBLEM

Kraken agents have repeatedly failed to properly isolate testing, leading to:
1. Local active config files being overwritten
2. Runtime using project workspace instead of proper container testing
3. Broken deployments that appear to work locally but fail in production

---

## GUARDIAN PRINCIPLES

### 1. ISOLATION IS MANDATORY
**All development, testing, and building MUST happen in:**
```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/
```

**NEVER touch:**
```
/home/leviathan/.config/opencode/          # ACTIVE CONFIG
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/  # ACTIVE PROJECT
```

### 2. CONTAINER TESTING IS THE ONLY VALIDATION
**Before any deployment:**
1. Build Docker image from isolated project
2. Run OpenCode TUI in container
3. Verify `docker ps` shows real containers spawning
4. Verify actual work happens (not just HTTP 200)
5. ONLY after container TUI passes, consider local deployment

### 3. USER APPROVAL IS MECHANICAL GATE
**No local file edits until:**
1. Container TUI testing fully passes
2. User explicitly approves local deployment
3. User mechanically signs off (not AI self-approval)

---

## GUARDIAN ALGORITHM

### Pre-Execution Check
```typescript
function GUARDIAN_CHECK(): boolean {
  const FORBIDDEN_PATHS = [
    '/home/leviathan/.config/opencode/',
    '/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src',
  ];
  
  for (const path of FORBIDDEN_PATHS) {
    if (currentFile.startsWith(path)) {
      throw new Error(`GUARDIAN: Cannot edit ${path} - isolate to project space first`);
    }
  }
  return true;
}
```

### Build Isolation
```bash
# ALWAYS build in isolated project
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/
npm run build

# NEVER build in active project
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/
npm run build  # FORBIDDEN
```

### Container Testing
```bash
# Build custom image from isolated project
docker build -t kraken-v2.0-test:latest \
  /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/

# Run TUI test in container
docker run -it --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  kraken-v2.0-test:latest

# Verify containers spawn (in another terminal)
watch docker ps
```

---

## VERIFICATION CHECKPOINTS

### Checkpoint 1: Anti-Theatrical Scan
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/
grep -r "simulateTaskExecution\|setTimeout.*success.*true" src/
# Must return: 0 matches
```

### Checkpoint 2: Bundle Size Verification
```bash
ls -la kraken-agent/dist/index.js   # Must be >190KB
ls -la shark-agent/dist/index.js   # Must be >550KB  
ls -la manta-agent/dist/index.js   # Must be >150KB
```

### Checkpoint 3: Direct Spawn Verification
```bash
grep -n "spawn.*python3" src/clusters/ClusterInstance.ts
# Must find real spawn call, NOT HTTP request
```

### Checkpoint 4: Container TUI Verification
```bash
# In container TUI:
docker ps | grep kraken-oc-agent
# Must show running containers during task execution
```

---

## FAILURE STATES (GUARDIAN BLOCKS)

| Violation | Guardian Action |
|-----------|-----------------|
| Edit local active config | THROW ERROR - Cannot proceed |
| Build in wrong directory | THROW ERROR - Wrong workspace |
| Skip container testing | THROW ERROR - Isolation required |
| Self-approve deployment | BLOCKED - User approval required |
| Missing verification | THROW ERROR - Checkpoints must pass |

---

## FILES UNDER GUARDIAN PROTECTION

### NEVER MODIFY (Without Explicit User Approval)
- `/home/leviathan/.config/opencode/opencode.json`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/dist/`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/`

### ISOLATED BUILD SPACE (Safe to Edit)
- `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/` (entire tree)

---

## IMPLEMENTATION

The guardian algorithm is enforced by:
1. **Tool-level checks** - Any file operation checks path against forbidden list
2. **Build scripts** - Always run from isolated project
3. **Checkpoint system** - 4 verification gates before deployment
4. **User approval gate** - Mechanical sign-off required

---

**REMEMBER:** If you cannot verify it with `docker ps`, it's not real.

(End of file - 135 lines)
