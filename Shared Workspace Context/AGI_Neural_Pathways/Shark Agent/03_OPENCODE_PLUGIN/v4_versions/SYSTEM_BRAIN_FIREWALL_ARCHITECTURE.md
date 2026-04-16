/* ***********************************************************
 * SYSTEM BRAIN FIREWALL ARCHITECTURE
 * ***********************************************************
 *
 * Based on v4.8 failure analysis
 * Generated: 2026-04-09
 *
 * ***********************************************************
 * FIREWALL LAYERS (5 Total)
 * ***********************************************************
 *
 * Layer 1: IDENTITY WALL
 * Layer 2: DEPLOYMENT GUARD
 * Layer 3: CONTAINER TEST ENFORCER
 * Layer 4: SLOP DETECTOR
 * Layer 5: SUDO SYSTEM
 *
 * ***********************************/

/* ***********************************************************
 * LAYER 1: IDENTITY WALL
 * ***********************************************************
 *
 * Based on v4.8 failure analysis
 * Generated: 2026-04-09
 *
 * ***********************************************************
 * FIREWALL LAYERS
 * ***********************************************************
 *
 * Layer 1: IDENTITY WALL
 * Layer 2: DEPLOYMENT GUARD
 * Layer 3: CONTAINER TEST ENFORCER
 * Layer 4: SLOP DETECTOR
 * Layer 5: ESCAPE HATCH
 * Layer 6: SUDO SYSTEM
 *
 * ***********************************************************/

/* ***********************************************************
 * LAYER 1: IDENTITY WALL
 * ***********************************************************
 *
 * PURPOSE: Ensure plugin only affects its own agents
 *
 * FAILURE IN v4.8:
 * - tool.execute.before had NO agent check
 * - Affected ALL agents including vanilla
 * - Blocked build, plan, general, explore
 *
 * FIREWALL WORKFLOW:
 */

function identityWallFirewall(tool, agent, sessionID) {
  // EXACT WORKFLOW:
  
  // Step 1: Check if agent is shark
  if (!isSharkAgent(agent)) {
    // ALLOW IMMEDIATELY - don't even evaluate other rules
    return { allowed: true, firewall: 'identity', action: 'bypass' };
  }
  
  // Step 2: Agent is shark - apply enforcement
  return evaluateSharkEnforcement(tool, agent, sessionID);
}

/* FIREWALL RESULT:
 * - Non-shark agents: bypass all enforcement
 * - Shark agents: full enforcement applied
 * - ZERO interference with vanilla agents
 */

/* ***********************************************************
 * LAYER 2: DEPLOYMENT GUARD
 * ***********************************************************
 *
 * PURPOSE: Block experimental/unsanctioned plugins from live
 *
 * FAILURE IN v4.8:
 * - v4.8 deployed without testing
 * - "container testing mandatory" warnings ignored (50+ times)
 *
 * FIREWALL WORKFLOW:
 */

function deploymentGuardFirewall(pluginPath, config) {
  // EXACT WORKFLOW:
  
  // Step 1: Check plugin status
  const status = getPluginStatus(pluginPath);
  
  // Step 2: If experimental/sandboxed, REQUIRE container test
  if (status === 'experimental' || status === 'sandboxed') {
    const hasContainerTest = verifyContainerTestEvidence(pluginPath);
    
    if (!hasContainerTest) {
      throw new Error(`[DEPLOYMENT BLOCKED] ${pluginPath} is marked experimental.
        Container test evidence required before deployment.
        Run: shark-test-runner action=run
        Evidence file: .shark/evidence/delivery/ContainerTestResult.json`);
    }
  }
  
  // Step 3: Check if plugin is on blacklist
  if (isBlacklisted(pluginPath)) {
    throw new Error(`[DEPLOYMENT BLOCKED] Plugin on blacklist: ${pluginPath}`);
  }
  
  // Step 4: Verify plugin has required files
  if (!hasRequiredFiles(pluginPath, ['package.json', 'src/index.ts'])) {
    throw new Error(`[DEPLOYMENT BLOCKED] Missing required files in ${pluginPath}`);
  }
  
  return { allowed: true };
}

/* FIREWALL RESULT:
 * - Experimental plugins blocked until container test passes
 * - Blacklisted plugins never allowed
 * - Missing files blocks deployment
 */

/* ***********************************************************
 * LAYER 3: CONTAINER TEST ENFORCER
 * ***********************************************************
 *
 * PURPOSE: MECHANICALLY enforce container testing
 *
 * FAILURE IN v4.8:
 * - Container test was "mandatory" but never enforced
 * - Warnings ignored
 * - Plugin shipped anyway
 *
 * FIREWALL WORKFLOW:
 */

