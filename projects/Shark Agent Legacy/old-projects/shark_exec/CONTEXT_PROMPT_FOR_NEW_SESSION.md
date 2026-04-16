# 🦈 CONTEXT PROMPT FOR LOCAL HERMES SESSION

## **SWITCH TO NEW TERMINAL AND PASTE THIS:**

```
I am Hermes Agent running 100% locally with dual-brain architecture. 

## SYSTEM STATUS:
- ✅ Dual-brain system verified: Qwen 2.5 Coder 7B + DeepSeek Coder 6.7B
- ✅ Hardware integration confirmed: Asus keyboard RGB control working
- ✅ Architecture: Qwen for design/architecture, DeepSeek for debugging/code
- ✅ 12GB VRAM optimized: Models can run simultaneously or swap as needed
- ✅ Safety systems: Dangerous commands blocked, root access controlled

## CURRENT PROJECT: Leviathan Cloud Phase 2
- Building autonomous AI DevOps with 99% cost reduction
- Chinese tech stack only (no Western AI models)
- Discord bot for PDF ingestion (30+ PDFs uploaded)
- SHARK agent operational in /home/leviathan/shark/

## IMMEDIATE TASKS:
1. **Verify local model access** - Test that I'm using local Qwen/DeepSeek not API
2. **Check vLLM/TGI status** - Ensure no output truncation issues
3. **Test keyboard control** - Run the dual-brain hardware test again
4. **Setup Discord integration** - Add async-safe Discord bot to SHARK agent
5. **PDF processing pipeline** - Connect Discord PDFs to memory system

## CRITICAL CONSTRAINTS:
- **NO API CALLS** - Must use 100% local models only
- **NO output truncation** - Use streaming/32K context
- **Async-safe Discord** - No blocking calls in bot handlers
- **VRAM management** - 12GB limit, smart model loading

## VERIFICATION COMMANDS:
Run these to confirm local operation:
1. `curl http://localhost:11434/api/tags` - Check Ollama models
2. `sudo python3 /home/leviathan/shark/instant_test.py` - Test hardware
3. `cd /home/leviathan/shark && python3 shark_agent.py` - Start SHARK

## YOUR FIRST ACTION:
Run the hardware verification test to confirm both AI brains have system access, then proceed with Discord bot setup for PDF ingestion.
```

## **AFTER PASTING, RUN THESE COMMANDS:**

```bash
# 1. Check current Hermes config
cat ~/.hermes/config.yaml | head -20

# 2. Test local model access
curl -s http://localhost:11434/api/tags | python3 -c "import json,sys; data=json.load(sys.stdin); print(f'Models: {len(data[\"models\"])}'); [print(f'  - {m[\"name\"]}') for m in data['models']]"

# 3. Run hardware verification
sudo python3 /home/leviathan/shark/instant_test.py

# 4. Start SHARK agent
cd /home/leviathan/shark && python3 shark_agent.py
```

## **EXPECTED OUTPUT:**
1. Hermes config should show local endpoints (localhost:11434)
2. Should see Qwen 2.5 Coder 7B and DeepSeek Coder 6.7B models
3. Keyboard should flash for QWEN and DEEPSEEK tests
4. SHARK agent should start with dual-brain routing

## **IF ISSUES:**
- If models not found: `sudo systemctl start ollama`
- If keyboard not working: Check `/sys/class/leds/asus::kbd_backlight`
- If Hermes still using API: Replace config with `/home/leviathan/.hermes/config_100_local.yaml`

## **NEXT AFTER VERIFICATION:**
1. Setup Discord bot token: `export DISCORD_BOT_TOKEN="your_token"`
2. Add Discord integration to SHARK agent
3. Process 30+ PDFs from Discord #general channel
4. Build PDF-to-memory pipeline

**Proceed with hardware verification first, then Discord integration.**