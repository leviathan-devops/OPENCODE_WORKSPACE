# Test Project Ready — Physiolab

**Status:** ✅ READY  
**Location:** `/tmp/hermes-test-project`  
**Created:** April 4, 2026  
**Note:** GitHub clone unavailable — created as synthetic project

---

## Project Overview

`physiolab` is a synthetic multi-module physiological data processing platform designed to test the Hermes Agent v2.1 integration with OpenCode. It contains multiple programming languages, intentional bugs, TODOs, and complexity hotspots.

---

## File Structure

```
/tmp/hermes-test-project/
├── README.md                          # Main documentation
├── TODO.md                            # Incomplete features (15+ items)
├── KNOWN_BUGS.md                      # Intentional bugs (8 bugs)
├── package.json                       # Node.js/TypeScript project
├── requirements.txt                   # Python dependencies
├── docs/
│   └── ARCHITECTURE.md                # System architecture docs
├── src/
│   ├── api/
│   │   ├── routes.ts                  # REST API (contains BUG-002, BUG-003, BUG-006)
│   │   └── handlers.ts                # API handlers (contains BUG-007, BUG-008)
│   ├── core/
│   │   └── processor.py               # Data processor (contains BUG-001, BUG-005)
│   ├── utils/
│   │   ├── validators.ts              # Input validation (TODO: needs tests)
│   │   └── db.py                      # Database utils (contains BUG-003 SQL injection)
│   └── web/
│       └── components/
│           └── Dashboard.tsx           # React dashboard (contains BUG-004)
└── tests/
    └── test_processor.py              # Unit tests
```

---

## Intentional Bugs for Testing

| Bug ID | File | Type | Severity | Description |
|--------|------|------|----------|-------------|
| BUG-001 | processor.py:142 | Memory | Critical | Array not freed - memory leak |
| BUG-002 | routes.ts | Race | Critical | Session data race condition |
| BUG-003 | db.py, routes.ts | Security | High | SQL injection vulnerability |
| BUG-004 | Dashboard.tsx | Crash | High | Missing null check causes crash |
| BUG-005 | processor.py | Performance | Medium | O(n²) algorithm - should be O(n log n) |
| BUG-006 | routes.ts | Logic | Medium | Returns 200 for non-existent resources |
| BUG-007 | handlers.ts | String | Low | Typo: "Unabel" instead of "Unable" |
| BUG-008 | handlers.ts:67 | Async | Low | Missing await in async call |

---

## Code Quality Issues

| Issue | File | Tool to Detect |
|-------|------|---------------|
| SQL Injection | utils/db.py, routes.ts | sast_scan |
| Missing Input Validation | routes.ts | lint |
| TypeScript Type Errors | web/components/* | tsc |
| Complexity Hotspot | processor.py (filter_signal) | complexity_hotspots |
| Hardcoded Secrets | (none in this project) | secret_scan |

---

## TODO Items for Testing

The project contains 15+ incomplete features for testing:

1. WebSocket support (high priority)
2. Authentication middleware (high priority)
3. Database connection pooling (high priority)
4. Signal filtering algorithm completion (high priority)
5. Unit tests for validators.ts (medium)
6. Cache invalidation (medium)
7. Logging in error handlers (medium)
8. OpenAPI documentation (medium)
9. TypeScript types for API (low)
10. Retry logic (low)
11. Health check endpoint (low)
12. Docker Compose (low)
13. ML model integration (future)
14. Multi-tenant support (future)
15. Real-time collaboration (future)

---

## Modules and Dependencies

### API Module (TypeScript/Node.js)
- **Framework:** Express
- **Files:** routes.ts, handlers.ts
- **Dependencies:** express, react

### Core Module (Python)
- **Libraries:** numpy, psycopg2
- **Files:** processor.py
- **Purpose:** Signal processing and analysis

### Utils Module (TypeScript + Python)
- **TS:** validators.ts, config.ts
- **Python:** db.py
- **Purpose:** Shared utilities

### Web Module (TypeScript/React)
- **Framework:** React
- **Files:** Dashboard.tsx
- **Purpose:** User interface

---

## Verification Commands

```bash
# Verify project exists
ls -la /tmp/hermes-test-project/

# Verify key files
head -20 /tmp/hermes-test-project/README.md
head -20 /tmp/hermes-test-project/src/api/routes.ts

# Count files
find /tmp/hermes-test-project -type f | wc -l

# Check for bugs (grep for TODO markers)
grep -r "TODO" /tmp/hermes-test-project/src/ | wc -l
grep -r "BUG-" /tmp/hermes-test-project/ | wc -l
```

---

## Expected Test Results

### Hallucination Detection
- `grill` should flag references to non-existent API endpoints
- `evidence_check` should verify claims against source code

### Code Quality
- `lint` should find issues in routes.ts (missing validation)
- `sast_scan` should find SQL injection in db.py and routes.ts
- `complexity_hotspots` should flag the O(n²) filter_signal function

### Context Tools
- `extract_code_blocks` should correctly parse TypeScript and Python
- `imports` should resolve express, numpy, react imports
- `symbols` should find all class and function definitions

---

## Test Data Characteristics

| Characteristic | Value |
|----------------|-------|
| Total Files | ~15 |
| TypeScript Files | 5 |
| Python Files | 2 |
| Documentation Files | 3 |
| Lines of Code | ~800 |
| Intentional Bugs | 8 |
| TODO Items | 15+ |
| Security Issues | 1 (SQL injection) |
| Complexity Hotspots | 1 (O(n²) algorithm) |

---

## Notes

- GitHub clone was unavailable during test package creation
- Project was created as a comprehensive synthetic alternative
- All characteristics of a real complex project are present
- All bugs, TODOs, and complexity hotspots are intentional and documented

---

**END OF TEST PROJECT READY**
