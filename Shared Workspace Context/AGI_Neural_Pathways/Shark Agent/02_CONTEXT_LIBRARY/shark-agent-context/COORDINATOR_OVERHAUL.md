# COORDINATOR OVERHAUL: REASONING‑CHAIN ENFORCEMENT + vLLM INTEGRATION

**Date:** March 28, 2026  
**Status:** Plan – Ready for Implementation  
**Primary Goal:** Mechanically enforce gold‑standard reasoning chains across all Shark CLI coordinators, integrate vLLM as primary execution brain, and replace instruction‑following reliance with programmatic validation + auto‑retry loops.

---

## 1. CONTEXT: WHAT WE ARE DOING AND WHY

### Current State
- **Micro Engineer**: Uses Gemma 3 4B as hard‑coded execution brain (`coordinator‑micro.ts`).
- **Macro Engineer**: Uses GLM 4.7/4.5‑flash as primary brain with DeepSeek advisory (`coordinator‑macro.ts`).
- **Reliance on prompts**: The existing architecture depends on agent instruction‑following to produce correct reasoning‑chain output.
- **No mechanical validation**: There is no programmatic enforcement of the gold‑standard reasoning pattern defined in `SHARK‑REASONING‑CHAIN.md`.

### The Problem
Agents can (and do) ignore the reasoning‑chain requirements, producing opaque, unverified, or hallucinated output. The current system treats the reasoning chain as a suggestion, not a requirement.

### The Solution
1. **Hard‑code validation rules** from the gold‑standard artifacts:
   - `SHARK‑REASONING‑CHAIN.md` – Defines the 5‑phase reasoning pattern and evidence hierarchy.
   - `AGENT_BUILD_LOGIC_CHAIN.md` – Shows real‑world execution of the pattern (843 lines).
   - `SPACE_INVADERS_BUILD_LOG.md` – Demonstrates parallel orchestration with quality gates.
2. **Integrate vLLM + Qwen 2.5 7B** as the primary execution brain for Micro Engineer (already present in Opencode).
3. **Make execution brains pluggable** – MicroCoordinator should support `vllm` (default) or `gemma` (fallback/compatibility).
4. **Add automatic validation + retry** – Every coordinator output passes through a validation layer; missing reasoning‑chain markers trigger a 3‑attempt retry loop with DeepSeek diagnosis.
5. **Log all compliance data** to `.shark/reasoning.log` for auditability.

### Why This Matters
- **Eliminates hallucination** – Agents must provide evidence, not claims.
- **Enforces transparency** – Every thought, action, and result is documented.
- **Improves reliability** – Validation catches reasoning‑chain violations before they affect output.
- **Maintains backward compatibility** – Existing configurations (Gemma, GLM, DeepSeek) continue to work unchanged.
- **Scales to any brain** – The validation layer works with vLLM, Gemma, GLM, or any future execution brain.

---

## 2. MASTER PROMPT + CONTEXT

### The Prompt (Copy‑Paste Ready)

```
🧠 REASONING‑CHAIN ENFORCEMENT: GLM 5 BUILD AGENT WORKFLOW – OVERHAULED

Executive Summary
Integrate mechanical reasoning‑chain enforcement into the Shark CLI coordinator architecture by hard‑coding validation rules from the gold‑standard artifacts (SHARK‑REASONING‑CHAIN.md, AGENT_BUILD_LOGIC_CHAIN.md, SPACE_INVADERS_BUILD_LOG.md). Replace the current reliance on agent instruction‑following with programmatic validation + auto‑retry loops, and update the coordinator architecture to reflect the new execution‑brain strategy:

- **Micro Engineer**: vLLM + Qwen 2.5 7B as primary execution brain (already integrated in Opencode), with Gemma 3 4B as a fallback/compatibility option.
- **Macro Engineer**: GLM 5 (or GLM 4.7/4.5‑flash) as primary execution brain, with DeepSeek R1 providing strategic advisory.
- **Reasoning‑chain validation**: Mechanically enforce the 5‑phase reasoning pattern (Thought, Action Taken, Result, My Assessment, What I Should Have Done) across all brain types, backed by automatic validation and a 3‑attempt retry loop.

Key Changes from Original Prompt
1. **Pluggable execution brains** – MicroCoordinator no longer hard‑codes Gemma; it now accepts a configurable `vllm` or `gemma` brain (default: vLLM).
2. **Validation‑first architecture** – Every coordinator call passes through a `reasoning‑validator.ts` that checks for the required reasoning‑chain markers; missing markers trigger an automatic retry with diagnostic feedback from DeepSeek.
3. **Structured logging** – All reasoning‑chain compliance is logged to `.shark/reasoning.log` in the workspace for auditability.
4. **Backward compatibility** – Existing configurations (Gemma, GLM 4.7, DeepSeek) continue to work unchanged; the validation layer is additive.
5. **Macro‑engineer workflow** – GLM 5 (or current GLM 4.7) remains the primary execution brain for MacroCoordinator, with DeepSeek advisory enhanced to validate reasoning‑chain format.

Validation Rules (Hard‑Coded from Gold‑Standard Artifacts)
- **Required markers**: `Thought`, `Action Taken`, `Result`, `My Assessment`, `What I Should Have Done`.
- **Optional marker**: `Critical Observation`.
- **Phase enforcement**: Each execution step must follow the 5‑phase testing structure (Problem Decomposition, Execution with Documentation, Research & Pivot, Configuration Investigation, Component Verification, Root Cause Analysis).
- **Evidence hierarchy**: Claims must be backed by strong evidence (exit codes, file existence, HTTP logs, etc.); weak evidence triggers a validation failure.
- **Self‑correction protocol**: Failures must be acknowledged immediately and followed by documented pivots.

Implementation Plan
1. **Create validation modules** – `src/brain/reasoning‑validator.ts` (hard‑coded constants/functions) and `src/brain/reasoning‑logger.ts` (structured logging).
2. **Implement vLLM integration** – Create `src/brain/vllm.ts` client and update `coordinator‑micro.ts` to use configurable execution brains.
3. **Enhance BaseCoordinator** – Add state‑machine methods (`validateReasoningChain`, `retryWithDiagnosis`) and integrate logging.
4. **Update brain clients** – Add `diagnose()` method to `DeepSeekClient` for validation‑failure analysis; update prompts for all execution brains to require reasoning‑chain format.
5. **Integrate validation into coordinators** – Modify `MicroCoordinator` and `MacroCoordinator` to call validation before accepting output; implement 3‑attempt retry loops with DeepSeek diagnosis.
6. **Testing** – Write unit tests for validation logic and integration tests for coordinator flows.
7. **Documentation** – Update architecture docs and create a user guide for vLLM setup.

Expected Outcome
A coordinator architecture that **mechanically enforces** the gold‑standard reasoning chain across all brain types, eliminating reliance on instruction‑following alone. The system will automatically detect and correct reasoning‑chain violations, log all compliance data, and maintain full backward compatibility while making vLLM + Qwen 2.5 7B the default execution brain for Micro Engineer.
```

