# Guardian Test Report

**Total Tests**: 13
**Passed**: 12
**Failed**: 1
**Success Rate**: 92.3%

## Test Results

- [x] Zone classification for /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/engineer-1/test.txt
- [ ] Zone classification for /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/engineer-1/.sandbox/test.txt - Expected sandbox, got workspace
- [x] Zone classification for /etc/passwd
- [x] Zone classification for /bin/bash
- [x] Zone classification for /home/leviathan/OPENCODE_WORKSPACE/Projects/test.txt
- [x] Workspace file write allowed
- [x] System file write blocked
- [x] Workspace file read allowed
- [x] System file read blocked
- [x] Workspace file delete allowed
- [x] System file delete blocked
- [x] Audit log captures operations - Found 3 entries
- [x] File info returns correct zone - Zone: workspace, Can modify: true

## Audit Log

1. [2026-03-26T00:15:32.900Z] WRITE /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/engineer-1/audit-test.txt - allow
2. [2026-03-26T00:15:32.900Z] READ /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/engineer-1/audit-test.txt - allow
3. [2026-03-26T00:15:32.900Z] DELETE /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/engineer-1/audit-test.txt - allow
4. [2026-03-26T00:15:32.900Z] WRITE /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/engineer-1/info-test.txt - allow