# Nemotron Scan Skill Build Prompt

## 🎯 OBJECTIVE
Build an OpenCode skill file that automates the Nemotron context ingestion process using the **Nemotron 3 Super Free model** that is natively integrated into OpenCode Zen. When triggered with "run a nemotron scan," the skill should perform deep codebase analysis **WITHOUT OpenCode-Ultra token truncation limits** and generate precise context files for planning brain consumption.

## 🔍 CRITICAL: NEMOTRON 3 INTEGRATION REQUIREMENTS

### 1. Use Nemotron 3 Super Free Model
- **Model**: Nemotron 3 Super Free (natively integrated into OpenCode Zen)
- **Context Window**: 1M tokens (no truncation limits)
- **Location**: Already available in OpenCode agent system
- **Purpose**: This is WHY we call it "Nemotron Scan" - using the high-context model for deep analysis

### 2. Remove OpenCode-Ultra Truncation Limits
The skill **MUST** bypass any OpenCode-Ultra token truncation by:
1. **Direct Nemotron agent invocation** - Not using standard OpenCode tools with truncation
2. **Batch processing with context preservation** - Maintain full context across operations
3. **Native model integration** - Leverage OpenCode's built-in Nemotron 3 capabilities

### 3. Locate Nemotron Integration in Codebase
The build agent must find and integrate with existing Nemotron 3 capabilities:

**Search patterns**:
```javascript
// Look for these in OpenCode codebase:
const nemotronPatterns = [
  /nemotron.*3/i,
  /nemotron.*super.*free/i,
  /1M.*token.*context/i,
  /opencode.*zen.*nemotron/i,
  /model.*nemotron/i,
  /integrated.*nemotron/i
];

// Expected integration points:
// 1. Model configuration files
// 2. Agent initialization scripts  
// 3. OpenCode plugin/module system
// 4. Environment variable configurations
```

## 📋 CORE REQUIREMENTS

### 1. No Truncation Limits (Using Nemotron 3)
- **Use Nemotron 3's 1M token context** - Not standard OpenCode tools with truncation
- **Direct model integration** - Access Nemotron 3 natively through OpenCode Zen
- **Full file content analysis** - No chunking needed for files <1M tokens
- **Memory-optimized processing** - Leverage Nemotron's native large context handling

### 2. Context File Generation
Generate the exact same artifacts as the manual Planning Brain Handover Package:
- `V3_Planning_Brain_Context.md` - Strategic analysis & implementation plan
- `V4_CONTEXT_LIBRARY.md` - Evidence-based reality analysis  
- `NEXT_STEPS_PROMPT.md` - Actionable next steps with priority ordering
- `README.md` - Package overview and usage instructions

### 3. Smart Analysis Capabilities
- **Architecture Detection**: Identify tool chokepoints, enforcement layers, dependency graphs
- **Gap Analysis**: Compare documentation vs. actual implementation (hallucination detection)
- **Vulnerability Detection**: Find bypass paths, optional enforcement, missing integrations
- **Constraint Compliance**: Verify YOLO compatibility, anti-slop focus, performance considerations
- **Pattern Recognition**: Identify common architectural patterns and anti-patterns

### 4. Skill Interface
```
/nemotron-scan [target_path] [output_dir?] [--deep?]
```
- `target_path`: Directory or file to scan (required)
- `output_dir`: Optional output directory (default: `.nemotron-context/[basename]-[timestamp]/`)
- `--deep`: Enable AST-aware analysis, dependency mapping, cross-file correlation
- Returns: Path to generated handover package

## 🏗️ IMPLEMENTATION SPECIFICATION

### Phase 1: Exploration & Mapping

#### 1.1 File Discovery
```javascript
// Use glob to discover all files
const patterns = [
  '**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx',
  '**/*.py', '**/*.java', '**/*.go', '**/*.rs',
  '**/*.md', '**/*.json', '**/*.yaml', '**/*.yml',
  '**/*.toml', '**/*.lock', '**/package.json',
  '**/Cargo.toml', '**/go.mod', '**/requirements.txt'
];

// Categorize by type
const fileCategories = {
  sourceCode: [],
  documentation: [],
  configuration: [],
  buildScripts: [],
  tests: [],
  other: []
};
```

