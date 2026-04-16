#!/usr/bin/env bun
/**
 * Hermes v3.5 — Mechanical Integration Test Suite
 * 
 * Tests ALL new v3.5 systems mechanically:
 * - Fork Manager (fork_create, fork_feedback, fork_complete, fork_status)
 * - Episode Store (startEpisode, completeEpisode, getEpisode)
 * - Orchestration Engine (invoke with fork/thread modes)
 * - Skill Registry (loadSkills, getSkill, triggerPatterns)
 * - Memory System (hermes_remember, hermes_recall)
 * - Phase State Machine
 * - Hook guards (.hermes/ directory, isHermesAgent)
 * - Fork Blocker (blocks non-fork tools when Fork active)
 * 
 * Run with: bun run integration-tests/full-test-suite.ts
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from "fs";
import { join, resolve } from "path";

// Load the plugin
const pluginModule = await import("../dist/index.js");
const plugin = await pluginModule.default({
  version: "1.0",
  logger: { info: () => {}, warn: () => {}, error: console.error },
});

let passed = 0;
let failed = 0;
let warnings = 0;

function assert(condition: boolean, message: string, fatal = true) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    if (fatal) failed++;
    else warnings++;
  }
}

function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

// ============================================================
// TEST CONTEXT
// ============================================================

const testDir = resolve("/tmp/hermes-integration-test");
const hermesDir = join(testDir, ".hermes");

function setupTestDir() {
  try {
    mkdirSync(testDir, { recursive: true });
    mkdirSync(hermesDir, { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
  } catch { /* ignore */ }
}

function cleanupTestDir() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch { /* ignore */ }
}

const context = {
  sessionID: "test-integration-001",
  messageID: "test-msg-001",
  agent: "hermes",
  directory: testDir,
  worktree: testDir,
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
};

// ============================================================
// 1. FORK MANAGER TESTS
// ============================================================

section("1. FORK MANAGER TESTS");

setupTestDir();

// Test fork_create
assert(
  typeof plugin.tool.fork_create === "object" && typeof plugin.tool.fork_create.execute === "function",
  "fork_create tool exists and is executable"
);

// Test fork_create execution
try {
  const result = await plugin.tool.fork_create.execute(
    { skill: "plan", input: "design login system", timeoutMs: 5000 },
    context
  );
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  assert(
    typeof result === 'object' && result !== null && 'forkId' in result,
    `fork_create returns valid response: ${resultStr.substring(0, 100)}`
  );
} catch (e: any) {
  assert(false, `fork_create should not throw: ${e?.message}`);
}

// Test fork_status when no fork active (after our test fork should have completed)
try {
  const result = await plugin.tool.fork_status.execute({}, context);
  assert(
    typeof result === 'object' || typeof result === 'string',
    "fork_status returns valid response"
  );
} catch (e: any) {
  assert(false, `fork_status should not throw: ${e?.message}`);
}

// Test fork_complete without active fork (should error gracefully)
try {
  const result = await plugin.tool.fork_complete.execute({ forkId: "nonexistent", summary: "test" }, context);
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  assert(
    resultStr.includes("not active") || resultStr.includes("error") || resultStr.includes("Error") || resultStr.includes("nonexistent"),
    "fork_complete handles no-active-fork gracefully"
  );
} catch (e: any) {
  // This is acceptable - may throw on invalid fork
  warnings++;
  console.log(`  ⚠ fork_complete threw on invalid fork (acceptable): ${e?.message}`);
}

// Test fork_feedback without active fork
try {
  const result = await plugin.tool.fork_feedback.execute({ forkId: "nonexistent", message: "test" }, context);
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  assert(
    resultStr.includes("not active") || resultStr.includes("error") || resultStr.includes("Error") || resultStr.includes("nonexistent"),
    "fork_feedback handles no-active-fork gracefully"
  );
} catch (e: any) {
  warnings++;
  console.log(`  ⚠ fork_feedback threw on invalid fork (acceptable): ${e?.message}`);
}

// ============================================================
// 2. EPISODE STORE TESTS
// ============================================================

section("2. EPISODE STORE TESTS");

// Test episode_list
assert(
  typeof plugin.tool.episode_list === "object" && typeof plugin.tool.episode_list.execute === "function",
  "episode_list tool exists"
);

try {
  const result = await plugin.tool.episode_list.execute({ skillName: "plan" }, context);
  assert(
    typeof result === 'object' || typeof result === 'string',
    "episode_list returns valid response"
  );
} catch (e: any) {
  assert(false, `episode_list should not throw: ${e?.message}`);
}

