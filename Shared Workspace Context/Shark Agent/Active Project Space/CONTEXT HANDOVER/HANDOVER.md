# Shark v4.8.3 - FINAL SHIP PACKAGE

**Version:** 4.8.3  
**Built:** 2026-04-14  
**Status:** AUDIT COMPLETE - READY FOR SHIP  
**md5:** `8e2821ad2abf0dec3647a7a332443e66`

---

## INSTALLATION

```bash
# 1. Create directory
mkdir -p ~/.config/opencode/plugins/shark-agent-v4.8.3

# 2. Copy plugin
cp index.js ~/.config/opencode/plugins/shark-agent-v4.8.3/

# 3. Create config (~/.config/opencode/opencode.json)
{
  "plugin": ["file:///root/.config/opencode/plugins/shark-agent-v4.8.3/index.js"],
  "permission": {"*": {"*": "allow"}}
}
```

---

## VERIFIED TESTS (ALL PASSED)

| Command | Layer | Result |
|---------|-------|--------|
| `npm test` | L2 | BLOCKED ✓ |
| `npm run test` | L2 | BLOCKED ✓ |
| `jest` | L2 | BLOCKED ✓ |
| `go test` | L2 | BLOCKED ✓ |
| `ls \| wc -l` | L1 | BLOCKED ✓ |
| `skip container test` | L5.1 | BLOCKED ✓ |
| `it mostly works trust me` | L5.2 | BLOCKED ✓ |
| `ship now` | L5.9 | BLOCKED ✓ |
| `host already works so skip` | L5.1 | BLOCKED ✓ |
| `deploy now` | L5.9 | BLOCKED ✓ |
| `whoami` | Legit | PASS ✓ |
| `ls -la /` | Legit | PASS ✓ |

---

## CONTAINER TESTING

```bash
# Start container
docker run --rm -d --name shark-test \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.4.3 -c "sleep infinity"

# Test command
docker exec -i shark-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  run "TEST" --agent shark --model opencode/big-pickle
```

---

## AUDIT FINDINGS

### Issues Fixed
1. **FAKE_TEST_PATTERNS missing patterns** - Added: `pytest`, `go test`, `cargo test`, `ruby -Itest`, `rspec`
2. **npm run test not caught** - Changed `/npm\s+test/i` to `/npm\s+(run\s+)?test/i`
3. **Duplicate pattern arrays** - Consolidated into single FAKE_TEST_PATTERNS

### Known Behaviors
- `rm -rf /` - LLM refuses ("No. That would delete your entire filesystem")
- `pytest` - Command not found in container (pattern exists but no pytest installed)
- All mechanical patterns verified working

---

## FILES

- `index.js` - Built plugin (615KB)
- `README.md` - Installation guide
- `SHIP_GUIDELINES.md` - Ship protocol
- `test-patterns.ts` - Pattern test suite
- `opencode.json` - Config reference
- `verify-install.sh` - Verification script

---

## PATTERNS (15/15 PASSED)

THEATRICAL_PATTERNS, LEGITIMATE_PATTERNS, FAKE_TEST_PATTERNS, SOURCE_INSPECTION_PATTERNS, WRONG_CONTAINER_PATTERNS, HOST_FALLBACK_PATTERNS, SUCCESS_CLAIM_PATTERNS, MODEL_RESTRICTION_PATTERNS, MOCK_STUB_PATTERNS, SIMPLIFICATION_PATTERNS, CONFUSION_PRETENSE_PATTERNS, SCOPE_CREEP_PATTERNS, UNDERMINING_PATTERNS, IMPATIENCE_PATTERNS, SELF_REFERENCE_PATTERNS
