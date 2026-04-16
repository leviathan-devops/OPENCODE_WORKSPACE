# Kraken Hive Integration - Next Steps & Build Plan

## Current Status (March 30, 2026)

### ✅ COMPLETED:
1. **Hive Framework**: Cloned to `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/`
2. **Hive CLI**: `./hive --help` works (venv exists but quickstart incomplete)
3. **GLM Workspace**: Created at `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine/`
4. **Anti-hallucination Port**: 4 components ported (639 lines total):
   - `mechanical_validator.py` (186 lines)
   - `validator_hook.py` (148 lines)
   - `evidence_checker.py` (142 lines)
   - `patterns.py` (124 lines)
5. **Build Infrastructure**: `pyproject.toml` and `Makefile` created
6. **Dependencies**: pydantic, websockets, aiohttp, click installed in venv

### ❌ INCOMPLETE (Critical Path):
1. **Hive Installation**: Quickstart interrupted at LLM provider selection
2. **Test Files**: No tests for ported validators
3. **CLI Launcher**: No `kraken-hive` command
4. **Hive Integration**: No actual integration with Hive framework
5. **Remaining Components**: Surgical debug, Nemotron, fragments not ported
6. **Collaborator AI**: Not cloned or explored
7. **Documentation**: No README, examples, or tests
8. **Git Setup**: No repository for kraken-hive-engine

## Immediate Execution Plan (Priority Order)

### Phase 1A: Critical Fixes (Today - March 30)

#### Task 1: Complete Hive Installation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
echo "15" | ./quickstart.sh  # Select "Local (Ollama)" to bypass interactive prompt
source .venv/bin/activate
./hive list  # Verify installation
```

#### Task 2: Create Test Files for Ported Validators
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine
mkdir -p tests/validators
# Convert TypeScript tests from:
# /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/tests/anti-hallucination.test.ts
```

Create these test files:
1. `tests/validators/test_mechanical_validator.py`
2. `tests/validators/test_evidence_checker.py`
3. `tests/validators/test_patterns.py`
4. `tests/validators/test_validator_hook.py`

#### Task 3: Build CLI Launcher
```bash
mkdir -p src/kraken/cli
# Create src/kraken/cli/main.py with click commands
```

Update `pyproject.toml`:
```toml
[project.scripts]
kraken-hive = "kraken.cli.main:main"
```

#### Task 4: Run Initial Tests
```bash
make install
make test  # Should run pytest on test files
```

### Phase 1B: Hive Integration (Today - March 30)

#### Task 5: Study Hive Extension Points
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
find . -name "*.py" -type f | xargs grep -l "class Judge\|def evaluate\|EventBus" | head -10
```

#### Task 6: Create Hive Integration Modules
Create these files in `src/kraken/integration/`:
1. `judge_extension.py` - Extends Hive Judge with Kraken validators
2. `event_bus_extension.py` - Extends Hive Event Bus with Nemotron
3. `reflexion_extension.py` - Extends Hive Reflexion with surgical debug

#### Task 7: Create Basic Examples
Create in `examples/`:
1. `anti_hallucination_demo.py` - Shows validators working
2. `hive_integration_demo.py` - Shows Hive + Kraken integration

### Phase 2: Component Porting (March 31 - April 1)

#### Task 8: Port Surgical Debug Protocol
Source: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/surgical-debug/`

Create in `src/kraken/debug/`:
1. `debug_agents.py` - Port of debug-agents.ts
2. `injector.py` - Port of injector.ts
3. `stagnation_detector.py` - Port of stagnation-detector.ts
4. `ultra_connector.py` - Port of ultra-connector.ts

#### Task 9: Port Nemotron Event Service
Source: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/`

Create in `src/kraken/nemotron/`:
1. `message_classifier.py` - Token classification (2k/4k/6k/8k)
2. `compression.py` - Message compression for large payloads
3. `token_metrics.py` - Token usage tracking

#### Task 10: Port Fragment System
Source: `/home/leviathan/OPENCODE_WORKSPACE/.shark/fragments/`

Create in `src/kraken/fragments/`:
1. `loader.py` - Load fragment files
2. `injector.py` - Inject fragments into agent context
3. `manager.py` - Manage fragment lifecycle

### Phase 3: Collaborator AI (April 2 - Optional)

#### Task 11: Clone and Explore (Optional)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/
git clone https://github.com/collaborator-ai/collab-public.git collaborator-ai || echo "Skipping - optional"
```