#### 1.2 Architecture Mapping
```javascript
// Identify key architectural files
const architecturalFiles = {
  entryPoints: [],      // main.ts, index.ts, app.js, etc.
  toolExecutors: [],    // executor.ts, tool-executor.*
  stateMachines: [],    // state-machine.*, workflow.*
  guardians: [],        // guardian.*, firewall.*
  coordinators: [],     // coordinator.*, brain.*
  configFiles: [],      // config.*, settings.*
  cliFiles: [],         // cli.*, main.* with shebang
};
```

#### 1.3 Dependency Analysis
```javascript
// Map imports and exports
const dependencyGraph = {
  nodes: {},  // file -> { imports: [], exports: [], dependencies: [] }
  edges: [],  // source -> target relationships
  cycles: [], // circular dependencies
  entryPoints: [] // files with no incoming dependencies
};
```

### Phase 2: Deep Analysis (Using Nemotron 3)

#### 2.1 Nemotron 3 Integration Setup
```javascript
// First, locate Nemotron 3 integration in OpenCode
const findNemotronIntegration = async () => {
  // Search OpenCode codebase for Nemotron 3
  const integrationPoints = await grep(/nemotron.*3|nemotron.*super.*free/i, '/path/to/opencode');
  
  // Expected patterns:
  // 1. Model configuration: { model: "nemotron-3-super-free", context: 1000000 }
  // 2. Agent initialization: new NemotronAgent() or similar
  // 3. Plugin registration: registerNemotronModel()
  
  // If not found, check OpenCode documentation for Nemotron integration
  // Look for: opencode.json config, .opencode/plugins/, agent initialization scripts
};

// Initialize Nemotron 3 agent with 1M token context
const initializeNemotronAgent = async () => {
  // Method 1: Direct model invocation (preferred)
  // const nemotron = await createNemotronAgent({ model: "nemotron-3-super-free", contextWindow: 1000000 });
  
  // Method 2: Through OpenCode's agent system
  // const nemotron = await spawn_agent({ agent: "nemotron", prompt: "analyze codebase" });
  
  // Method 3: Environment-based configuration
  // process.env.OPENCODE_MODEL = "nemotron-3-super-free";
  // process.env.CONTEXT_WINDOW = "1000000";
  
  return nemotronAgent;
};
```

#### 2.2 Critical File Reading (No Truncation)
```javascript
// Read critical files using Nemotron 3's full context
const readFilesWithNemotron = async (filePaths) => {
  // Build context for Nemotron 3 (no truncation needed)
  const fileContents = [];
  
  for (const filePath of filePaths) {
    // Use Nemotron's native file reading (not OpenCode's truncated read)
    // This bypasses OpenCode-Ultra's 2000 line limit
    const content = await nemotronAgent.readFile(filePath, { truncation: false });
    fileContents.push({
      path: filePath,
      content: content,
      lines: content.split('\n').length
    });
  }
  
  return fileContents;
};

// Critical files to analyze with full context
const criticalFiles = [
  ...architecturalFiles.entryPoints,
  ...architecturalFiles.toolExecutors,
  ...architecturalFiles.stateMachines,
  ...architecturalFiles.guardians,
  ...architecturalFiles.coordinators
];

// Read ALL content (no chunking needed with 1M token context)
const fullFileContents = await readFilesWithNemotron(criticalFiles);
```

#### 2.2 Pattern Analysis with Nemotron 3 (No Truncation)
```javascript
// Use Nemotron 3 for pattern analysis across full file contents
const analyzeWithNemotron = async (fileContents, analysisPrompt) => {
  // Build comprehensive context for Nemotron 3
  const context = fileContents.map(f => 
    `FILE: ${f.path}\nCONTENT:\n${f.content}\n---\n`
  ).join('\n');
  
  // Use Nemotron 3's 1M token context for deep analysis
  const analysis = await nemotronAgent.analyze(context, analysisPrompt, {
    maxTokens: 1000000, // Full 1M token context
    temperature: 0.1,   // Low temperature for precise analysis
    truncation: false   // NO TRUNCATION - critical requirement
  });
  
  return analysis;
};

// Critical patterns analysis using Nemotron 3
const patternsAnalysis = await analyzeWithNemotron(fullFileContents, `
Analyze these code files for the following patterns:

1. TOOL EXECUTOR INTEGRATION:
   - ToolExecutor class definition and usage
   - WorkflowBlocker integration (connected or optional?)
   - Guardian protection calls
   - executeTool() method implementation