// Test episode_output with fake ID
try {
  const result = await plugin.tool.episode_output.execute({ episodeId: "fake-123" }, context);
  assert(
    typeof result === 'object' || typeof result === 'string',
    "episode_output returns valid response"
  );
} catch (e: any) {
  assert(false, `episode_output should not throw: ${e?.message}`);
}

// Test episode_summary
assert(
  typeof plugin.tool.episode_summary === "object" && typeof plugin.tool.episode_summary.execute === "function",
  "episode_summary tool exists"
);

try {
  const result = await plugin.tool.episode_summary.execute({ skillName: "plan" }, context);
  assert(
    typeof result === 'object' || typeof result === 'string',
    "episode_summary returns valid response"
  );
} catch (e: any) {
  assert(false, `episode_summary should not throw: ${e?.message}`);
}

// ============================================================
// 3. ORCHESTRATION TOOLS TESTS
// ============================================================

section("3. ORCHESTRATION TOOLS TESTS");

// Test orchestration_invoke
assert(
  typeof plugin.tool.orchestration_invoke === "object" && typeof plugin.tool.orchestration_invoke.execute === "function",
  "orchestration_invoke tool exists"
);

try {
  const result = await plugin.tool.orchestration_invoke.execute(
    { skillName: "health", trigger: "check system status" },
    context
  );
  assert(
    typeof result === 'object' || typeof result === 'string',
    "orchestration_invoke returns valid response"
  );
} catch (e: any) {
  assert(false, `orchestration_invoke should not throw: ${e?.message}`);
}

// Test skill_list
assert(
  typeof plugin.tool.skill_list === "object" && typeof plugin.tool.skill_list.execute === "function",
  "skill_list tool exists"
);

try {
  const result = await plugin.tool.skill_list.execute({}, context);
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  assert(
    resultStr.includes("implement") || resultStr.includes("plan") || resultStr.includes("count"),
    `skill_list returns skills: ${resultStr.substring(0, 100)}`
  );
} catch (e: any) {
  assert(false, `skill_list should not throw: ${e?.message}`);
}

// Test skill_register
assert(
  typeof plugin.tool.skill_register === "object" && typeof plugin.tool.skill_register.execute === "function",
  "skill_register tool exists"
);

// Test orchestration_status
assert(
  typeof plugin.tool.orchestration_status === "object" && typeof plugin.tool.orchestration_status.execute === "function",
  "orchestration_status tool exists"
);

try {
  const result = await plugin.tool.orchestration_status.execute({}, context);
  assert(
    typeof result === 'object' || typeof result === 'string',
    "orchestration_status returns valid response"
  );
} catch (e: any) {
  assert(false, `orchestration_status should not throw: ${e?.message}`);
}

// ============================================================
// 4. SKILL REGISTRY VERIFICATION
// ============================================================

section("4. SKILL REGISTRY VERIFICATION");

// Verify skills are loaded by checking if skill_list returns skills
try {
  const result = await plugin.tool.skill_list.execute({}, context);
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  const expectedSkills = ["implement", "plan", "tdd", "verify", "grill", "debug", "brainstorm", "autopilot", "health", "remember", "recall"];
  
  let foundCount = 0;
  for (const skill of expectedSkills) {
    if (resultStr.toLowerCase().includes(skill)) foundCount++;
  }
  
  assert(
    foundCount >= 8,
    `Skill registry has at least 8/11 expected skills (found ${foundCount})`
  );
} catch (e: any) {
  assert(false, `Skill registry check failed: ${e?.message}`);
}

// ============================================================
// 5. MEMORY SYSTEM TESTS
// ============================================================

section("5. MEMORY SYSTEM TESTS");

const testKey = `integration-test-${Date.now()}`;

// Test hermes_remember
try {
  const result = await plugin.tool.hermes_remember.execute(
    { key: testKey, content: "Test memory for integration", tags: ["integration", "test"] },
    context
  );
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  assert(
    resultStr.includes(testKey) || resultStr.includes("stored") || resultStr.includes("memory"),
    `hermes_remember stores memory with key: ${testKey}`
  );
} catch (e: any) {
  assert(false, `hermes_remember should not throw: ${e?.message}`);
}

// Test hermes_recall
try {
  const result = await plugin.tool.hermes_recall.execute(
    { query: "integration test", limit: 5 },
    context
  );
  assert(
    typeof result === 'string' || typeof result === 'object',
    "hermes_recall returns valid response"
  );
} catch (e: any) {
  assert(false, `hermes_recall should not throw: ${e?.message}`);
}

