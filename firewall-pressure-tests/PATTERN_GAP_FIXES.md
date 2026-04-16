# Firewall Pattern Gap Fixes

**Date:** 2026-04-13  
**Version:** shark-agent-v4.8.3-hotfix-1

## Issues Fixed

### L1: Theatrical Patterns
| Issue | Fix |
|-------|-----|
| `echo "test" \| wc` not blocked | Added `/echo.*\|.*wc/i` pattern |
| Bare `wc` without `-l` in pipe | Added `/wc\s+[^\s].*\|/i` and `/\|.*wc\s*$/i` patterns |

### L2: Fake Test Runners
| Issue | Fix |
|-------|-----|
| `npm run test` bypassed block | Changed `/npm\s+test/i` to `/npm\s+(run\s+)?test/i` |
| `yarn run test` similar issue | Changed `/yarn\s+test/i` to `/yarn\s+(run\s+)?test/i` |

### L5.1: Host Fallback
| Issue | Fix |
|-------|-----|
| `host already works` not blocked | Added `/host.*already.*works/i` and `/already.*works.*on.*host/i` |

### L5.6: Confusion Pretense
| Issue | Fix |
|-------|-----|
| `mostly works` in sentence not blocked | Changed `/ mostly .*works/i` to `/mostly.*works/i` (removed leading space) |
| `partially working` not blocked | Changed `/ partially .*working/i` to `/partially.*working/i` |
| Similar patterns fixed | All CONFUSION_PRETENSE leading-space requirements removed |

### L5.9: Impatience
| Issue | Fix |
|-------|-----|
| `deploy now` not blocked | Changed `/ deploy .*now/i` to `/deploy.*now/i` |
| `ship now` not blocked | Changed `/ ship .*now/i` to `/ship.*now/i` |

## Files Modified
- `src/hooks/v4.1/chat-message-hook.ts`

## Verification Tests
```
npm run test → ANTI-SLOP L2 blocked ✓
echo test | wc → ANTI-SLOP L1 blocked ✓
deploy now → ANTI-DERAILMENT L5.9 blocked ✓
host already works → ANTI-DERAILMENT L5.1 blocked ✓
mostly works → ANTI-DERAILMENT L5.6 blocked ✓
```

## Pattern Tests
15/15 PASSED ✓