2. BYPASS VULNERABILITIES:
   - Optional parameters (workflowBlocker?: WorkflowBlocker)
   - Null checks that allow bypass (if (this.workflowBlocker))
   - Environment variable bypass (SHARK_SKIP_FIREWALLS)
   - Missing mandatory enforcement

3. YOLO COMPATIBILITY:
   - YOLO mode implementation
   - Emergency bypass mechanisms
   - Constraint preservation checks

4. ANTI-SLOP FOCUS:
   - Theatrical pattern detection
   - Mock/simulate/stub patterns
   - Warning-only vs blocking logic

5. ARCHITECTURAL PATTERNS:
   - State machine integration
   - Parallel vs sequential execution
   - Performance optimization patterns

Return structured analysis with:
- Pattern found (yes/no)
- Location (file:line)
- Evidence (code snippet)
- Impact assessment
- Recommendation
`);
```

#### 2.3 AST-Aware Analysis with Nemotron 3 (--deep flag)
```javascript
if (deepAnalysis) {
  // Use Nemotron 3 for structural analysis (more powerful than ast_search)
  const structuralAnalysis = await analyzeWithNemotron(fullFileContents, `
Perform deep structural analysis of this codebase:

1. CLASS HIERARCHY ANALYSIS:
   - ToolExecutor class structure and inheritance
   - WorkflowBlocker integration points
   - Guardian protection layer architecture
   - State machine implementation patterns

2. TYPE SYSTEM ANALYSIS:
   - Optional vs required parameters (bypass vulnerability detection)
   - Nullable types that allow bypass
   - Interface definitions and implementations
   - Type guards and validation logic

3. CONTROL FLOW ANALYSIS:
   - Execution paths through ToolExecutor.executeTool()
   - Conditional branches that enable/disable enforcement
   - Error handling and fallback mechanisms
   - Performance bottlenecks in sequential checks

4. DEPENDENCY ANALYSIS:
   - Import/export relationships
   - Circular dependency detection
   - Module coupling and cohesion metrics
   - Architectural layer violations

5. PATTERN DETECTION:
   - Singleton patterns for enforcement classes
   - Factory patterns for agent creation
   - Observer patterns for state changes
   - Strategy patterns for firewall implementations

Return analysis in structured format with:
- Structural diagrams (Mermaid syntax)
- Dependency graphs
- Control flow charts
- Architecture violation reports
- Performance optimization suggestions
`);
}
```

#### 2.4 Evidence Table Generation
```javascript
// Build evidence tables for V4_CONTEXT_LIBRARY.md
const evidenceTables = {
  toolExecutorIntegration: {
    claim: "WorkflowBlocker is connected to ToolExecutor",
    evidence: [],
    status: "UNVERIFIED", // PENDING, VERIFIED, DISPROVEN
    confidence: 0,
    codeCitations: []
  },
  bypassVulnerability: {
    claim: "Agents can bypass workflow enforcement",
    evidence: [],
    status: "UNVERIFIED",
    confidence: 0,
    codeCitations: []
  },
  yoloCompatibility: {
    claim: "System supports YOLO mode bypass",
    evidence: [],
    status: "UNVERIFIED",
    confidence: 0,
    codeCitations: []
  },
  // Add 10+ more evidence categories
};

// Populate evidence from search results
for (const file of architecturalFiles.toolExecutors) {
  const content = await readFileChunked(file);
  if (content.includes('workflowBlocker?: WorkflowBlocker')) {
    evidenceTables.bypassVulnerability.evidence.push(
      `Found optional WorkflowBlocker in ${file}: line X`
    );
    evidenceTables.bypassVulnerability.status = "VERIFIED";
    evidenceTables.bypassVulnerability.confidence = 0.9;
  }
  
  if (content.includes('this.workflowBlocker.blockWrite')) {
    evidenceTables.toolExecutorIntegration.evidence.push(
      `Found WorkflowBlocker.blockWrite() call in ${file}: line Y`
    );
    evidenceTables.toolExecutorIntegration.status = "VERIFIED";
    evidenceTables.toolExecutorIntegration.confidence = 0.8;
  }
}
```

### Phase 3: Context Synthesis with Nemotron 3

#### 3.1 V4_CONTEXT_LIBRARY.md Generation (Nemotron 3 Analysis)
```javascript
// Use Nemotron 3 to generate evidence-based analysis
const generateContextLibrary = async (patternsAnalysis, structuralAnalysis) => {
  const contextLibrary = await nemotronAgent.generate(`
Based on the deep code analysis, generate a V4_CONTEXT_LIBRARY.md document.

