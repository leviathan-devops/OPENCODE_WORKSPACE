# CANONICAL T2: Omnicoder Debug

**Session ID:** ses_2bc277482ffeWjII6bFdVbef2P
**Category:** gold_standard
**Timeline:** 2026-03-31T16:22:38.205000 → 2026-03-31T17:02:01.292000
**Duration:** 39.4 minutes (0.7 hours)
**Messages:** 82
**Parts:** 357
**Directory:** /home/leviathan
**Parent:** None

---

## SESSION OVERVIEW

Omnicoder Debug — a 39-minute session with 82 messages and 357 parts.

---

## TOOL USAGE

| Tool | Calls |
|------|-------|
| bash | 67 |
| read | 12 |
| grep | 7 |
| glob | 6 |
| write | 1 |

---

## KEY ACTIONS

1. bash: rm -rf /home/leviathan/opendev-setup /home/leviathan/opendev && echo "Deleted opendev directories"
2. bash: rm -f /home/leviathan/.config/opencode/opencode-ultra.json /home/leviathan/.config/opencode/opencode-ultra.json.backup.s
3. bash: curl -s http://localhost:8000/v1/models/omnicoder-9b-q4_k_m.gguf | python3 -c "import sys,json; d=json.load(sys.stdin); 
4. bash: python3 -c "
with open('/home/leviathan/llama.cpp/models/templates/Qwen3.5-4B.jinja', 'r') as f:
    for i, line in enum
5. bash: python3 -c "
with open('/home/leviathan/llama.cpp/models/templates/Qwen3.5-4B.jinja', 'r') as f:
    for i, line in enum
6. bash: python3 -c "
with open('/home/leviathan/llama.cpp/models/templates/Qwen3.5-4B.jinja', 'r') as f:
    content = f.read()

7. bash: curl -s -X POST http://localhost:3013/api/tasks \
  -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
  -H "
8. bash: curl -s http://localhost:3013/api/tasks/schema \
  -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" 2>&1 | py
9. bash: curl -s http://localhost:8000/v1/models | python3 -c "import sys,json; d=json.load(sys.stdin); print('Context:', d['data
10. bash: curl -s http://localhost:8000/v1/models | python3 -c "import sys,json; d=json.load(sys.stdin); m=d['data'][0]; print(f\"
11. write: /home/leviathan/.hermes/context_length_cache.yaml
12. bash: cat /home/leviathan/.hermes/sessions/session_20260331_170016_81f8d0.json | python3 -c "
import sys, json
d = json.load(s
13. bash: cat /home/leviathan/.hermes/sessions/session_20260331_170016_81f8d0.json | python3 -c "
import sys, json
d = json.load(s
14. bash: rm /home/leviathan/.hermes/context_length_cache.yaml && hermes status 2>&1 | head -10

---

## BREAKTHROUGHS

1. Heavy bash usage (67 calls) — extensive system interaction and testing

---

## SEMANTIC TOKENS

bash, debug, glob, gold_standard, grep, omnicoder, read, write
