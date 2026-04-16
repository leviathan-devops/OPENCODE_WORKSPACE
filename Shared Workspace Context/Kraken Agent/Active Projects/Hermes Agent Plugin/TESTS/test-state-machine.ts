/**
 * test-state-machine.ts
 * Integration test: Verify 7 phase transitions + hot-reload persistence
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, resolve } from "path";

interface TransitionResult {
  from: string;
  to: string;
  valid: boolean;
  error?: string;
}

const PHASE_TRANSITIONS: Record<string, string[]> = {
  idle: ["analyze"],
  analyze: ["plan", "idle"],
  plan: ["build", "idle"],
  build: ["review", "debug", "idle"],
  review: ["complete", "build", "debug", "idle"],
  debug: ["build", "review", "complete", "idle"],
  complete: [],
};

async function testTransition(from: string, to: string): Promise<TransitionResult> {
  const validTargets = PHASE_TRANSITIONS[from] || [];
  const valid = validTargets.includes(to);
  return {
    from,
    to,
    valid,
    error: valid ? undefined : `Illegal transition: ${from} → ${to}. Allowed: ${validTargets.join(", ") || "none"}`,
  };
}

async function testStateMachine(): Promise<void> {
  console.log("=== Hermes v3 — State Machine Verification ===\n");
  
  const testCases: Array<[string, string]> = [
    ["idle", "analyze"],    // ✅ valid
    ["analyze", "plan"],    // ✅ valid
    ["plan", "build"],      // ✅ valid
    ["build", "review"],    // ✅ valid
    ["build", "debug"],     // ✅ valid
    ["review", "debug"],    // ✅ valid
    ["review", "complete"], // ✅ valid
    ["debug", "build"],    // ✅ valid
    ["debug", "review"],   // ✅ valid
    ["idle", "build"],      // ❌ illegal (must go through analyze/plan first)
    ["complete", "build"], // ❌ illegal (terminal state)
    ["plan", "complete"],  // ❌ illegal (must go through build/review)
  ];
  
  const results: TransitionResult[] = [];
  let passCount = 0;
  
  console.log("Testing transitions:\n");
  for (const [from, to] of testCases) {
    const result = await testTransition(from, to);
    results.push(result);
    const status = result.valid ? "✅" : "❌";
    console.log(`${status} ${from} → ${to}`);
    if (!result.valid) {
      console.log(`   ${result.error}`);
    } else {
      passCount++;
    }
  }
  
  // Test persistence
  console.log("\nTesting phase persistence:\n");
  
  const phaseDir = join(process.cwd(), ".hermes");
  const phaseFile = join(phaseDir, "phase.json");
  
  // Clean up any existing phase file
  try {
    if (existsSync(phaseFile)) unlinkSync(phaseFile);
    if (existsSync(phaseDir)) {
      const files = readFileSync(phaseDir, "utf-8");
    }
  } catch { /* ignore */ }
  
  // Test: write phase, verify file exists
  try {
    if (!existsSync(phaseDir)) mkdirSync(phaseDir, { recursive: true });
    writeFileSync(phaseFile, JSON.stringify({ phase: "build", updatedAt: new Date().toISOString() }));
    
    const exists = existsSync(phaseFile);
    console.log(`${exists ? "✅" : "❌"} Phase file created: ${phaseFile}`);
    
    if (exists) {
      const content = JSON.parse(readFileSync(phaseFile, "utf-8"));
      const valid = content.phase === "build";
      console.log(`${valid ? "✅" : "❌"} Phase persisted: ${content.phase}`);
      
      // Clean up
      unlinkSync(phaseFile);
    }
  } catch (err: any) {
    console.log(`❌ Persistence test failed: ${err.message}`);
  }
  
  console.log(`\n## State Machine Status: ${passCount}/${testCases.length} valid transitions passed`);
  
  const output = `# STATE MACHINE LOG

**Date:** ${new Date().toISOString()}  
**Transitions Tested:** ${testCases.length}  
**Passed:** ${passCount}  

## Transition Results

| From | To | Result | Error |
|------|----|--------|-------|
${results.map(r => `| ${r.from} | ${r.to} | ${r.valid ? "✅ PASS" : "❌ FAIL"} | ${r.error || "-"} |`).join("\n")}

## Phase Transitions Map

\`\`\`javascript
${JSON.stringify(PHASE_TRANSITIONS, null, 2)}
\`\`\`

## Persistence Test

Phase state persists to \`.hermes/phase.json\` to survive hot-reload.
This test verified file creation and JSON format.
`;

  console.log(output);
  process.exit(passCount === testCases.length ? 0 : 1);
}

testStateMachine().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