ANALYSIS DATA:
${JSON.stringify(patternsAnalysis, null, 2)}
${deepAnalysis ? JSON.stringify(structuralAnalysis, null, 2) : ''}

REQUIREMENTS:
1. Create evidence tables with code citations
2. Distinguish between VERIFIED claims and DISPROVEN claims
3. Include exact file paths and line numbers
4. Assess confidence levels (0.0-1.0)
5. Generate architecture diagrams
6. Provide actionable recommendations

FORMAT:
# V4 CONTEXT LIBRARY: TRUE STATE ANALYSIS

## Executive Summary
[Concise summary of findings]

## Evidence Tables
[Structured tables with claims, evidence, status, confidence, code citations]

## Critical Code Locations
[Table of key files with purposes and line numbers]

## Architecture Analysis
[Mermaid diagrams and structural insights]

## Vulnerability Assessment
[Bypass paths, missing integrations, security issues]

## Recommendations
[Priority-ordered implementation steps]
`, {
    maxTokens: 50000, // Large output for comprehensive analysis
    temperature: 0.1,
    format: 'markdown'
  });
  
  return contextLibrary;
};
```

#### 3.2 V3_Planning_Brain_Context.md Generation (Nemotron 3 Strategy)
```javascript
// Use Nemotron 3 for strategic planning context
const generatePlanningContext = async (contextLibrary, patternsAnalysis) => {
  const planningContext = await nemotronAgent.generate(`
Based on the V4_CONTEXT_LIBRARY analysis, generate a V3_Planning_Brain_Context.md document.

CONTEXT LIBRARY SUMMARY:
${contextLibrary.substring(0, 10000)}... [truncated for context]

PATTERN ANALYSIS:
${JSON.stringify(patternsAnalysis.keyFindings, null, 2)}

REQUIREMENTS:
1. Create strategic analysis of current state
2. Generate 3-wave implementation roadmap
3. Include constraint compliance matrix
4. Define success metrics
5. Provide architectural decisions
6. List files for direct reference

WAVE STRUCTURE:
- Wave 1: Foundational Anchor Fix (bypass vulnerability elimination)
- Wave 2: Parallel Firewall Mesh (performance optimization)
- Wave 3: Enhanced Firewalls (security and quality)

CONSTRAINTS TO HONOR:
- YOLO mode compatible (emergency bypass required)
- Anti-slop focus (theatrical detection warns only)
- Only block rm -rf / exact (preserve legitimate workflows)
- Connect, don't create (integrate existing systems)
- Performance optimized (<50ms overhead)

FORMAT:
# 🧠 V3 PLANNING BRAIN CONTEXT

## Strategic Analysis
[Deep analysis of architecture and vulnerabilities]

## Implementation Roadmap
### Wave 1: Foundational Anchor Fix
[Priority tasks to eliminate bypass vulnerabilities]

### Wave 2: Parallel Firewall Mesh  
[Performance optimization and concurrent execution]

### Wave 3: Enhanced Firewalls
[Security hardening and quality gates]

## Constraint Compliance Matrix
[Table showing current vs target state for each constraint]

## Architectural Decisions
[Key decisions about parallel execution, audit trails, etc.]

## Success Metrics
[Quantitative targets for bypass rate, performance, etc.]

## Files for Direct Reference
[Key files with purposes and line numbers]
`, {
    maxTokens: 30000,
    temperature: 0.1,
    format: 'markdown'
  });
  
  return planningContext;
};
```

#### 3.3 NEXT_STEPS_PROMPT.md Generation (Nemotron 3 Action Plan)
```javascript
// Use Nemotron 3 to generate actionable next steps
const generateNextStepsPrompt = async (planningContext, contextLibrary) => {
  const nextSteps = await nemotronAgent.generate(`
Based on the V3_Planning_Brain_Context analysis, generate a NEXT_STEPS_PROMPT.md document.

PLANNING CONTEXT SUMMARY:
${planningContext.substring(0, 5000)}... [truncated]

CONTEXT LIBRARY KEY FINDINGS:
${contextLibrary.substring(0, 5000)}... [truncated]

REQUIREMENTS:
Generate an actionable prompt for the next Planning Brain with:

1. Current Operational Status - What phase we're in
2. What Has Been Accomplished - From Nemotron scan analysis
3. What Remains to Be Done - Priority-ordered tasks
4. Immediate Next Steps - Wave 1 implementation details
5. Key Constraints to Honor - YOLO, anti-slop, etc.
6. Success Metrics to Target - Quantitative goals
7. Where to Begin - First file to modify, first test to run

