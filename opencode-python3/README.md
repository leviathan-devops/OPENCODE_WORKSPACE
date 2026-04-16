# OpenCode Python3 Enabled Image

## Overview

Custom OpenCode image with Python 3.12 pre-installed for Kraken v2.0 agent container spawning.

## Image Details

| Property | Value |
|----------|-------|
| **Base Image** | `ghcr.io/anomalyco/opencode:latest` (Alpine Linux 3.23) |
| **Python Version** | 3.12.13 |
| **pip Version** | 25.1.1 |
| **Image Size** | ~782 MB |
| **Tags** | `opencode-python3:latest`, `opencode:python3-enabled-1.4.3`, `leviathan/opencode:python3-enabled-1.4.3` |

## Why This Image?

Kraken v2.0 uses Python-based Docker wrapper scripts (`opencode_agent.py`, `container_pool.py`) to spawn sub-agent containers. The official OpenCode image doesn't include Python, so this custom image provides:

1. **Python 3.12** - For running wrapper scripts
2. **pip** - For installing Python packages if needed
3. **build-base** - For compiling any Python packages with C extensions

## Usage in Kraken v2.0

### OpenCode Configuration

Update `~/.config/opencode/opencode.json` to use the Python3-enabled image:

```json
{
  "container": {
    "image": "opencode-python3:latest"
  }
}
```

Or when spawning subagents directly:

```json
{
  "container": {
    "image": "leviathan/opencode:python3-enabled-1.4.3"
  }
}
```

### ClusterInstance.ts Integration

With Python3 in the container, `ClusterInstance.ts` can now use direct `spawn()` calls:

```typescript
// Instead of HTTP daemon approach:
const proc = spawn('python3', [
  wrapperPath,
  '--task', request.task,
  '--model', request.model,
  '--workspace', workspacePath,
  '--timeout', timeout.toString()
]);
```

## Rebuilding the Image

If you need to rebuild this image:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/opencode-python3
docker build -t opencode-python3:latest -t opencode:python3-enabled-1.4.3 -t leviathan/opencode:python3-enabled-1.4.3 .
```

## Verification

Test Python3 availability:

```bash
docker run --rm opencode-python3:latest --entrypoint /bin/sh -c "python3 --version"
# Expected: Python 3.12.13
```

Test OpenCode still works:

```bash
docker run --rm opencode-python3:latest opencode --version
# Expected: 1.4.3
```

## Files

- `Dockerfile` - Build specification
- `README.md` - This documentation

## Maintenance

| Date | Action |
|------|--------|
| 2026-04-13 | Initial build with Python 3.12.13 |

## Notes

- Docker CLI is NOT available inside the container (expected)
- Container spawning uses host Docker socket via wrapper scripts
- The Alpine Linux base provides minimal attack surface