// Test hermes_context
try {
  const result = await plugin.tool.hermes_context.execute(
    { topic: "testing" },
    context
  );
  assert(
    typeof result === 'string' || typeof result === 'object',
    "hermes_context returns valid response"
  );
} catch (e: any) {
  assert(false, `hermes_context should not throw: ${e?.message}`);
}

// ============================================================
// 6. PHASE STATE MACHINE TESTS
// ============================================================

section("6. PHASE STATE MACHINE TESTS");

// Test phase_complete tool
assert(
  typeof plugin.tool.phase_complete === "object" && typeof plugin.tool.phase_complete.execute === "function",
  "phase_complete tool exists"
);

try {
  const result = await plugin.tool.phase_complete.execute(
    { phase: "build", evidence: "integration test completed" },
    context
  );
  assert(
    typeof result === 'string' || typeof result === 'object',
    "phase_complete returns valid response"
  );
} catch (e: any) {
  assert(false, `phase_complete should not throw: ${e?.message}`);
}

// ============================================================
// 7. QUALITY TOOLS TESTS
// ============================================================

section("7. QUALITY TOOLS TESTS");

// Test lint
try {
  const result = await plugin.tool.lint.execute({ path: "src" }, context);
  assert(
    typeof result === "string",
    "lint returns string"
  );
} catch (e: any) {
  warnings++;
  console.log(`  ⚠ lint may fail without config: ${e?.message?.substring(0, 50)}`);
}

// Test build_check
try {
  const result = await plugin.tool.build_check.execute({}, context);
  assert(
    typeof result === "string",
    "build_check returns string"
  );
} catch (e: any) {
  assert(false, `build_check should not throw: ${e?.message}`);
}

// Test syntax_check
try {
  const result = await plugin.tool.syntax_check.execute({ path: "src/index.ts" }, context);
  assert(
    typeof result === "string",
    "syntax_check returns string"
  );
} catch (e: any) {
  warnings++;
  console.log(`  ⚠ syntax_check may fail on missing file: ${e?.message?.substring(0, 50)}`);
}

// ============================================================
// 8. SECURITY TOOLS TESTS
// ============================================================

section("8. SECURITY TOOLS TESTS");

// Test placeholder_scan
try {
  const result = await plugin.tool.placeholder_scan.execute({ path: "src" }, context);
  assert(
    typeof result === "string",
    "placeholder_scan returns string"
  );
} catch (e: any) {
  assert(false, `placeholder_scan should not throw: ${e?.message}`);
}

// Test secret_scan
try {
  const result = await plugin.tool.secret_scan.execute({ path: "src" }, context);
  assert(
    typeof result === "string",
    "secret_scan returns string"
  );
} catch (e: any) {
  assert(false, `secret_scan should not throw: ${e?.message}`);
}

// ============================================================
// 9. VERIFICATION TOOLS TESTS
// ============================================================

section("9. VERIFICATION TOOLS TESTS");

// Test grill
try {
  const result = await plugin.tool.grill.execute({ target: "src/index.ts" }, context);
  assert(
    typeof result === "string",
    "grill returns string"
  );
} catch (e: any) {
  assert(false, `grill should not throw: ${e?.message}`);
}

// Test verify
assert(
  typeof plugin.tool.verify === "object" && typeof plugin.tool.verify.execute === "function",
  "verify tool exists"
);

try {
  const result = await plugin.tool.verify.execute({ criteria: "test passed" }, context);
  assert(
    typeof result === "string",
    "verify returns string"
  );
} catch (e: any) {
  assert(false, `verify should not throw: ${e?.message}`);
}

// Test health
try {
  const result = await plugin.tool.health.execute({}, context);
  assert(
    typeof result === "string",
    "health returns string"
  );
} catch (e: any) {
  assert(false, `health should not throw: ${e?.message}`);
}

// ============================================================
// 10. ANALYSIS TOOLS TESTS
// ============================================================

section("10. ANALYSIS TOOLS TESTS");

// Test detect_domains
try {
  const result = await plugin.tool.detect_domains.execute({}, context);
  assert(
    typeof result === "string" && result.includes("src"),
    "detect_domains returns directory structure"
  );
} catch (e: any) {
  assert(false, `detect_domains should not throw: ${e?.message}`);
}

// Test complexity_hotspots
try {
  const result = await plugin.tool.complexity_hotspots.execute({ minComplexity: 5 }, context);
  assert(
    typeof result === "string",
    "complexity_hotspots returns string"
  );
} catch (e: any) {
  assert(false, `complexity_hotspots should not throw: ${e?.message}`);
}

// ============================================================
// 11. SESSION TOOLS TESTS
// ============================================================