CRITICAL: Focus on the ToolExecutor bypass vulnerability as highest priority.
The coordinator-base.ts missing WorkflowBlocker must be fixed first.

FORMAT:
# PLANNING BRAIN HANDOVER PACKAGE
## NEXT STEPS PROMPT

### Context Summary
[Brief overview]

### Current Operational Status
[Build phase ready, bypass vulnerability identified]

### What Has Been Accomplished
[Nemotron scan completed, vulnerabilities identified]

### What Remains to Be Done (Priority Order)
[Wave 1, 2, 3 tasks]

### IMMEDIATE NEXT STEPS (Wave 1)
1. Fix coordinator-base.ts - Make WorkflowBlocker mandatory
2. Add YOLO bypass mechanism - SHARK_SKIP_FIREWALLS=true
3. Implement audit trail - FirewallAudit class
4. Add CLI statistics - shark --firewall-stats

### Key Constraints to Honor
[List with compliance status]

### Success Metrics to Target
[Quantitative targets]

### Where to Begin
[First file to edit, first command to run]
`, {
    maxTokens: 15000,
    temperature: 0.1,
    format: 'markdown'
  });
  
  return nextSteps;
};
```

#### 3.4 build-transcript.md Generation
```markdown
# Nemotron Scan Build Transcript

## Scan Configuration
- Target: ${target_path}
- Output: ${output_dir}
- Deep Analysis: ${deepAnalysis ? 'Enabled' : 'Disabled'}
- Timestamp: ${new Date().toISOString()}
- Skill Version: ${skillVersion}

## File Statistics
- Total Files: ${totalFiles}
- Source Code: ${sourceCodeFiles.length}
- Configuration: ${configFiles.length}
- Documentation: ${docFiles.length}
- Build Scripts: ${buildFiles.length}

## Analysis Methodology
1. File discovery via glob patterns
2. Architecture mapping of key components
3. Pattern analysis with grep (${Object.keys(patterns).length} patterns)
4. ${deepAnalysis ? 'AST-aware structural analysis' : 'Basic content analysis'}
5. Evidence table generation and verification
6. Context synthesis into handover package

## Key Findings
${generateKeyFindingsSummary(evidenceTables)}

## Generated Artifacts
1. V4_CONTEXT_LIBRARY.md - ${evidenceTables.verifiedClaims} verified claims
2. V3_Planning_Brain_Context.md - Strategic roadmap with ${waveCount} waves
3. NEXT_STEPS_PROMPT.md - ${priorityTaskCount} priority tasks
4. README.md - Package overview

## Verification Checksums
${generateChecksums(generatedFiles)}
```

### Phase 4: Handover Packaging with Nemotron 3 Metadata

#### 4.1 Directory Structure Creation (Nemotron 3 Enhanced)
```javascript
const packageStructure = {
  'NEXT_STEPS_PROMPT.md': nextStepsContent,
  'V3_Planning_Brain_Context.md': planningContextContent,
  'V4_CONTEXT_LIBRARY.md': contextLibraryContent,
  'build-transcript.md': `
# Nemotron 3 Scan Build Transcript

## Scan Configuration
- **Model Used**: Nemotron 3 Super Free (1M token context)
- **Target**: ${target_path}
- **Output**: ${output_dir}
- **Deep Analysis**: ${deepAnalysis ? 'Enabled (AST-aware)' : 'Disabled'}
- **Timestamp**: ${new Date().toISOString()}
- **Skill Version**: ${skillVersion}
- **Truncation Bypass**: YES (Used Nemotron 3 native integration)

## Nemotron 3 Integration Details
- **Model Context**: 1,000,000 tokens
- **Integration Method**: ${nemotronIntegrationMethod}
- **OpenCode-Ultra Bypass**: Successful (no truncation limits)
- **Analysis Depth**: Full file content analysis

## File Statistics
- Total Files: ${totalFiles}
- Source Code: ${sourceCodeFiles.length}
- Files Analyzed with Full Context: ${fullFileContents.length}
- Largest File Analyzed: ${Math.max(...fullFileContents.map(f => f.lines))} lines

