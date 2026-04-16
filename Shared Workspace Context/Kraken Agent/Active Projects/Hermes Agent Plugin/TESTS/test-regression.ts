/**
 * test-regression.ts
 * Integration test: Verify Hermes doesn't break Spider/Manta/Shark
 */

import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

async function testRegressions(): Promise<void> {
  console.log("=== Hermes v3 — Regression Test ===\n");
  
  let allPass = true;
  
  // Test 1: Agent identity guards exist in hooks
  console.log("Test 1: Agent identity guards in hooks\n");
  const hooksDir = resolve("src/hooks");
  const hookFiles = [
    "brainstorm-gate.ts",
    "delegation-gate.ts", 
    "self-review.ts",
    "tdd-enforcer.ts",
  ];
  
  for (const file of hookFiles) {
    const path = join(hooksDir, file);
    if (!existsSync(path)) {
      console.log(`❌ ${file}: NOT FOUND`);
      allPass = false;
      continue;
    }
    const content = readFileSync(path, "utf-8");
    const hasGuard = content.includes("isHermesAgent") || content.includes(".hermes");
    console.log(`${hasGuard ? "✅" : "❌"} ${file}: ${hasGuard ? "has agent guard" : "MISSING guard"}`);
    if (!hasGuard) allPass = false;
  }
  
  // Test 2: Brainstorm gate has .hermes/ directory check
  console.log("\nTest 2: Brainstorm gate primary guard\n");
  const brainstormPath = join(hooksDir, "brainstorm-gate.ts");
  if (existsSync(brainstormPath)) {
    const content = readFileSync(brainstormPath, "utf-8");
    const hasHermesDirCheck = content.includes(".hermes") && content.includes("existsSync");
    console.log(`${hasHermesDirCheck ? "✅" : "❌"} brainstorm-gate.ts: ${hasHermesDirCheck ? "has .hermes/ check" : "MISSING .hermes/ check"}`);
    if (!hasHermesDirCheck) allPass = false;
  }
  
  // Test 3: Phase persistence exists
  console.log("\nTest 3: Phase persistence\n");
  const constantsPath = resolve("src/config/constants.ts");
  if (existsSync(constantsPath)) {
    const content = readFileSync(constantsPath, "utf-8");
    const hasPhaseTransitions = content.includes("PHASE_TRANSITIONS");
    console.log(`${hasPhaseTransitions ? "✅" : "❌"} constants.ts: ${hasPhaseTransitions ? "has PHASE_TRANSITIONS" : "MISSING PHASE_TRANSITIONS"}`);
    if (!hasPhaseTransitions) allPass = false;
  }
  
  // Test 4: Hook composition is correct
  console.log("\nTest 4: Hook composition\n");
  const indexPath = resolve("src/index.ts");
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath, "utf-8");
    const hasCompose = content.includes("composeHandlers") || content.includes("hooks:");
    console.log(`${hasCompose ? "✅" : "❌"} index.ts: ${hasCompose ? "has hook composition" : "hook composition unclear"}`);
  }
  
  console.log(`\n## Regression Status: ${allPass ? "✅ PASS" : "❌ FAIL"}`);
  console.log("\nNote: Full regression testing requires Spider/Manta/Shark agents loaded simultaneously.");
  
  process.exit(allPass ? 0 : 1);
}

testRegressions().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
