# Testing Shark Agent Plugin in Vanilla OpenCode

## Prerequisites
- OpenCode 1.2.0+ (vanilla, no opencode-ultra)
- API keys provided

## Setup

1. **Set environment variables**:
   ```bash
export DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
export GLM_API_KEY=${GLM_API_KEY}
   ```

2. **Install plugin in OpenCode workspace**:
   ```bash
   cd /path/to/your/opencode/workspace
   npm install /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
   ```

3. **Start OpenCode**:
   ```bash
   opencode
   ```

## Expected Behavior

When you start a fresh OpenCode session:

1. **Plugin loads automatically**
   - Console output: "🦈 Shark Agent Plugin loading..."

2. **Wizard launches immediately**
   - Returns default Micro mode (for now)
   - Session-only configuration (no disk persistence)

3. **Plugin initializes**:
   - Safety stack activated
   - Coordinator initialized
   - API keys configured
   - Brain status displayed

4. **Ready to use**:
   - All tools protected by Guardian
   - Brain switching available via `shark_toggle` tool
   - Session-only configuration (no persistence)

## Verification Checklist

- [ ] Plugin loads without errors
- [ ] Wizard appears on fresh session
- [ ] Mode selection works
- [ ] Brain status shows (Planning: ✓, Execution: ✓)
- [ ] Safety stack blocks dangerous operations
- [ ] API calls succeed (check console logs)
- [ ] Fallback to vLLM works if APIs fail

## Troubleshooting

**Plugin doesn't load**:
- Check OpenCode version (must be 1.2.0+)
- Verify no opencode-ultra dependency
- Check console for errors

**Wizard doesn't appear**:
- Ensure it's a fresh session (not continued)
- Check sessionID is unique

**API calls fail**:
- Verify environment variables are set
- Check API keys are valid
- Review console logs for specific errors

**Safety stack blocks safe operations**:
- Check Guardian configuration
- Review workspacePath is correct
- Check skipFirewalls setting

## Success Criteria

✅ Plugin loads in vanilla OpenCode
✅ Wizard launches on fresh session
✅ Mode selection works
✅ API calls succeed
✅ Safety stack functions
✅ Brain switching works
✅ Zero opencode-ultra dependencies