## Analysis Methodology
1. Nemotron 3 agent initialization (1M token context)
2. Full file content reading (no truncation)
3. Pattern analysis using Nemotron 3's deep understanding
4. ${deepAnalysis ? 'AST-aware structural analysis' : 'Basic pattern analysis'}
5. Evidence table generation with code citations
6. Strategic context synthesis

## Key Findings (Nemotron 3 Analysis)
${patternsAnalysis.summary}

## Generated Artifacts
1. V4_CONTEXT_LIBRARY.md - ${patternsAnalysis.verifiedClaims} verified claims
2. V3_Planning_Brain_Context.md - Strategic roadmap with 3 waves
3. NEXT_STEPS_PROMPT.md - ${patternsAnalysis.priorityTasks} priority tasks

## Verification
- All files analyzed with full context (no truncation)
- Nemotron 3 1M token context utilized
- Evidence tables include exact code citations
- Architecture diagrams generated from structural analysis

## Performance Metrics
- Analysis Time: ${analysisTime} seconds
- Memory Usage: ${memoryUsage} MB
- Token Usage: ~${tokenEstimate} tokens
- Context Window Utilization: ${contextUtilization}%
`,
  'README.md': `
# Nemotron 3 Scan Handover Package

## Generated: ${new Date().toISOString()}
## Model: Nemotron 3 Super Free (1M token context)
## Target: ${target_path}
## Analysis Depth: ${deepAnalysis ? 'Deep (AST-aware with Nemotron 3)' : 'Standard'}

## ⚡ NEMOTRON 3 INTEGRATION
This package was generated using **Nemotron 3 Super Free** model with **1M token context window**, bypassing OpenCode-Ultra truncation limits through native OpenCode Zen integration.

## Contents
1. **NEXT_STEPS_PROMPT.md** - Actionable tasks for next agent (read FIRST)
2. **V3_Planning_Brain_Context.md** - Strategic analysis and implementation roadmap
3. **V4_CONTEXT_LIBRARY.md** - Evidence-based reality analysis with code citations
4. **build-transcript.md** - Methodology, findings, and Nemotron 3 integration details

## Usage Instructions
1. **Start with NEXT_STEPS_PROMPT.md** for immediate actions
2. **Review V3_Planning_Brain_Context.md** for strategic understanding
3. **Reference V4_CONTEXT_LIBRARY.md** for specific evidence and code locations
4. **Check build-transcript.md** for analysis methodology and Nemotron 3 details

## Critical Findings
${patternsAnalysis.criticalFindings}

## Constraints Analyzed
- YOLO compatibility: ${patternsAnalysis.yoloStatus}
- Anti-slop focus: ${patternsAnalysis.antiSlopStatus}
- Bypass vulnerabilities: ${patternsAnalysis.bypassVulnerabilities.length} identified

## Verification
- No file truncation - Full content analyzed using Nemotron 3
- Evidence includes exact file:line citations
- Architecture diagrams based on structural analysis
`,
  '.nemotron-metadata': {
    'config.json': JSON.stringify({
      model: "nemotron-3-super-free",
      contextWindow: 1000000,
      integrationMethod: nemotronIntegrationMethod,
      truncationBypass: true,
      target: target_path,
      timestamp: new Date().toISOString(),
      skillVersion: skillVersion,
      analysisDepth: deepAnalysis ? 'deep' : 'standard',
      filesAnalyzed: totalFiles,
      largestFileLines: Math.max(...fullFileContents.map(f => f.lines))
    }, null, 2),
    'performance.json': JSON.stringify({
      analysisTime: analysisTime,
      memoryUsage: memoryUsage,
      estimatedTokens: tokenEstimate,
      contextUtilization: contextUtilization
    }, null, 2)
  }
};
```

#### 4.2 Output and Cleanup
```javascript
// Write all files
for (const [filePath, content] of Object.entries(packageStructure)) {
  const fullPath = path.join(outputDir, filePath);
  await write(fullPath, content);
}

// Return package location
return {
  success: true,
  packagePath: outputDir,
  artifacts: Object.keys(packageStructure),
  evidence: {
    verifiedClaims: evidenceTables.verifiedClaims,
    disprovenClaims: evidenceTables.disprovenClaims,
    pendingVerification: evidenceTables.pendingVerification
  },
  recommendations: generateRecommendations(evidenceTables)
};
```

## 🧪 TESTING REQUIREMENTS