### How to Use This Prompt
1. **For planning** – Give this prompt to a strategic agent (Metis/Oracle) to break down the work into parallel execution waves.
2. **For implementation** – Give this prompt to a deep‑implementation agent (Hephaestus) with access to the Shark‑agent codebase.
3. **For review** – Give this prompt to a code‑review agent (Momus) to verify the validation logic matches the gold‑standard artifacts.
4. **For integration** – Use this prompt as the single source of truth for all coordinator‑overhaul work.

### Why This Prompt Exists
- **Single source of truth** – Captures the complete overhaul specification in one place.
- **Self‑contained** – Includes all necessary context, validation rules, and implementation steps.
- **Actionable** – Can be handed directly to a build agent without additional explanation.
- **Traceable** – Links every requirement back to the gold‑standard artifacts.

---

## 3. CLEAR BUILD WORKFLOW FOR THE BUILD AGENT

### Prerequisites
- **Codebase location**: `/home/leviathan/OPENCODE_WORKSPACE/shark‑frankenstein/`
- **Gold‑standard artifacts**:
  - `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Shark Agent Context/Agent OS/SHARK‑REASONING‑CHAIN.md`
  - `/home/leviathan/OPENCODE_WORKSPACE/AGENT_BUILD_LOGIC_CHAIN.md`
  - `/home/leviathan/OPENCODE_WORKSPACE/SPACE_INVADERS_BUILD_LOG.md`
- **Existing coordinator files**:
  - `src/brain/coordinator‑base.ts`
  - `src/brain/coordinator‑micro.ts`
  - `src/brain/coordinator‑macro.ts`
  - `src/brain/deepseek.ts`
  - `src/brain/gemma.ts`
  - `src/brain/glm.ts`
  - `src/brain/types.ts`

### Step‑by‑Step Implementation

#### Step 1: Create Validation Modules
**File**: `src/brain/reasoning‑validator.ts`
- Export a `ReasoningValidator` class with:
  - `validateChain(content: string): ValidationResult` – checks for required markers.
  - `extractPhases(content: string): Phase[]` – parses the 5‑phase structure.
  - `checkEvidence(content: string): EvidenceScore` – evaluates evidence hierarchy.
- Hard‑code the required markers and phase definitions from the gold‑standard artifacts.
- Include unit tests in `src/brain/__tests__/reasoning‑validator.test.ts`.

**File**: `src/brain/reasoning‑logger.ts`
- Export a `ReasoningLogger` class that writes to `$WORKSPACE/.shark/reasoning.log`.
- Structured JSON log format: `{ timestamp, brainType, validationResult, retryCount, diagnosis }`.
- Rotate logs after 10MB.

#### Step 2: Implement vLLM Client
**File**: `src/brain/vllm.ts`
- Create `VLLMClient` class implementing the same interface as `GemmaClient` and `GLMClient`.
- Configuration: `{ endpoint: string, model: string, temperature: number }`.
- Default endpoint: `http://localhost:8000/v1/completions` (local vLLM server).
- Default model: `Qwen2.5‑7B‑Instruct`.
- Include prompts that **require** reasoning‑chain format in the system message.