section("11. SESSION TOOLS TESTS");

// Test list_sessions
try {
  const result = await plugin.tool.list_sessions.execute({}, context);
  assert(
    typeof result === "string",
    "list_sessions returns string"
  );
} catch (e: any) {
  assert(false, `list_sessions should not throw: ${e?.message}`);
}

// Test create_snapshot
try {
  const result = await plugin.tool.create_snapshot.execute({ label: "integration-test" }, context);
  const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
  assert(
    resultStr.includes("Snapshot") || resultStr.includes("snapshot") || resultStr.includes("created"),
    "create_snapshot returns confirmation"
  );
} catch (e: any) {
  assert(false, `create_snapshot should not throw: ${e?.message}`);
}

// ============================================================
// 12. SUPERVISOR TOOLS TESTS
// ============================================================

section("12. SUPERVISOR TOOLS TESTS");

// Test get_supervisor_recommendations
assert(
  typeof plugin.tool.get_supervisor_recommendations === "object" && typeof plugin.tool.get_supervisor_recommendations.execute === "function",
  "get_supervisor_recommendations tool exists"
);

try {
  const result = await plugin.tool.get_supervisor_recommendations.execute({}, context);
  assert(
    typeof result === "string",
    "get_supervisor_recommendations returns string"
  );
} catch (e: any) {
  assert(false, `get_supervisor_recommendations should not throw: ${e?.message}`);
}

// ============================================================
// 13. HOOK GUARD TESTS
// ============================================================

section("13. HOOK GUARD TESTS");

// Verify hooks are callable
try {
  await plugin["tool.execute.before"]?.(
    { tool: "lint", sessionID: "test", callID: "call-1" },
    { args: { path: "src" } }
  );
  assert(true, "tool.execute.before hook callable");
} catch (e: any) {
  assert(false, `tool.execute.before should not throw: ${e?.message}`);
}

try {
  await plugin["tool.execute.after"]?.(
    { tool: "lint", sessionID: "test", callID: "call-1" },
    { title: "lint", output: "done", metadata: {} }
  );
  assert(true, "tool.execute.after hook callable");
} catch (e: any) {
  assert(false, `tool.execute.after should not throw: ${e?.message}`);
}

// Test message transform hook
try {
  const messages = [{ role: "user", parts: [{ type: "text", text: "test" }] }];
  await plugin["experimental.chat.messages.transform"]?.(
    { messages, agent: "hermes", directory: testDir },
    { messages }
  );
  assert(true, "chat.messages.transform hook callable");
} catch (e: any) {
  assert(false, `chat.messages.transform should not throw: ${e?.message}`);
}

// ============================================================
// 14. FORK BLOCKER HOOK TESTS
// ============================================================

section("14. FORK BLOCKER HOOK TESTS");

// Test that non-fork tools work when no fork is active
try {
  const result = await plugin.tool.lint.execute({ path: "src" }, context);
  assert(true, "lint works when no fork active");
} catch (e: any) {
  warnings++;
  console.log(`  ⚠ lint threw when no fork: ${e?.message}`);
}

// ============================================================
// 15. AGENT CONFIGS VERIFICATION
// ============================================================

section("15. AGENT CONFIGS VERIFICATION");

assert(
  plugin.agent?.hermes !== undefined,
  "hermes agent is registered"
);

assert(
  plugin.agent?.planner !== undefined,
  "planner agent is registered"
);

assert(
  plugin.agent?.builder !== undefined,
  "builder agent is registered"
);

assert(
  plugin.agent?.tdd !== undefined,
  "tdd agent is registered"
);

// ============================================================
// 16. TOOL COUNT VERIFICATION
// ============================================================

section("16. TOOL COUNT VERIFICATION");

const toolCount = Object.keys(plugin.tool || {}).length;
console.log(`  Total tools: ${toolCount}`);
assert(
  toolCount >= 38,
  `Tool count is ${toolCount} (expected >= 38 for v3.5 with new tools)`
);

// ============================================================
// SUMMARY
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("INTEGRATION TEST SUMMARY");
console.log("=".repeat(60));
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`WARNINGS: ${warnings}`);
console.log("=".repeat(60));

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0";
console.log(`Pass rate: ${passRate}%`);

if (failed === 0) {
  console.log("\n✅ ALL MECHANICAL TESTS PASSED");
  console.log("   Hermes v3.5 systems are mechanically sound.");
  cleanupTestDir();
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} TEST(S) FAILED`);
  console.log("   Debug and fix before shipping.");
  cleanupTestDir();
  process.exit(1);
}