### Test Scenarios
1. **shark-frankenstein codebase** - Should reproduce manual Planning Brain analysis
2. **Empty directory** - Graceful handling with appropriate warnings
3. **Large codebase** (>1000 files) - Performance testing, memory usage
4. **Mixed language project** - TypeScript, Python, Go, Rust recognition
5. **Malformed files** - Graceful error handling, skip with warning

### Success Criteria
- **Completeness**: All files scanned, no truncation, 100% coverage
- **Accuracy**: Context files match manual process quality and structure
- **Performance**: <5 minutes for 10k file codebase, linear scaling
- **Memory**: <500MB peak usage for large codebases
- **Reusability**: Works on any OpenCode-accessible codebase
- **Determinism**: Same input produces same output (idempotent)

### Validation
1. **Cross-reference with manual analysis** - Compare outputs
2. **Evidence verification** - Manual spot-check of code citations
3. **Architecture accuracy** - Verify dependency mapping correctness
4. **Constraint detection** - Verify YOLO/anti-slop pattern recognition

## 🚀 EXAMPLE USAGE

### Basic Scan
```
User: run a nemotron scan /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
Agent: [Executes skill]
Output: Nemotron scan complete. Handover package at: /home/leviathan/.nemotron-context/shark-frankenstein-20250327/
```

### Deep Analysis
```
User: /nemotron-scan /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein --deep
Agent: [Executes skill with AST analysis]
Output: Deep analysis complete. Package includes dependency graphs and structural patterns.
```

### Custom Output Directory
```
User: /nemotron-scan /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein /tmp/my-analysis
Agent: [Executes skill, outputs to specified location]
Output: Scan complete. Package at: /tmp/my-analysis/
```

## 📊 NEMOTRON 3 PERFORMANCE OPTIMIZATIONS

### 1. Nemotron 3 Native Integration
- **Direct model access** - Not through truncated OpenCode tools
- **1M token context utilization** - No chunking needed for most codebases
- **Batch analysis** - Process multiple files in single Nemotron context
- **Context preservation** - Maintain analysis state across operations

### 2. Truncation Bypass Strategy
- **Avoid OpenCode-Ultra read limits** - Use Nemotron's native file reading
- **Full file content analysis** - No 2000 line truncation
- **Direct model invocation** - Bypass intermediate tool layers
- **Context window optimization** - Maximize 1M token utilization

### 3. Memory Management with Nemotron 3
- **Model-native streaming** - Nemotron handles large contexts internally
- **Progressive analysis** - Start with architecture, then deep dive
- **Selective deep analysis** --deep flag for AST/structural only
- **Result caching** - Store analysis results to avoid recomputation

### 4. Integration Discovery
The build agent must:
1. **Find Nemotron 3 in OpenCode** - Search configuration files, plugins
2. **Test integration methods** - Try different invocation patterns
3. **Verify context window** - Confirm 1M token availability
4. **Benchmark performance** - Measure analysis speed and memory usage

## 🔧 SKILL FILE STRUCTURE (NEMOTRON 3 INTEGRATION)

```javascript
// nemotron-scan.js
export const skill = {
  name: "nemotron-scan",
  description: "Deep codebase analysis using Nemotron 3 Super Free (1M token context, no truncation)",
  version: "1.0.0",
  
  execute: async (args, context) => {
    const { targetPath, outputDir, deep } = parseArgs(args);
    const startTime = Date.now();
    
    try {
      // CRITICAL: Initialize Nemotron 3 agent
      const nemotronAgent = await initializeNemotronAgent();
      if (!nemotronAgent) {
        throw new Error("Nemotron 3 integration not found. Search OpenCode for 'nemotron-3-super-free' integration.");
      }
      
      // Phase 1: Exploration & Nemotron setup
      const fileMap = await exploreFiles(targetPath);
      
      // Phase 2: Nemotron 3 Deep Analysis (no truncation)
      const analysis = await analyzeWithNemotron3(nemotronAgent, fileMap, { deep });
      
      // Phase 3: Context Synthesis using Nemotron 3
      const artifacts = await synthesizeContextWithNemotron(nemotronAgent, analysis);
      
      // Phase 4: Packaging with Nemotron metadata
      const packagePath = await createNemotronHandoverPackage(artifacts, outputDir, {
        model: "nemotron-3-super-free",
        contextWindow: 1000000,
        integrationMethod: nemotronIntegrationMethod
      });
      
      return {
        success: true,
        message: `Nemotron 3 scan complete (1M token context, no truncation). Package at: ${packagePath}`,
        packagePath,
        stats: {
          filesAnalyzed: fileMap.totalFiles,
          claimsVerified: analysis.evidence.verifiedClaims,
          timeElapsed: Date.now() - startTime,
          model: "nemotron-3-super-free",
          contextWindow: "1,000,000 tokens",
          truncationBypass: "SUCCESS"
        }
      };
      
    } catch (error) {
      if (error.message.includes('Nemotron') || error.message.includes('integration')) {
        // Helpful error for missing Nemotron integration
        return {
          success: false,
          message: `Nemotron 3 integration required. Search OpenCode for:\n` +
                   `1. 'nemotron-3-super-free' in configuration\n` +
                   `2. Nemotron agent initialization patterns\n` +
                   `3. OpenCode Zen model integrations\n` +
                   `Error: ${error.message}`,
          requiresNemotron: true
        };
      }
      throw error;
    }
  },
  
  help: `