#### Step 3: Update MicroCoordinator for Pluggable Brains
**File**: `src/brain/coordinator‑micro.ts`
- Change `executionBrain: GemmaClient` to `executionBrain: BrainClient` (interface).
- Add config option `executionBrainType: 'vllm' | 'gemma'` (default: 'vllm').
- Initialize the appropriate client based on config.
- Update `getConfigStatus()` to show which brain is active.

#### Step 4: Enhance BaseCoordinator with Validation
**File**: `src/brain/coordinator‑base.ts`
- Add protected methods:
  - `validateAndRetry(content: string, brainType: BrainType): Promise<string>` – calls validator, retries up to 3 times, logs failures.
  - `getDiagnosisFromDeepSeek(failure: ValidationResult): Promise<string>` – uses DeepSeek’s new `diagnose()` method.
- Integrate `ReasoningLogger` for all validation events.

#### Step 5: Update Brain Clients for Reasoning‑Chain Prompts
**Files**: `src/brain/deepseek.ts`, `src/brain/gemma.ts`, `src/brain/glm.ts`, `src/brain/vllm.ts`
- Add system‑prompt constants that explicitly require the 5‑phase reasoning format.
- In `DeepSeekClient`, add `diagnose(validationFailure: string): Promise<string>` method that asks DeepSeek to analyze why reasoning‑chain validation failed.
- Ensure all `execute()` methods include the reasoning‑chain requirement in their prompts.

#### Step 6: Integrate Validation into Coordinators
**File**: `src/brain/coordinator‑micro.ts`
- Wrap every call to `executionBrain.execute()` with `validateAndRetry()`.
- Feed validation failures to DeepSeek diagnosis before retry.
- Log each attempt.

**File**: `src/brain/coordinator‑macro.ts`
- Same as MicroCoordinator, but for GLM execution brain.
- Also validate DeepSeek advisory outputs for reasoning‑chain compliance.

#### Step 7: Update Configuration and Types
**File**: `src/brain/types.ts`
- Add `BrainClient` interface that all brain clients implement.
- Add `ValidationResult`, `Phase`, `EvidenceScore` types.
- Add `ExecutionBrainType` union.

**File**: `src/config/index.ts`
- Add environment variables: `VLLM_ENDPOINT`, `VLLM_MODEL`, `EXECUTION_BRAIN_TYPE`.
- Default `EXECUTION_BRAIN_TYPE='vllm'`.

#### Step 8: Write Tests
- Unit tests for `ReasoningValidator` (100% coverage of validation rules).
- Integration tests for `MicroCoordinator` with both vLLM and Gemma brains.
- Integration tests for `MacroCoordinator` with GLM + DeepSeek.
- Test retry loop with mocked validation failures.

#### Step 9: Documentation
- Update `README.md` with new vLLM setup instructions.
- Create `docs/reasoning‑chain‑enforcement.md` explaining the validation system.
- Update `docs/architecture.md` with the new pluggable‑brain architecture.

### Expected Outputs
1. **New files**:
   - `src/brain/reasoning‑validator.ts`
   - `src/brain/reasoning‑logger.ts`
   - `src/brain/vllm.ts`
2. **Modified files**:
   - `src/brain/coordinator‑base.ts`
   - `src/brain/coordinator‑micro.ts`
   - `src/brain/coordinator‑macro.ts`
   - `src/brain/deepseek.ts`
   - `src/brain/gemma.ts`
   - `src/brain/glm.ts`
   - `src/brain/types.ts`
   - `src/config/index.ts`
3. **Test files**:
   - `src/brain/__tests__/reasoning‑validator.test.ts`
   - `src/brain/__tests__/vllm.test.ts`
   - `src/integration/coordinator‑validation.test.ts`
4. **Log location**: `$WORKSPACE/.shark/reasoning.log` (created on first run).

### Success Criteria
- All existing tests pass.
- New validation unit tests pass with 100% coverage of required markers.
- MicroCoordinator can be configured with `vllm` or `gemma` brain.
- Missing reasoning‑chain markers trigger a retry loop (max 3 attempts).
- Validation failures are logged with DeepSeek diagnosis.
- The system works with the existing Gemma, GLM, and DeepSeek configurations unchanged.
- The vLLM client successfully connects to a local vLLM server (if running).

---

## 4. NEXT STEPS

1. **Review this document** for completeness and accuracy.
2. **Assign to build agent** – Use the master prompt and this workflow.
3. **Monitor implementation** – Check logs at `.shark/reasoning.log`.
4. **Verify backward compatibility** – Ensure existing Shark CLI commands still work.
5. **Update user documentation** – After successful implementation, create a quick‑start guide for vLLM setup.

---

**Key Principle:** This overhaul makes the reasoning chain **mechanically enforced**, not just suggested. The validation layer becomes the “brick wall” that ensures every agent output follows the gold‑standard pattern documented in the Shark Agent Context.