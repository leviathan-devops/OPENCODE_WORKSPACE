# Hive Agent Context: Kraken Ultra Integration Task

## Task Assignment
You are a Hive agent tasked with completing the Kraken Ultra integration into the Hive framework. This is a multi-step build process that requires porting TypeScript components to Python and integrating them with Hive's core systems.

## Current Project State

### Location
- **Project Directory**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine`
- **Hive Framework**: `/home/leviathan/OPENCODE_WORKSPACE/projects/hive`
- **Kraken Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra`

### What's Already Done
1. ✅ Project structure created with `src/kraken/`, `tests/`, `examples/`
2. ✅ Anti-hallucination validators ported to Python (4 files, 639 lines)
3. ✅ Build configuration: `pyproject.toml` and `Makefile`
4. ✅ Dependencies installed: pydantic, websockets, aiohttp, click
5. ✅ Virtual environment: `.venv/` created with uv

### What's Missing (Critical)
1. ❌ Hive quickstart completion (interrupted at LLM provider selection)
2. ❌ Test files for ported validators
3. ❌ CLI launcher (`kraken-hive` command)
4. ❌ Hive integration modules
5. ❌ Remaining component ports (surgical debug, Nemotron, fragments)

## Immediate Actions Required

### Action 1: Complete Hive Installation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
echo "15" | ./quickstart.sh  # Select "Local (Ollama)" option
source .venv/bin/activate
./hive list  # Verify installation works
```

**If quickstart fails**, use fallback:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
rm -rf .venv
uv venv
source .venv/bin/activate
uv pip install -e .
```

### Action 2: Create Test Files
Create test files in `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine/tests/validators/`:

1. `test_mechanical_validator.py` - Test mechanical validation
2. `test_evidence_checker.py` - Test evidence checking
3. `test_patterns.py` - Test theatrical pattern detection
4. `test_validator_hook.py` - Test validator hooks

**Reference**: Use the TypeScript tests at `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/tests/anti-hallucination.test.ts`

### Action 3: Build CLI Launcher
Create `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine/src/kraken/cli/main.py`:

```python
import click
import subprocess
import sys
from pathlib import Path

@click.group()
def cli():
    """Kraken Hive - Integrated AI Agent Platform"""
    pass

@cli.command()
def start():
    """Launch Hive with Kraken Ultra integration"""
    click.echo("🚀 Starting Kraken Hive...")
    # TODO: Implement Hive launch with Kraken integration
    click.echo("Hive + Kraken integration starting...")

@cli.command()
def test():
    """Run integration tests"""
    subprocess.run([sys.executable, "-m", "pytest", "tests/", "-v"])

@cli.command()
def validate():
    """Validate Kraken components"""
    from kraken.validators import MechanicalValidator
    validator = MechanicalValidator()
    click.echo("✅ Kraken validators loaded successfully")

def main():
    cli()

if __name__ == "__main__":
    main()
```

Update `pyproject.toml`:
```toml
[project.scripts]
kraken-hive = "kraken.cli.main:main"
```

### Action 4: Create Hive Integration Modules
Create these integration files:

1. `src/kraken/integration/judge_extension.py`:
```python
"""
Extends Hive Judge with Kraken anti-hallucination validators.
"""
from typing import Any, Dict
from kraken.validators import MechanicalValidator, EvidenceChecker, PatternDetector

class KrakenEnhancedJudge:
    """Hive Judge enhanced with Kraken validation capabilities."""
    
    def __init__(self):
        self.mechanical_validator = MechanicalValidator()
        self.evidence_checker = EvidenceChecker()
        self.pattern_detector = PatternDetector()
    
    def evaluate(self, agent_output: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate agent output with Kraken validators."""
        # Mechanical validation
        mechanical_result = self.mechanical_validator.validate_workflow_step(
            "VALIDATE", agent_output
        )
        if not mechanical_result.passed:
            return {"reject": True, "reason": "Mechanical validation failed"}
        
        # Evidence checking
        evidence_result = self.evidence_checker.check(agent_output, context)
        if not evidence_result.sufficient:
            return {"reject": True, "reason": "Insufficient evidence"}
        
        # Pattern detection
        patterns = self.pattern_detector.detect_theatrical(agent_output)
        if patterns:
            return {"reject": True, "reason": f"Theatrical patterns: {patterns}"}
        
        return {"reject": False, "reason": "All validations passed"}
```

2. `src/kraken/integration/__init__.py`:
```python
"""
Kraken Hive integration modules.
"""
from .judge_extension import KrakenEnhancedJudge

__all__ = ["KrakenEnhancedJudge"]
```

### Action 5: Create Basic Example
Create `examples/anti_hallucination_demo.py`:

