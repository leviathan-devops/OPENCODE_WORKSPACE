/* ***********************************************************
 * MECHANICAL ENFORCEMENT (Non-Negotiable)
 * ***********************************************************
 *
 * [x] PLAN Gate Rules - IMPLEMENTED:
 *     - bash: DANGEROUS commands blocked (rm -rf /, dd, mkfs), NOT all bash
 *     - read: ALLOWED (agent reads existing files to understand codebase)
 *     - write: ALLOWED for NEW files ONLY (create plan docs, specs)
 *     - edit: ALLOWED for NEW files ONLY (edit what PLAN creates)
 *     - cp/duplicate: BLOCKED (cannot duplicate existing files)
 *     - Existing files: BLOCKED (60min grace period from mtime)
 *
 * [x] Guardian 60-Minute Grace Period - EXISTS from v4.7:
 *     - Files created < 60 minutes ago: can be edited
 *     - Files created > 60 minutes ago: BLOCKED (use cp first)
 *     - Applies to: edit, write, patch tools
 *
 * [ ] Precision Wall: Does NOT apply to .md/.json/.txt files - TODO
 *
 * [x] Gateway Checks: Algorithmic, not prompt-based - ENFORCED
 *
 * ***********************************************************
 * [ ] Precision Wall: Does NOT apply to .md/.json files
 * [ ] Gateway Checks: Algorithmic, not prompt-based
 *
 * ***********************************************************
 * CONTAINER TEST PROTOCOL (MANDATORY)
 * ***********************************************************
 *
 * [ ] Test 1: Vanilla build agent - ZERO interference
 *      Command: opencode --agent build --prompt "echo test"
 *      Expected: Works without any shark blocking
 *
 * [ ] Test 2: Vanilla plan agent - ZERO interference
 *      Command: opencode --agent plan --prompt "echo test"
 *      Expected: Works without any shark blocking
 *
 * [ ] Test 3: Shark agent in PLAN - appropriate restrictions
 *      Command: opencode --agent shark --prompt "Plan a feature"
 *      Expected: Shark rules apply, bash/read allowed
 *
 * [ ] Test 4: Verify NO debug output in UI
 *      Expected: No [SHARK] logs visible to user
 *
 * [ ] Test 5: Container test evidence exists
 *      Path: .shark/evidence/delivery/ContainerTestResult.json
 *      Expected: { "overallPassed": true, "passRate": >= 0.96 }
 *
 * [ ] Test 6: Slop detection triggers on false completion
 *      Action: Agent claims completed, files missing
 *      Expected: BLOCKED with SLOP DETECTED error
 *
 * [ ] Test 7: Sudo required for opencode.json edit
 *      Action: Agent tries to edit opencode.json
 *      Expected: SUDO REQUIRED error blocks edit
 *
 * [ ] Test 8: Escape hatch works when stuck
 *      Action: pkill -f "opencode" in PLAN phase
 *      Expected: ALLOWED - recovery permitted
 *
 * ***********************************************************
 * SLOP DETECTION TESTS
 * ***********************************************************
 *
 * [ ] Test: False completion with missing files
 *      Setup: Agent claims "completed" with /path/to/file.js
 *      Reality: File does not exist
 *      Expected: SLOP DETECTED - completion blocked
 *
 * [ ] Test: False completion with empty files
 *      Setup: File exists but size = 0
 *      Expected: SLOP DETECTED - empty files flagged
 *
 * [ ] Test: Fabricated evidence detection
 *      Setup: Agent creates fake ContainerTestResult.json
 *      Expected: Timestamp cross-reference fails, flagged
 *
 * ***********************************************************
 * ARCHITECTURAL REQUIREMENTS
 * ***********************************************************
 *
 * [ ] NO prompt-based logic for enforcement
 * [ ] NO model decisions for security gates
 * [ ] ALL enforcement is algorithmic code
 * [ ] AI only used for: agent communication, user I/O
 *
 * [ ] Code patterns:
 *      if (condition) { block(); }
 *      NOT: if (await askModel("should I block?")) 
 *
 * ***********************************************************
 * v4.8 FAILURE EVIDENCE (What NOT to repeat)
 * ***********************************************************
 *
 * [ ] RC1: Container testing ignored (50+ warnings)
 *      Fix: MECHANICAL BLOCK - no evidence = no deploy
 *
 * [ ] RC2: Identity wall missing
 *      Fix: isSharkAgent() as FIRST line in hook
 *
 * [ ] RC3: PLAN gate over-restrictive
 *      Fix: Only block DANGEROUS commands, not all bash
 *
 * [ ] RC4: No escape hatch
 *      Fix: pkill/kill always allowed, emergency bypass
 *
 * [ ] RC5: Slop allowed
 *      Fix: Completion requires file existence proof
 *
 * [ ] RC6: Precision wall too strict for docs
 *      Fix: Don't apply to .md/.json files
 *
 * ***********************************************************
 * DEPLOYMENT GATES (All Must Pass)
 * ***********************************************************
 *
 * [ ] GATE 1: Code Review
 *      - Identity wall present
 *      - All 6 firewall layers coded
 *      - No prompt-based enforcement
 *
 * [ ] GATE 2: Container Test
 *      - All 8 container tests pass
 *      - Pass rate >= 96%
 *      - Evidence archived
 *
 * [ ] GATE 3: Slop Test
 *      - False completion blocked
 *      - Missing files detected
 *      - Violations logged
 *
 * [ ] GATE 4: Vanilla Agent Test
 *      - build agent: no interference
 *      - plan agent: no interference
 *      - general/explore: no interference
 *
 * [ ] GATE 5: Sudo Test
 *      - opencode.json edit requires password
 *      - 15 min timeout enforced
 *      - Unauthorized attempts blocked
 *
 * [ ] GATE 6: Escape Hatch Test
 *      - pkill works in PLAN
 *      - Emergency recovery allowed
 *      - No deadlock possible
 *
 * ***********************************************************
 * FILES TO MODIFY
 * ***********************************************************
 *
 * [ ] src/index.ts
 *      - Add isSharkAgent() check FIRST
 *      - Import identity utilities
 *
 * [ ] src/enforcement/enforcer.ts
 *      - Add L1 Identity Wall
 *      - Add L6 Sudo System
 *      - Add L4 Slop Detector
 *
 * [ ] src/workflow/enforcer.ts
 *      - Fix L3 Container Test Enforcer
 *      - Fix L5 Escape Hatch
 *      - Fix PLAN gate restrictions
 *
 * [ ] src/workflow/machine.ts
 *      - Add L2 Deployment Guard
 *      - Check plugin status
 *
 * [ ] src/shark-core/anti-hallucination/mechanical-validator.ts
 *      - Fix precision wall (exclude .md/.json)
 *
 * ***********************************************************
 * VERIFICATION COMMANDS
 * ***********************************************************
 *
 * # Show all firewall layers implemented:
 * grep -rn "identityWall\|containerTest\|slopDetector\|escapeHatch\|sudoSystem\|deploymentGuard" src/
 *
 * # Show identity wall is FIRST:
 * head -20 src/index.ts | grep isSharkAgent
 *
 * # Show no prompt-based enforcement:
 * grep -rn "askModel\|model_decision\|prompt.*block" src/
 * # Should return: no matches
 *
 * ***********************************************************
 * BUILD COMPLETION SIGNATURE
 * ***********************************************************
 *
 * All [ ] checked = BUILD READY
 * Any [ ] unchecked = BLOCKED UNTIL FIXED
 *
 * Mechanical code: _______________ (developer initials)
 * Firewall test: _______________ (tester initials)
 * Container test: _______________ (evidence path)
 * Sudo test: _______________ (pass/fail)
 * Slop test: _______________ (pass/fail)
 *
 * ***********************************************************/