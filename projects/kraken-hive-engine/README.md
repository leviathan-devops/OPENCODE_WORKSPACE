# Kraken Hive

**Kraken Ultra integration for Hive framework** - Making Hive the UI/host platform with Kraken as the engine OS.

## Mission
Migrate Kraken Ultra components from OpenCode/TypeScript to Hive/Python platform, making Hive the host OS for Kraken Ultra engine with full integration.

## Current Status (March 30, 2026)

### ✅ COMPLETED:
1. **Anti-hallucination Validators**: 4 components ported to Python (639 lines)
2. **Build Infrastructure**: `pyproject.toml`, `Makefile`, virtual environment
3. **CLI Launcher**: `kraken-hive` command with multiple subcommands
4. **Test Suite**: Comprehensive tests for all validators
5. **Hive Integration**: `KrakenEnhancedJudge` for Hive Judge extension
6. **Demo Script**: `examples/anti_hallucination_demo.py`

### ❌ IN PROGRESS:
1. **Hive Quickstart**: Needs completion (interrupted at LLM provider selection)
2. **Remaining Components**: Surgical debug, Nemotron, fragments need porting
3. **Full Integration**: Complete Hive framework integration

## Quick Start

### 1. Install Dependencies
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine
make install
```

### 2. Run Tests
```bash
make test
# or
kraken-hive test
```

### 3. Validate Components
```bash
kraken-hive validate
```

### 4. Run Demo
```bash
kraken-hive demo
# or
python examples/anti_hallucination_demo.py
```

### 5. Check Status
```bash
kraken-hive status
```

## Project Structure

```
kraken-hive-engine/
├── src/kraken/
│   ├── __init__.py
│   ├── validators/           # ✅ COMPLETE
│   │   ├── mechanical_validator.py
│   │   ├── evidence_checker.py
│   │   ├── patterns.py
│   │   └── validator_hook.py
│   ├── cli/                  # ✅ COMPLETE
│   │   └── main.py
│   ├── integration/          # ✅ STARTED
│   │   ├── judge_extension.py
│   │   └── __init__.py
│   ├── debug/               # ❌ TODO
│   ├── nemotron/            # ❌ TODO
│   └── fragments/           # ❌ TODO
├── tests/validators/        # ✅ COMPLETE
│   ├── test_mechanical_validator.py
│   ├── test_evidence_checker.py
│   ├── test_patterns.py
│   └── test_validator_hook.py
├── examples/                # ✅ COMPLETE
│   └── anti_hallucination_demo.py
├── pyproject.toml          # ✅ COMPLETE
├── Makefile               # ✅ COMPLETE
├── NEXT_STEPS.md          # ✅ COMPLETE
├── KRAKEN_HIVE_CONTEXT.md # ✅ COMPLETE
└── HIVE_AGENT_CONTEXT.md  # ✅ COMPLETE
```

## Available Commands

### CLI Commands (`kraken-hive`)
- `start` - Launch Hive with Kraken integration (placeholder)
- `test` - Run integration tests
- `validate` - Validate Kraken components
- `check` - Check code for theatrical patterns
- `status` - Show Kraken Hive status
- `demo` - Run anti-hallucination demo

### Make Commands
- `make install` - Install dependencies
- `make test` - Run tests with coverage
- `make format` - Format code with black/ruff
- `make lint` - Lint code with ruff/mypy
- `make clean` - Clean build artifacts

## Integration Points

### 1. Anti-hallucination → Hive Judge
```python
from kraken.integration import KrakenEnhancedJudge

judge = KrakenEnhancedJudge()
result = judge.evaluate(agent_output, context)
if result["reject"]:
    print(f"Rejected: {result['reason']}")
```

### 2. Validators Available
```python
from kraken.validators import (
    MechanicalValidator,
    EvidenceChecker,
    PatternDetector,
    ValidatorHook
)

# Mechanical validation
validator = MechanicalValidator()
result = validator.validate_workflow_step("BUILD", code)

# Evidence checking
checker = EvidenceChecker()
result = checker.check(claim, context)

# Pattern detection
detector = PatternDetector()
patterns = detector.detect_theatrical(code)
```

## Next Steps

### Immediate (Phase 1):
1. Complete Hive quickstart installation
2. Test Hive + Kraken integration
3. Create more comprehensive examples

### Short-term (Phase 2):
1. Port surgical debug protocol
2. Port Nemotron event service
3. Port fragment injection system
4. Create full Hive integration modules

### Long-term (Phase 3):
1. Collaborator AI integration
2. Production deployment
3. Performance optimization
4. Comprehensive documentation

## Source References

### Kraken Ultra Components:
- **Anti-hallucination**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/anti-hallucination/`
- **Surgical debug**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/surgical-debug/`
- **Tests**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/tests/anti-hallucination.test.ts`

### Hive Framework:
- `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/`
- Examples: `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/examples/templates/`

## Development

### Setting Up Development Environment
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine
source .venv/bin/activate
pip install -e ".[dev]"
```

### Running Tests
```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/validators/test_mechanical_validator.py -v

# Run with coverage
pytest tests/ --cov=src/kraken --cov-report=term-missing
```

### Code Quality
```bash
# Format code
black src/ tests/ examples/

# Lint code
ruff check src/ tests/ examples/

# Type checking
mypy src/
```

## Context Files

For detailed information, see:
- `NEXT_STEPS.md` - Build plan and remaining tasks
- `KRAKEN_HIVE_CONTEXT.md` - Complete project context
- `HIVE_AGENT_CONTEXT.md` - Instructions for Hive agent execution

## Success Criteria

Phase 1 is complete when:
- [x] Anti-hallucination validators ported and tested
- [x] CLI launcher working (`kraken-hive --help`)
- [x] Basic Hive integration example
- [ ] Hive quickstart completed
- [ ] All tests passing (80%+ coverage)
- [ ] `kraken-hive start` provides actual launch instructions

## License

This project is part of the Kraken Ultra migration to Hive framework.

---
**Last Updated**: March 30, 2026  
**Status**: Phase 1 Foundation Complete  
**Next Phase**: Component Porting & Integration