```python
"""
Demo of Kraken anti-hallucination validators integrated with Hive.
"""
import asyncio
from kraken.validators import MechanicalValidator, EvidenceChecker, PatternDetector
from kraken.integration import KrakenEnhancedJudge

async def main():
    print("🧪 Testing Kraken Hive Integration")
    
    # Test mechanical validator
    validator = MechanicalValidator()
    test_code = """
    function test() {
        // TODO: implement this
        return true;
    }
    """
    
    result = validator.validate_workflow_step("TEST", test_code)
    print(f"Mechanical validation: {'PASS' if result.passed else 'FAIL'}")
    if result.theatrical_patterns:
        print(f"Theatrical patterns: {result.theatrical_patterns}")
    
    # Test evidence checker
    checker = EvidenceChecker()
    claim = "The function processes user data securely"
    evidence = ["function encryptData()", "const security = require('crypto')"]
    
    has_evidence = checker.cross_validate(claim, evidence)
    print(f"Evidence validation: {'PASS' if has_evidence else 'FAIL'}")
    
    # Test pattern detector
    detector = PatternDetector()
    patterns = detector.detect_theatrical(test_code)
    print(f"Pattern detection: Found {len(patterns)} theatrical patterns")
    
    # Test integrated judge
    judge = KrakenEnhancedJudge()
    evaluation = judge.evaluate(test_code, {"context": "test"})
    print(f"Integrated judge evaluation: {evaluation}")
    
    print("✅ Demo complete")

if __name__ == "__main__":
    asyncio.run(main())
```

### Action 6: Run Initial Tests
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine
source .venv/bin/activate

# Install in development mode
pip install -e .

# Run tests
python -m pytest tests/ -v

# Test CLI
kraken-hive --help
kraken-hive validate

# Run demo
python examples/anti_hallucination_demo.py
```

## Component Porting Instructions

### Surgical Debug Protocol
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/surgical-debug/`

Files to port:
1. `debug-agents.ts` → `src/kraken/debug/debug_agents.py`
2. `injector.ts` → `src/kraken/debug/injector.py`
3. `stagnation-detector.ts` → `src/kraken/debug/stagnation_detector.py`
4. `ultra-connector.ts` → `src/kraken/debug/ultra_connector.py`

**Integration Point**: Hive Reflexion Loop (ACCEPT/RETRY/REPLAN/ESCALATE)

### Nemotron Event Service
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/`

Files to port:
1. `message-classifier.ts` → `src/kraken/nemotron/message_classifier.py`
2. `compression.ts` → `src/kraken/nemotron/compression.py`
3. `token-metrics.ts` → `src/kraken/nemotron/token_metrics.py`

**Integration Point**: Hive Event Bus with token classification (2k/4k/6k/8k)

### Fragment System
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/.shark/fragments/`

Files to create:
1. `src/kraken/fragments/loader.py` - Load fragment files
2. `src/kraken/fragments/injector.py` - Inject fragments into agent context
3. `src/kraken/fragments/manager.py` - Manage fragment lifecycle

**Integration Point**: Hive Node Configuration

## Hive Framework Study Points

Examine these Hive files to understand integration:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive

# Look for Judge implementation
find . -name "*.py" -type f | xargs grep -l "class Judge" | head -5

# Look for Event Bus
find . -name "*.py" -type f | xargs grep -l "class EventBus" | head -5

# Look for Reflexion Loop
find . -name "*.py" -type f | xargs grep -l "ReflexionLoop\|reflexion" | head -5

# Study example agents
ls examples/templates/
```

## Success Verification

After completing the immediate actions, verify with:

```bash
# 1. CLI works
kraken-hive --help
kraken-hive validate
kraken-hive test

# 2. Tests pass
python -m pytest tests/ -v --cov=src/kraken --cov-report=term-missing

# 3. Demo works
python examples/anti_hallucination_demo.py

# 4. Imports work
python -c "
from kraken.validators import MechanicalValidator
from kraken.integration import KrakenEnhancedJudge
print('✅ All imports successful')
"

# 5. Hive integration
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
source .venv/bin/activate
./hive list  # Should work without errors
```

## Error Recovery

### If Hive Import Fails:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
source .venv/bin/activate
python -c "import hive; print(hive.__file__)"  # Verify import
```

### If Tests Fail:
1. Compare with original TypeScript tests
2. Check Python logic matches TypeScript
3. Create minimal test case to isolate issue

### If CLI Doesn't Work:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine
pip install -e .  # Reinstall
which kraken-hive  # Should show path
```

## Next Steps After Immediate Actions

Once the immediate actions are complete:

1. **Port Surgical Debug Protocol** (Priority 2)
2. **Port Nemotron Event Service** (Priority 3)
3. **Port Fragment System** (Priority 4)
4. **Create Comprehensive Integration Tests**
5. **Build Production Launch System**

## Deliverable

When Phase 1 is complete, you should have:
1. ✅ Working `kraken-hive` CLI command
2. ✅ Test suite with 80%+ coverage
3. ✅ Basic Hive integration example
4. ✅ All anti-hallucination validators passing tests
5. ✅ Hive framework fully installed and working

Report completion with:
- Summary of what was accomplished
- Any issues encountered
- Next steps for Phase 2
- Command to launch the integrated system

---
**Task Assigned To**: Hive Agent  
**Priority**: High  
**Deadline**: Today (March 30, 2026)  
**Status**: Ready for Execution