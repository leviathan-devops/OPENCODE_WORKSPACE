# BUILD REPORT PROMPT: Generate Comprehensive Build Report

**Use this prompt after completing a build to generate a detailed, evidence-based build report that includes strategy, implementation, testing, and verification.**

---

## 📋 PROMPT FOR AGENT

**Task**: Create a comprehensive build report documenting the entire process from initial request through implementation, testing, and verification. The report must be evidence-based, include all relevant file links, and serve as a standalone reference for future work.

**Report Structure**:

### 1. EXECUTIVE SUMMARY
- **Project**: Brief description of what was built
- **Status**: Current operational status (✅ Operational / 🔄 In Progress / 📋 Planned)
- **Timeframe**: When the work was performed
- **Key Achievements**: 3-5 bullet points of what was accomplished

### 2. INITIAL CONTEXT & GOALS
- **Original Request**: Quote or summarize the initial prompt/request
- **Business/Technical Goals**: What problems were being solved
- **Success Criteria**: How success was defined/measured

### 3. INVESTIGATION & PLANNING PHASE
- **Systems Analyzed**: What existing systems were examined
- **Constraints Discovered**: Technical, operational, or scope constraints
- **Architecture Decisions**: Key design choices and why they were made
- **Documentation Created**: Links to all planning documents

### 4. IMPLEMENTATION PHASE
- **Actual Files Created** (with timestamps and full paths):
  ```
  - `/full/path/to/file.ext` (YYYY-MM-DD HH:MM UTC) - Purpose/description
  ```
- **Configuration Changes**:
  ```
  - File: `/full/path/to/config.json` - Changes made and why
  ```
- **Code Implemented**:
  ```
  - File: `/full/path/to/script.sh` - Key functions/algorithms implemented
  ```
- **Workarounds/Solutions**: How constraints were addressed

### 5. TESTING & VERIFICATION
- **Test Suites Executed** (with results):
  ```
  - `/full/path/to/test_script.sh` - Results: X/Y tests passed
  ```
- **Manual Testing Performed**:
  ```
  - Test: Description of test - Result: ✅/❌/⚠️
  ```
- **Configuration Validation**:
  ```
  - File: `/full/path/to/config.json` - Validation method and result
  ```
- **Evidence Files**: Links to test logs, screenshots, or output files

### 6. DISCOVERIES & REALITY CHECK
- **Scope Discoveries**: Related projects or systems found during investigation
- **Actual vs Planned**: What was actually built vs what was planned
- **Timestamp Analysis**: Timeline of actual work vs planned schedule
- **Unexpected Challenges**: Problems encountered and how they were resolved

### 7. CURRENT OPERATIONAL STATUS
- **✅ Fully Operational**: List of what works completely
- **🔄 In Progress**: What is partially implemented
- **📋 Planned**: What remains for future work
- **Dependencies**: API keys, services, or configurations required

### 8. NEXT STEPS & RECOMMENDATIONS
- **Immediate Next Steps**: What should happen next (by whom)
- **Build Team Handoff**: If applicable, specific tasks for build team
- **Maintenance Requirements**: Ongoing needs for the system
- **Risk Mitigation**: Known risks and mitigation strategies

### 9. KEY INSIGHTS & LESSONS LEARNED
- **What Worked Well**: 3-5 successful approaches/strategies
- **Critical Lessons**: 3-5 important learnings for future builds
- **AGI Build Best Practices**: Generalized principles derived from this build

### 10. COMPLETE FILE INVENTORY
- **Documentation Files**: All markdown, planning, and spec files
- **Code Files**: All scripts, source code, and configuration files
- **Test Files**: All test scripts, logs, and verification files
- **Evidence Files**: Screenshots, timestamps, validation outputs

---

## 🔍 EVIDENCE REQUIREMENTS

**For every claim in the report, provide:**
1. **File Path**: Full absolute path to relevant file
2. **Timestamp**: File creation/modification time (from `ls -la`)
3. **Content Excerpt**: Relevant 3-5 lines showing key implementation
4. **Test Results**: Specific pass/fail outcomes with evidence
5. **Configuration Validation**: Proof that configs are valid and functional

**Example Evidence Format:**
```
✅ **Claim**: Shark launcher script created
**Evidence**: 
- File: `/home/leviathan/scripts/shark-launcher.sh` (Mar 30 01:02 UTC)
- Content (lines 1-10):
  #!/bin/bash
  # 🦈 SHARK LAUNCHER
  # Simple micro/macro wizard that launches OpenCode with Shark enhancements
  ...
- Test: `bash /home/leviathan/scripts/shark-launcher.sh --help` returns wizard
```

---

## 📊 QUALITY CHECKS

**Before finalizing report, verify:**
- [ ] All file paths are absolute and accessible
- [ ] Timestamps are included for key files
- [ ] Test results are documented with evidence
- [ ] Constraints and workarounds are clearly explained
- [ ] Next steps are actionable and specific
- [ ] No "hallucinated" or theoretical content - only what actually exists
- [ ] Related but separate projects are clearly distinguished
- [ ] Scope boundaries are defined and respected

---

## 🎯 PROMPT FOR AGENT (Condensed Version)

"Create a comprehensive build report following the structure above. Investigate the filesystem to gather evidence, verify timestamps, and document actual implementation. Include full file paths, timestamps, test results, and clear separation between what was planned vs what was implemented. Focus on evidence-based claims, not theoretical plans. The report should enable another agent to continue the work without additional investigation."

---

## 📁 TEMPLATE FOR NEW BUILD REPORTS

```markdown
# BUILD REPORT: [Project Name]

**Date**: [YYYY-MM-DD]  
**Status**: [✅ Operational / 🔄 In Progress / 📋 Planned]  
**Build Duration**: [Start Time] - [End Time]

## 1. Executive Summary

## 2. Initial Context & Goals

## 3. Investigation & Planning Phase

## 4. Implementation Phase

## 5. Testing & Verification

## 6. Discoveries & Reality Check

## 7. Current Operational Status

## 8. Next Steps & Recommendations

## 9. Key Insights & Lessons Learned

## 10. Complete File Inventory

---
**Report Generated**: [Timestamp]  
**Evidence Verified**: [Yes/No with details]  
**Next Agent Instructions**: [Specific tasks for continuation]
```

---

**Usage Notes**:
1. Copy this entire prompt and provide it to an agent after build completion
2. The agent should investigate the filesystem to gather evidence
3. All claims must be supported by file evidence
4. The report should serve as a standalone reference for future work
5. Update the template with project-specific details as needed