function containerTestEnforcerFirewall(tool, args, sessionID) {
  // EXACT WORKFLOW:
  
  // Step 1: Check if this is a plugin modification
  if (isPluginModification(tool, args)) {
    const pluginPath = extractPluginPath(args);
    const testEvidence = findContainerTestEvidence(pluginPath);
    
    // Step 2: If no evidence, BLOCK the modification
    if (!testEvidence) {
      throw new Error(`[CONTAINER TEST BLOCKED]
        Plugin: ${pluginPath}
        Action: ${tool}
        
        MECHANICAL REQUIREMENT: Container test evidence required.
        
        To pass this gate:
        1. Start container: docker run -it --rm opencode:test /bin/bash
        2. Load plugin in container
        3. Run: shark-test-runner action=run
        4. Verify: .shark/evidence/delivery/ContainerTestResult.json exists
        5. Copy evidence to: ${pluginPath}/.container-test-evidence/
        
        Until evidence exists, ALL plugin modifications are BLOCKED.`);
    }
    
    // Step 3: If evidence exists but tests failed, BLOCK
    if (testEvidence.overallPassed === false) {
      throw new Error(`[CONTAINER TEST FAILED]
        Plugin: ${pluginPath}
        Test Result: FAILED
        Pass Rate: ${testEvidence.passRate}%
        Required: 96%+
        
        Fix failures and re-run: shark-test-runner action=run
        DO NOT ship until tests pass.`);
    }
  }
  
  return { allowed: true };
}

/* CONTAINER TEST EVIDENCE FORMAT:
 * .shark/evidence/delivery/ContainerTestResult.json
 * {
 *   "suite": "shark-container-tests",
 *   "overallPassed": true,
 *   "passRate": 0.98,
 *   "passedTests": 49,
 *   "totalTests": 50,
 *   "timestamp": 1712659200000
 * }
 */

/* FIREWALL RESULT:
 * - Plugin modifications REQUIRE container test evidence
 * - Tests MUST pass at 96%+ rate
 * - No evidence = BLOCKED
 * - Tests failed = BLOCKED
 */

/* ***********************************************************
 * LAYER 4: SLOP DETECTOR
 * ***********************************************************
 *
 * PURPOSE: Block false completion claims without evidence
 *
 * FAILURE IN v4.8:
 * - shark-alpha-1: claimed "completed", 0 files existed
 * - manta-gamma-1: claimed "completed", 0 files existed
 * - Agents could lie without consequence
 *
 * FIREWALL WORKFLOW:
 */

function slopDetectorFirewall(tool, args, result, sessionID) {
  // EXACT WORKFLOW:
  
  // Step 1: Check if this is a completion report
  if (isCompletionReport(tool, result)) {
    const claimedFiles = extractClaimedFiles(result);
    const claimedPaths = claimedFiles.map(f => f.path);
    
    // Step 2: Verify EACH claimed file exists
    const verificationResults = claimedPaths.map(path => ({
      path,
      exists: fs.existsSync(path),
      size: fs.existsSync(path) ? fs.statSync(path).size : 0
    }));
    
    // Step 3: If any file missing, BLOCK and flag
    const missingFiles = verificationResults.filter(r => !r.exists);
    
    if (missingFiles.length > 0) {
      // Log the SLOP attempt
      logSlopAttempt({
        sessionID,
        agent: getCurrentAgent(sessionID),
        tool,
        claimedFiles: missingFiles,
        timestamp: Date.now()
      });
      
      throw new Error(`[SLOP DETECTED - COMPLETION BLOCKED]
        Agent claimed completion but files are MISSING:
        ${missingFiles.map(f => `  - ${f.path}`).join('\n')}
        
        This is a SLOP violation. Completion requires:
        1. ALL claimed files MUST exist
        2. Files MUST have non-zero size
        3. Evidence of actual work
        
        Supervisor review required before retry.`);
    }
    
    // Step 4: Check file sizes are reasonable
    const emptyFiles = verificationResults.filter(r => r.exists && r.size === 0);
    if (emptyFiles.length > 0) {
      throw new Error(`[SLOP DETECTED - EMPTY FILES]
        Agent claimed completion but files are EMPTY:
        ${emptyFiles.map(f => `  - ${f.path} (0 bytes)`).join('\n')}
        
        Files must contain actual content.`);
    }
  }
  
  return { allowed: true };
}

/* SLOP VIOLATION LOG FORMAT:
 * .shark/slop-log.jsonl
 * {
 *   "timestamp": 1712659200000,
 *   "sessionID": "abc123",
 *   "agent": "shark-alpha-1",
 *   "claimedFiles": ["/path/to/file1", "/path/to/file2"],
 *   "missingFiles": ["/path/to/file1"],
 *   "violationType": "FILES_MISSING"
 * }
 */

/* FIREWALL RESULT:
 * - Completion claims require file existence proof
 * - Missing files = SLOP violation
 * - Empty files = SLOP violation
 * - Agents can't lie without being flagged
 */

