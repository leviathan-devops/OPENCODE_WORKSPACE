# GLM Usage Meter - Build Plan & Implementation

## What was built

A real-time usage quota meter for the OpenCode CLI TUI that tracks GLM Coding Plan consumption against the 5-hour rolling and weekly windows.

## Files Created

### Backend
1. **`src/session/usage.ts`** - Usage tracker service
   - Tracks weighted prompt costs per provider (peak/off-peak multiplier)
   - Persists to SQLite via Drizzle ORM
   - Publishes `usage.updated` Bus events for real-time SSE propagation
   - Auto-evicts entries older than 7 days
   - Plan detection: manual config + auto-detect from Z.AI API

2. **`src/session/usage.sql.ts`** - Database schema
   - `usage_event` table: stores each prompt with weighted cost, peak flag, timestamps
   - `usage_config` table: stores plan tier per provider, limits, weekly reset time

3. **`migration/20260329200000_add_usage_tables/migration.sql`** - Database migration

4. **`src/server/routes/usage.ts`** - HTTP API endpoint
   - `GET /usage` - returns current usage state for all providers
   - `PUT /usage/plan` - sets plan tier manually

### Frontend (TUI)
5. **`src/cli/cmd/tui/component/quota-bar.tsx`** - Reusable bar graph component
   - Unicode block characters (▓░) with color coding
   - Green <50%, Yellow 50-80%, Red >80%
   - Compact (header) and detailed (sidebar) modes

6. **`src/cli/cmd/tui/routes/session/header.tsx`** (modified)
   - Added `<QuotaInfo />` next to context/cost display
   - Shows compact 5h rolling window bar with percentage

7. **`src/cli/cmd/tui/routes/session/sidebar.tsx`** (modified)
   - Added Quota panel between Context and MCP sections
   - Shows both 5h rolling and weekly bars with counts
   - Displays plan tier

8. **`src/cli/cmd/tui/routes/session/footer.tsx`** (modified)
   - Added colored quota indicator dot next to LSP/MCP status

### Integration Points
9. **`src/session/processor.ts`** (modified)
   - Hooked `Usage.track()` after `finish-step` event in LLM stream processing
   - Tracks providerID, modelID, sessionID on every completed LLM call

10. **`src/cli/cmd/tui/context/sync.tsx`** (modified)
    - Added `usage` to the sync store
    - Handles `usage.updated` SSE events for cross-terminal sync

11. **`src/server/server.ts`** (modified)
    - Registered `/usage` route

## Cross-Terminal Sync Architecture

```
Terminal 1 (TUI) ──SSE──→ OpenCode Server ──Bus──→ SQLite DB
Terminal 2 (TUI) ──SSE──→ (same instance)  ──Bus──→ (same DB)
Terminal 3 (TUI) ──SSE──→                  ──Bus──→
```

All terminals connect to the **same server process** (singleton per project). When any terminal triggers an LLM call:
1. `processor.ts` calls `Usage.track()` 
2. `Usage.track()` writes to shared SQLite DB
3. `Usage.track()` publishes `usage.updated` via Bus
4. Bus event flows through SSE to ALL connected terminals
5. Each terminal's `sync.tsx` updates its local SolidJS store
6. UI re-renders the quota bars reactively

## Quota Multipliers (Z.AI)

| Model | Peak (10am-2pm Tbilisi) | Off-Peak |
|-------|-------------------------|----------|
| glm-4.7, glm-4.6, etc | 1x | 1x |
| glm-5, glm-5.1, glm-5-turbo | 3x | 1x (promo April) |

## Plan Tiers

| Plan | 5h Limit | Weekly Limit |
|------|----------|--------------|
| Lite | 80 | 400 |
| Pro | 400 | 2,000 |
| Max | 1,600 | 8,000 |

## Next Steps

1. Run `bun run db:generate --name add_usage_tables` to regenerate Drizzle snapshot
2. Run full test suite: `bun test`
3. Build: `bun run build`
4. Test manually: launch opencode, make LLM calls, verify quota bars update
5. Configure plan: `PUT /usage/plan` with `{"providerID": "0-glm-coding", "plan": "pro"}`
6. (Optional) Add Z.AI API polling for authoritative usage data
