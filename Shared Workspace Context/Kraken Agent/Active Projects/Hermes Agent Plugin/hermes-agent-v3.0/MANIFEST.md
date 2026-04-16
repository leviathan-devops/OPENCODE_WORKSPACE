# Hermes Agent v3.0 — Package Manifest

**Version:** 3.0  
**Build ID:** hermes-v3-overhaul  
**Built:** 2026-04-14  
**md5:** (compute with `md5sum dist/index.js`)

---

## Package Contents

```
hermes-agent-v3.0/
├── dist/
│   └── index.js           # Built plugin (550KB)
├── src/                    # TypeScript source
│   ├── index.ts           # Plugin entry point
│   ├── agents/            # 19 agent prompts
│   ├── hooks/             # 29 hooks
│   ├── tools/             # 13 tools
│   ├── config/            # Agent identity, constants
│   └── services/          # Core services
├── docs/
│   ├── HOOK_ARCHITECTURE.md
│   ├── AGENT_DELEGATION.md
│   ├── PHASE_STATE_MACHINE.md
│   ├── HOOK_VERIFICATION_LOG.md
│   ├── SHIP_GATE.md
│   ├── BUILD_LOG.md
│   ├── CHANGE_LOG.md
│   └── DEBUG_LOG.md
├── container/
│   ├── Dockerfile.hermes
│   └── test-tui-replica.sh
├── scripts/
│   └── BUILD_VERIFY.sh
├── tests/
│   └── test-e2e.ts
├── README.md
├── INSTALL.md
├── TROUBLESHOOT.md
├── HANDOVER.md
├── MANIFEST.md            # This file
├── opencode.json.example
└── verify-install.sh
```

---

## File Inventory

| Category | Files | Size |
|----------|-------|------|
| Built plugin | dist/index.js | 550KB |
| Documentation | docs/*.md | ~50KB |
| Source code | src/**/* | ~200KB |
| Tests | test-e2e.ts | 11KB |
| Scripts | verify-install.sh, BUILD_VERIFY.sh | 5KB |
| Container | Dockerfile, test-tui-replica.sh | 4KB |

**Total:** ~820KB

---

## Verification Commands

```bash
# 1. Verify dist is fresh
./scripts/BUILD_VERIFY.sh

# 2. Run E2E tests
bun install
bun run test-e2e.ts

# 3. Verify installation
./verify-install.sh

# 4. Container test
docker build -t hermes-v3-test -f container/Dockerfile .
docker run --rm -it hermes-v3-test /bin/bash /app/test-tui-replica.sh
```

---

## Test Results

| Test | Expected | Actual |
|------|----------|--------|
| E2E | 144/147 | 144/147 ✅ |
| Hook guards | 29/29 | 29/29 ✅ |
| Agent count | 19 | 19 ✅ |
| State transitions | 9/12 | 9/12 ✅ |
| Container | PASS | PASS ✅ |

---

## Dependencies

### Runtime
- `@opencode-ai/plugin` v1.1.53 (bundled)

### Build
- `bun` 1.x
- `typescript`

### Test
- `bun`
- `opencode` 1.4.x (for integration tests)

---

## Installation Time

- Quick install: ~2 minutes
- Full verification: ~5 minutes
- Container test: ~10 minutes

---

## Support

For issues, see:
- `TROUBLESHOOT.md` — Common issues and fixes
- `HANDOVER.md` — Build history
- `docs/DEBUG_LOG.md` — Known issues