#### Task 12: Create Event Bridge (If Collaborator Installed)
Create: `src/kraken/integration/collaborator_bridge.py`

## Success Criteria

### **MUST COMPLETE TODAY (March 30):**
- [ ] Hive quickstart completed (bypass interactive prompt)
- [ ] Test suite for anti-hallucination validators (80%+ coverage)
- [ ] `kraken-hive` CLI command working with `--help`
- [ ] Basic Hive integration example running
- [ ] All 4 anti-hallucination validators passing tests

### **NICE TO HAVE:**
- [ ] Surgical debug protocol port started
- [ ] README documentation created
- [ ] Git repository initialized with commit
- [ ] Example demonstrating Hive + Kraken integration

## Error Handling Protocol

### If Hive quickstart fails:
```bash
# Fallback: Manual uv setup
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
rm -rf .venv
uv venv
source .venv/bin/activate
uv pip install -e .
```

### If tests fail:
1. Compare with original TypeScript tests
2. Check Python port logic matches TypeScript
3. Create minimal failing test case
4. Fix implementation, not tests

### If Hive integration unclear:
1. Examine Hive examples: `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/examples/templates/`
2. Look for Judge/EventBus/Reflexion usage patterns
3. Create simple proof-of-concept first

## Verification Commands

```bash
# After completion, these should work:
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine

# 1. CLI works
kraken-hive --help

# 2. Tests pass
make test

# 3. Hive integration demo works
python examples/anti_hallucination_demo.py

# 4. Imports work
python -c "from kraken.validators import MechanicalValidator; from kraken.integration import JudgeExtension; print('Imports OK')"
```

## Project Structure Reference

```
kraken-hive-engine/
├── src/kraken/
│   ├── __init__.py
│   ├── validators/           # ✅ COMPLETE
│   │   ├── mechanical_validator.py
│   │   ├── evidence_checker.py
│   │   ├── patterns.py
│   │   └── validator_hook.py
│   ├── debug/               # ❌ TODO
│   ├── nemotron/            # ❌ TODO
│   ├── fragments/           # ❌ TODO
│   └── integration/         # ❌ TODO
├── tests/                   # ❌ TODO
├── examples/               # ❌ TODO
├── docs/                   # ❌ TODO
├── pyproject.toml          # ✅ COMPLETE
└── Makefile               # ✅ COMPLETE
```

## Source Code References

### Kraken Ultra Components:
- **Anti-hallucination**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/anti-hallucination/`
- **Surgical debug**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/surgical-debug/`
- **Tests**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/tests/anti-hallucination.test.ts`

### Nemotron Service:
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/`

### Fragment System:
- `/home/leviathan/OPENCODE_WORKSPACE/.shark/fragments/`

## Integration Points with Hive

### 1. Anti-hallucination → Hive Judge
- Extend Hive Judge class with mechanical validation
- Add theatrical code pattern detection
- Integrate evidence checking pipeline

### 2. Surgical Debug → Hive Reflexion Loop
- Map debug injection to REPLAN/ESCALATE paths
- Integrate stagnation detection with retry mechanisms
- Create debug agent factory for Hive sub-agents

### 3. Nemotron → Hive Event Bus
- Wrap Event Bus with message classification
- Add token counting and size-based routing
- Implement compression for large messages

### 4. Fragments → Hive Node Configuration
- Convert fragment files to Hive node config format
- Create fragment loader for agent initialization
- Integrate with Hive node configuration system

## Deliverable

When complete, provide:
1. Confirmation of Phase 1 completion
2. Command to launch integrated system: `kraken-hive start`
3. Test coverage report
4. List of remaining work for Phase 2

---
**Last Updated**: March 30, 2026  
**Next Review**: After Phase 1 completion  
**Status**: Ready for Execution