Usage: /nemotron-scan <target_path> [output_dir] [--deep]

REQUIRES: Nemotron 3 Super Free model integration in OpenCode Zen (1M token context)

Examples:
  /nemotron-scan /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
  /nemotron-scan /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein /tmp/analysis --deep

KEY FEATURES:
- Uses Nemotron 3 Super Free (1,000,000 token context window)
- Bypasses OpenCode-Ultra truncation limits (no 2000 line limit)
- Full file content analysis with deep pattern recognition
- AST-aware structural analysis with --deep flag

Outputs Planning Brain Handover Package with:
- V4_CONTEXT_LIBRARY.md (evidence-based analysis with code citations)
- V3_Planning_Brain_Context.md (strategic roadmap using Nemotron insights)
- NEXT_STEPS_PROMPT.md (actionable tasks prioritized by Nemotron analysis)
- build-transcript.md (methodology and Nemotron 3 integration details)

INTEGRATION NOTE: This skill requires Nemotron 3 to be natively integrated into OpenCode Zen.
Search for 'nemotron-3-super-free' in OpenCode configuration files.
`
};
```

## 📚 REFERENCES & INTEGRATION GUIDANCE

### Source Material
- Planning Brain Handover Package (`/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Planning Brain Handover Package/`)
- V4_CONTEXT_LIBRARY.md - Evidence table format and analysis methodology
- Manual Nemotron scan process from chat transcript
- **Nemotron 3 Integration Documentation** - Search OpenCode for Nemotron configuration

### Nemotron 3 Integration Points to Search
The build agent must locate Nemotron 3 in OpenCode by searching for:

1. **Configuration Files**:
   - `opencode.json` - Model configuration
   - `.opencode/config` - Agent settings
   - `package.json` - Dependencies and plugins

2. **Agent Initialization**:
   - `new NemotronAgent()` or similar constructors
   - `spawn_agent({ agent: "nemotron" })` patterns
   - Model registry or factory patterns

3. **Environment Variables**:
   - `OPENCODE_MODEL="nemotron-3-super-free"`
   - `NEMOTRON_CONTEXT=1000000`
   - Model selection environment variables

4. **Plugin System**:
   - `.opencode/plugins/nemotron/`
   - Plugin registration patterns
   - Skill integration points

### OpenCode Tools (With Nemotron Bypass)
- **Nemotron 3 native integration** - NOT `batch_read` (bypasses truncation)
- **Direct model analysis** - NOT `grep` (uses Nemotron's pattern recognition)
- **Structural understanding** - NOT `ast_search` (Nemotron's AST awareness)
- `glob` - Still useful for file discovery
- `read`/`write` - For output generation only

### Constraints to Preserve
- **No truncation** - Use Nemotron 3's 1M token context (CRITICAL)
- **Evidence-based** - Code citations from full file analysis
- **YOLO-compatible** - Detect bypass mechanisms in code
- **Anti-slop aware** - Identify theatrical patterns with Nemotron
- **Performance optimized** - Leverage Nemotron's native large context handling

### Verification Checklist
- [ ] Nemotron 3 agent successfully initialized
- [ ] 1M token context window confirmed
- [ ] OpenCode-Ultra truncation bypass verified
- [ ] Full file content analysis (no 2000 line limit)
- [ ] Evidence tables include exact file:line citations
- [ ] Architecture diagrams generated from structural analysis
- [ ] Handover package matches Planning Brain template structure

---

**BUILD READY** - This specification provides complete guidance for building a Nemotron Scan skill that automates deep codebase analysis and generates Planning Brain-ready handover packages.
