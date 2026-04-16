# Shark Agent v4.8.3 Ship Guidelines

## Pre-Ship Checklist

- [x] Pattern test suite: 15/15 PASSED
- [x] Legitimate commands work: `ls`, `whoami`, `pwd`
- [x] Blocked patterns intercepted: L1, L2, L5 (all layers verified)
- [x] Container testing verified (TUI mode)
- [x] Code builds without errors
- [x] UC1 fix applied (user messages not blocked)

## Ship Criteria

### MUST PASS
1. `opencode run "npm test"` → BLOCKED (L2)
2. `opencode run "skip container test"` → BLOCKED (L5.1)
3. `opencode run "ls | wc -l"` → BLOCKED (L1)
4. `opencode run "ship now"` → BLOCKED (L5.9)
5. `opencode run "ls -la /"` → PASSES (legitimate)
6. Pattern test suite → 15/15 PASSED

### Container Testing Protocol

**CRITICAL: ALL testing must happen in container**

```bash
# 1. Build plugin
cd /path/to/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin

# 2. Deploy to container
PLUGIN_DIR="/tmp/shark-container/plugins/shark-agent-v4.8.3"
mkdir -p $PLUGIN_DIR
cp dist/index.js $PLUGIN_DIR/

# 3. Start persistent container (if not running)
docker run --rm -d --name shark-test --entrypoint /bin/bash \
  -v /tmp/shark-container/config:/root/.config/opencode \
  -v $PLUGIN_DIR:/root/.config/opencode/plugins/shark-agent-v4.8.3 \
  opencode-test:1.4.3 -c "sleep infinity"

# 4. Test in container
docker exec -i shark-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  run "TEST_COMMAND" --agent shark --model opencode/big-pickle

# 5. Cleanup
docker kill shark-test
```

## Deployment Paths

### Local Development
```bash
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4.8.3/
# Edit ~/.config/opencode/opencode.json to add plugin
```

### Production Container
```bash
# Use the provided Dockerfile or deployment script
./deploy.sh --version 4.8.3 --target container
```

### Shared Workspace (Kraken)
```bash
cp dist/index.js /path/to/shared/workspace/plugins/shark-agent-v4.8.3/
```

## Version Naming

Format: `v{MAJOR}.{MINOR}.{PATCH}`

- **MAJOR**: Breaking changes to API or architecture
- **MINOR**: New features, pattern additions
- **PATCH**: Bug fixes, pattern refinements

Current: **4.8.3** - TUI firewall fix

## Rollback Protocol

If ship fails:

1. Revert to previous version: `cp shark-agent-v4.8.2/index.js ...`
2. Run pattern tests on previous version
3. Document failure in incident log
4. Fix and rebuild with `bun build`

## Post-Ship

1. Tag release in git: `git tag -a v4.8.3 -m "Ship v4.8.3 - TUI firewall fix"`
2. Update HANDOVER.md with new checkpoint
3. Archive previous version
4. Notify team of update

## Emergency Contacts

- Plugin Architecture: See `src/hooks/v4.1/`
- Firewall Logic: See `src/shared/guardian.ts`
- Agent State: See `src/hooks/v4.1/agent-state.ts`

## Known Limitations

1. TUI requires interactive terminal (`docker exec -it`)
2. `opencode run` works for testing but has different hook timing than TUI
3. Pattern matching is regex-based - may have edge cases

## Support

For issues, check:
1. Container logs: `docker logs YOUR_CONTAINER`
2. Plugin debug: Enable `console.log` in hook code
3. Pattern test: `bun run test-patterns.ts`
