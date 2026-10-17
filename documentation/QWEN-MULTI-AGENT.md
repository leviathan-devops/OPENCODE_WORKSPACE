# 🚀 Qwen Multi-Agent Setup

## Three Commands - Three Backends

| Command | Backend | Model | Context | Best For |
|---------|---------|-------|---------|----------|
| `qwen-free --yolo` | Alibaba OAuth | coder-model | 100K+ | **Complex tasks**, heavy context |
| `qwen-local --yolo` | Local llama.cpp | Qwen3.5-9B | 8K | Quick tasks, private code |
| `qwen-deepseek --yolo` | DeepSeek API | deepseek-chat | 100K+ | High-quality reasoning |

---

## ⚠️ Important: qwen-local Context Limit

**qwen-local has an 8K token context limit.** Qwen Code sends ~11K tokens base overhead (system prompts + tool definitions), which exceeds this limit.

### Workaround Options:

1. **Use qwen-free for complex tasks:**
   ```bash
   qwen-free --yolo  # Unlimited cloud context
   ```

2. **Use qwen-local for simple API testing:**
   ```bash
   # Direct API test (bypasses Qwen Code overhead)
   curl http://localhost:8000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <REDACTED_SET_VIA_ENV>" \
     -d '{"messages":[{"role":"user","content":"hi"}],"max_tokens":100}'
   ```

3. **Use alternative clients with llama.cpp:**
   - llama.cpp web UI: http://localhost:8000
   - Custom scripts using OpenAI-compatible API

---

## Quick Start

### For Complex Tasks (Recommended):
```bash
qwen-free --yolo    # Alibaba OAuth - unlimited context
```

### For Local/Private Tasks:
```bash
qwen-local --yolo   # May hit context limit on complex requests
```

### For High-Quality Reasoning:
```bash
qwen-deepseek --yolo   # DeepSeek API
```

---

## Multi-Agent Workflow

### Terminal 1 - Free Cloud (Complex Tasks):
```bash
qwen-free --yolo
```

### Terminal 2 - Local (Quick Tests):
```bash
qwen-local --yolo
```

---

## Local Server Management

```bash
# Status
sudo systemctl status llama-qwen35

# Restart
sudo systemctl restart llama-qwen35

# Logs
sudo journalctl -u llama-qwen35 -f

# Health check
curl http://localhost:8000/health
```

---

## Shortcuts (~/.bash_aliases)

```bash
qa-free     # = qwen-free --yolo
qa-local    # = qwen-local --yolo
qa-deepseek # = qwen-deepseek --yolo
qa-status   # Check local server
qa-logs     # View server logs
qa-restart  # Restart local server
```

---

## Technical Details

### qwen-local (Qwen3.5-9B)
- **Context**: 8192 tokens (1 slot)
- **VRAM**: ~5.7GB
- **Speed**: Fast (GPU accelerated)
- **Privacy**: 100% local
- **Limitation**: Qwen Code's 11K base overhead exceeds 8K context

### qwen-free (Alibaba OAuth)
- **Context**: 100K+ tokens
- **Rate Limits**: Free tier applies
- **Privacy**: Cloud-based
- **Best for**: Complex coding tasks

### qwen-deepseek (DeepSeek API)
- **Context**: 100K+ tokens
- **Quality**: Highest
- **Privacy**: Cloud-based
- **Cost**: Paid API

---

## Troubleshooting

### qwen-local context error:
```
[API Error: 400 request (11157 tokens) exceeds the available context size (8192 tokens)]
```
**Solution**: Use `qwen-free --yolo` for complex tasks. qwen-local is best for simple API access or alternative clients.

### Local server not responding:
```bash
qa-status    # Check status
qa-restart   # Restart server
qa-logs      # View logs
```

---

**Scripts**: `/home/leviathan/qwen-*`
**Symlinks**: `/usr/local/bin/qwen-*`
**Documentation**: `/home/leviathan/QWEN-MULTI-AGENT.md`