/* ***********************************************************
 * LAYER 5: SUDO SYSTEM
 * ***********************************************************
 *
 * PURPOSE: Require password for critical config changes
 *
 * FAILURE IN v4.8:
 * - Could modify opencode.json freely
 * - Could deploy experimental plugins
 * - No human authorization
 *
 * FIREWALL WORKFLOW:
 */

function sudoSystemFirewall(tool, args, sessionID) {
  // EXACT WORKFLOW:
  
  // Step 1: Check if critical config modification
  if (isCriticalConfigModification(tool, args)) {
    const hasSudoSession = checkSudoSession(sessionID);
    const configPath = extractConfigPath(args);
    
    if (!hasSudoSession) {
      throw new Error(`[SUDO REQUIRED]
        Configuration: ${configPath}
        Action: ${tool}
        
        This is a CRITICAL configuration change.
        Human authorization REQUIRED.
        
        To authorize:
        1. Type your device password in the sudo prompt
        2. Or manually edit: ${configPath}
        
        Agent cannot modify critical configs without sudo.`);
    }
    
    // Step 2: Check if sudo session expired (15 min timeout)
    const sudoAge = getSudoSessionAge(sessionID);
    if (sudoAge > 900000) { // 15 minutes
      throw new Error(`[SUDO EXPIRED]
        Sudo session expired after 15 minutes.
        Please re-authorize critical config changes.`);
    }
  }
  
  return null; // Continue normal evaluation
}

/* CRITICAL CONFIG PATTERNS:
 * - opencode.json - SUDO REQUIRED
 * - ~/.config/opencode/ - SUDO REQUIRED
 * - /etc/opencode/ - SUDO REQUIRED
 * - Plugin paths in config - SUDO REQUIRED
 */

/* SUDO SESSION FORMAT:
 * .shark/sudo-sessions.json
 * {
 *   "sessionID": "abc123",
 *   "authorizedAt": 1712659200000,
 *   "authorizedBy": "human",
 *   "expiresAt": 1712660100000
 * }
 */

/* FIREWALL RESULT:
 * - Critical configs require sudo
 * - Sudo expires after 15 minutes
 * - Human must type password
 * - No runaway agent shipping
 */

/* ***********************************************************
 * COMPLETE FIREWALL STACK ORDER (5 Layers)
 * ***********************************************************
 *
 * When tool.execute.before fires:
 *
 * 1. SUDO SYSTEM (Layer 5)
 *    - Check if critical config
 *    - Require sudo if needed
 *
 * 2. IDENTITY WALL (Layer 1)  
 *    - Check if shark agent
 *    - Bypass if not shark
 *
 * 3. CONTAINER TEST ENFORCER (Layer 3)
 *    - Check if plugin modification
 *    - Require container test evidence
 *
 * 4. SLOP DETECTOR (Layer 4)
 *    - Check completion claims
 *    - Verify file existence
 *
 * 5. DEPLOYMENT GUARD (Layer 2)
 *    - Check plugin status
 *    - Block experimental if untested
 *
 * 6. SHARK ENFORCEMENT (original)
 *    - Guardian, gates, etc.
 *
 * ***********************************************************
 *
 * EXAMPLE: v4.8 Deployment Attempt
 *
 * Agent tries to deploy v4.8 without container test:
 *
 * Step 1: SUDO SYSTEM
 * - Not critical config, continue
 *
 * Step 2: IDENTITY WALL
 * - isSharkAgent() = true, continue
 *
 * Step 3: CONTAINER TEST ENFORCER
 * - isPluginModification() = true
 * - findContainerTestEvidence() = null
 * - THROW ERROR: Container test required
 *
 * Result: DEPLOYMENT BLOCKED
 *
 * Example: Agent Claims False Completion
 *
 * Step 1-3: Normal evaluation
 *
 * Step 4: SLOP DETECTOR
 * - isCompletionReport() = true
 * - claimedFiles = ['/path/to/dist/index.js']
 * - exists = false
 * - THROW ERROR: Files missing, SLOP violation
 *
 * Result: COMPLETION BLOCKED, AGENT FLAGGED
 *
 * Example: Critical Config Edit
 *
 * Agent tries to edit opencode.json
 *
 * Step 1: SUDO SYSTEM
 * - isCriticalConfigModification('edit', {path: 'opencode.json'}) = true
 * - hasSudoSession() = false
 * - THROW ERROR: Sudo required
 *
 * Result: EDIT BLOCKED until human authorizes
 *
 * ***********************************************************
 *
 * IMPLEMENTATION PRIORITY
 *
 * P0 (Must Have):
 * - Identity Wall (L1)
 * - Container Test Enforcer (L3)
 * - Brain Failure Block (prevents bypass)
 *
 * P1 (Should Have):
 * - Sudo System (L5)
 * - Slop Detector (L4)
 *
 * P2 (Nice to Have):
 * - Deployment Guard (L2)
 *
 * ***********************************************************/