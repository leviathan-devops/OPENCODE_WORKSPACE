import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { join, resolve } from "path";

const pluginModule = await import("./dist/index.js");
const plugin = await pluginModule.default({
  version: "1.0",
  logger: { info: () => {}, warn: () => {}, error: console.error },
});

const context = {
  sessionID: "test-session-001",
  messageID: "test-msg-001",
  agent: "test",
  directory: "/tmp",
  worktree: "/tmp",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
};

console.log("\n=== TESTING FIXES ===\n");

// Test 1: lint (should NOT be ESLint config error)
console.log("TEST 1: lint tool");
const lintResult = await plugin.tool.lint.execute({ path: "/tmp" }, context);
console.log("  Result:", lintResult.substring(0, 200));
const lintPass = !lintResult.includes("couldn't find an eslint.config") && !lintResult.includes("Cannot find module");
console.log("  PASS:", lintPass, "\n");

// Test 2: grill (should NOT be "Could not analyze")
console.log("TEST 2: grill tool");
writeFileSync("/tmp/sql_vuln_test.ts", "const query = 'SELECT * FROM users WHERE id = ' + userInput;");
const grillResult = await plugin.tool.grill.execute({ target: "/tmp/sql_vuln_test.ts" }, context);
console.log("  Result:", grillResult.substring(0, 200));
const grillPass = !grillResult.includes("Could not analyze") && (grillResult.includes("SQL") || grillResult.includes("injection") || grillResult.includes("Attack"));
console.log("  PASS:", grillPass, "\n");

// Test 3: grill on directory (NEW functionality)
console.log("TEST 3: grill directory");
const grillDirResult = await plugin.tool.grill.execute({ target: "/tmp" }, context);
console.log("  Result:", grillDirResult.substring(0, 200));
const grillDirPass = !grillDirResult.includes("Could not analyze");
console.log("  PASS:", grillDirPass, "\n");

// Test 4: complexity_hotspots (should detect O(n²))
console.log("TEST 4: complexity_hotspots");
writeFileSync("/tmp/nested_loops.py", "for i in range(n):\n  for j in range(n):\n    print(i, j)");
const complexityResult = await plugin.tool.complexity_hotspots.execute({ path: "/tmp" }, context);
console.log("  Result:", complexityResult.substring(0, 200));
const complexityPass = complexityResult.includes("nested") || complexityResult.includes("complex") || complexityResult.includes("hotspot");
console.log("  PASS:", complexityPass, "\n");

// Test 5: symbols on Python file (NEW functionality)
console.log("TEST 5: symbols Python file");
writeFileSync("/tmp/test_symbols.py", "def my_function():\n    pass\n\nclass MyClass:\n    pass\n\nMY_CONSTANT = 42");
const symbolsResult = await plugin.tool.symbols.execute({ path: "/tmp/test_symbols.py" }, context);
console.log("  Result:", symbolsResult.substring(0, 300));
const symbolsPass = !symbolsResult.includes("Could not read") && (symbolsResult.includes("my_function") || symbolsResult.includes("MyClass") || symbolsResult.includes("MY_CONSTANT"));
console.log("  PASS:", symbolsPass, "\n");

// Cleanup
try { rmSync("/tmp/sql_vuln_test.ts"); } catch {}
try { rmSync("/tmp/nested_loops.py"); } catch {}
try { rmSync("/tmp/test_symbols.py"); } catch {}

console.log("\n=== SUMMARY ===");
console.log("lint:", lintPass ? "PASS" : "FAIL");
console.log("grill (file):", grillPass ? "PASS" : "FAIL");
console.log("grill (directory):", grillDirPass ? "PASS" : "FAIL");
console.log("complexity_hotspots:", complexityPass ? "PASS" : "FAIL");
console.log("symbols (Python):", symbolsPass ? "PASS" : "FAIL");

const allPass = lintPass && grillPass && grillDirPass && complexityPass && symbolsPass;
console.log("\nAll fixes working:", allPass ? "YES" : "NO");
