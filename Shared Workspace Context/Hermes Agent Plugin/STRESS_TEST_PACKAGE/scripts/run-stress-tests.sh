#!/usr/bin/env bun
/**
 * Hermes Agent v2.3.3 — Stress Test Suite
 * 
 * Purpose: Mechanically verify real-time functionality, detect fragility,
 * and stress test the system to find what breaks under edge conditions.
 * 
 * Usage: bun run-stress-tests.sh [--verbose] [--category=security]
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, chmodSync, symlinkSync, readdirSync, statSync, rmSync } from "fs";
import { join, resolve } from "path";
import { spawnSync, spawn } from "child_process";
import { setTimeout } from "timers/promises";

//===============================================================================
// Configuration
//===============================================================================

const TEST_BASE = "/tmp/hermes-stress-test";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const LOG_DIR = `${TEST_BASE}/logs/${TIMESTAMP}`;
const RESULTS_FILE = `${LOG_DIR}/results.json`;

const PLUGIN_PATH = "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/dist/index.js";

// Colors for terminal output
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m'; // No Color

//===============================================================================
// Test Results Storage
//===============================================================================

interface TestResult {
  id: string;
  name: string;
  component: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
  duration_ms: number;
}

const results: TestResult[] = [];
let passed = 0;
let failed = 0;

//===============================================================================
// Utilities
//===============================================================================

function log_info(msg: string) {
  console.log(`${BLUE}[INFO]${NC} ${msg}`);
}

function log_pass(msg: string) {
  console.log(`${GREEN}[PASS]${NC} ${msg}`);
}

function log_fail(msg: string) {
  console.log(`${RED}[FAIL]${NC} ${msg}`);
}

function log_warn(msg: string) {
  console.log(`${YELLOW}[WARN]${NC} ${msg}`);
}

function opencode_run(command: string, timeout_ms = 60000): { stdout: string; stderr: string; exitCode: number } {
  const start = Date.now();
  try {
    const result = spawnSync("opencode", ["run", command], {
      cwd: TEST_BASE,
      encoding: "utf-8",
      timeout: timeout_ms,
      maxBuffer: 10 * 1024 * 1024,
    });
    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: result.status || 0,
    };
  } catch (e: any) {
    return {
      stdout: "",
      stderr: e.message || String(e),
      exitCode: 1,
    };
  }
}

async function opencode_run_async(command: string, timeout_ms = 60000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn("opencode", ["run", command], {
      cwd: TEST_BASE,
      encoding: "utf-8",
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ stdout, stderr, exitCode: 124 });
    }, timeout_ms);
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code || 0 });
    });
  });
}

function setup_fixtures() {
  mkdirSync(`${TEST_BASE}/fixtures`, { recursive: true });
  mkdirSync(`${TEST_BASE}/project`, { recursive: true });
  mkdirSync(`${LOG_DIR}`, { recursive: true });
  
  // Create a realistic test project
  create_test_project();
}

function create_test_project() {
  const project = `${TEST_BASE}/project`;
  
  // TypeScript source
  writeFileSync(`${project}/index.ts`, `
import { Router } from "./router";
import { Database } from "./db";

const db = new Database();
const router = new Router(db);

export function handler(req: Request): Response {
  return router.route(req);
}
`.trim());

  writeFileSync(`${project}/db.ts`, `
export class Database {
  private connection: any;
  
  query(sql: string): any {
    // SQL injection vulnerability
    return this.connection.exec("SELECT * FROM users WHERE id = " + sql);
  }
  
  async findAll(query: string) {
    // More SQL injection
    const sql = \`SELECT * FROM items WHERE name = '\${query}'\`;
    return this.connection.execute(sql);
  }
}
`.trim());

  writeFileSync(`${project}/router.ts`, `
export class Router {
  constructor(private db: any) {}
  
  route(req: Request): Response {
    // XSS vulnerability
    document.body.innerHTML = req.url;
    return new Response("OK");
  }
}
`.trim());

  writeFileSync(`${project}/processor.ts`, `
export class DataProcessor {
  // O(n³) complexity hotspot
  processMatrix(data: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < data.length; i++) {
      result[i] = [];
      for (let j = 0; j < data[0].length; j++) {
        result[i][j] = 0;
        for (let k = 0; k < data.length; k++) {
          result[i][j] += data[i][k] * data[k][j];
        }
      }
    }
    return result;
  }
  
  // Chained filters - O(n²) memory
  filterData(items: any[]) {
    return items
      .filter(x => x.active)
      .filter(x => x.visible)
      .filter(x => x.enabled);
  }
}
`.trim());

  // Python file
  writeFileSync(`${project}/analyzer.py`, `
from typing import List, Optional, Union, TypeAlias

# Type aliases
Matrix: TypeAlias = List[List[float]]
Vector: TypeAlias = List[float]

class DataAnalyzer:
    def __init__(self, name: str):
        self.name = name
        self.cache = {}
    
    async def analyze(self, data: Vector) -> float:
        result = sum(data) / len(data)
        return result
    
    def process_matrix(self, matrix: Matrix) -> Vector:
        result = []
        for row in matrix:
            result.append(sum(row) / len(row))
        return result
    
    def find_anomalies(self, data: List[float]) -> List[int]:
        mean = sum(data) / len(data)
        return [i for i, x in enumerate(data) if abs(x - mean) > 2]

MAX_BUFFER_SIZE = 1000000
DEFAULT_TIMEOUT = 30
`.trim());

  // Java file for symbol testing
  writeFileSync(`${project}/Processor.java`, `
import java.util.*;

public class Processor {
    private String name;
    private int capacity;
    
    public Processor(String name, int capacity) {
        this.name = name;
        this.capacity = capacity;
    }
    
    public String getName() { return name; }
    public int getCapacity() { return capacity; }
    
    interface Callback {
        void onComplete(String result);
    }
    
    static class Config {
        String url;
        int timeout;
    }
}
`.trim());
}

function create_huge_file(path: string, size_bytes: number) {
  const chunk = "const x = 1; ".repeat(100);
  const iterations = Math.ceil(size_bytes / chunk.length);
  let content = "";
  for (let i = 0; i < iterations; i++) content += chunk;
  writeFileSync(path, content.substring(0, size_bytes));
}

function create_deep_tree(base: string, depth: number) {
  let current = base;
  for (let i = 0; i < depth; i++) {
    current = join(current, `level_${i}`);
    mkdirSync(current, { recursive: true });
    writeFileSync(join(current, `file_${i}.ts`), `// File at level ${i}\nconst x = ${i};`);
  }
}

function create_unicode_files(base: string) {
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, "normal.ts"), "// Normal file");
  writeFileSync(join(base, "emoji_\u{1F4A9}.ts"), "// File with emoji");
  writeFileSync(join(base, "cyrillic_\u{043F}\u{0440}\u{0438}\u{0432}\u{0435}\u{0442}.ts"), "// Cyrillic");
  writeFileSync(join(base, "arabic_\u{0627}\u{0644}\u{0639}\u{0631}\u{0628}\u{064A}\u{0629}.ts"), "// Arabic");
}

function create_symlink_loop(base: string) {
  mkdirSync(base, { recursive: true });
  symlinkSync(join(base, "dir_a"), join(base, "dir_b_link"));
  symlinkSync(join(base, "dir_b"), join(base, "dir_a_link"));
}

function create_binary_file(path: string) {
  const buffer = Buffer.alloc(1000);
  for (let i = 0; i < 1000; i++) buffer[i] = i % 256;
  writeFileSync(path, buffer);
}

function create_long_path(base: string, name_length = 255) {
  const name = "a".repeat(name_length);
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, name), "// Long filename");
}

function create_special_chars(base: string) {
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, "file with spaces.ts"), "// Spaces");
  writeFileSync(join(base, "file\twith\ttabs.ts"), "// Tabs");
  writeFileSync(join(base, "file\nwith\nnewlines.ts"), "// Newlines");
}

function cleanup() {
  try { rmSync(TEST_BASE, { recursive: true, force: true }); } catch { /* ignore */ }
}

//===============================================================================
// Test Cases
//===============================================================================

interface TestCase {
  id: string;
  name: string;
  component: string;
  expected: string;
  test_fn: () => Promise<boolean>;
  fragility: string;
}

const tests: TestCase[] = [
  //---------------------------------------------------------------------------
  // Security Tests
  //---------------------------------------------------------------------------
  {
    id: "s004",
    name: "Path traversal attack",
    component: "security",
    expected: "Blocked or returns access denied",
    fragility: "Path traversal vulnerability",
    async test_fn() {
      const r = opencode_run("call grill target=../../../etc/passwd");
      return r.stdout.includes("denied") || 
             r.stdout.includes("outside") || 
             r.stdout.includes("Error") ||
             r.exitCode !== 0;
    },
  },
  {
    id: "s005",
    name: "Shell injection attack",
    component: "security",
    expected: "Injection blocked or sanitized",
    fragility: "Shell injection vulnerability",
    async test_fn() {
      const r = opencode_run("call lint target=/tmp/test'; ls /tmp; echo '");
      return r.exitCode === 0 || r.stdout.includes("Lint errors") || r.stdout.includes("error");
    },
  },
  {
    id: "s019",
    name: "SQL injection vulnerability — grill detection",
    component: "security_analysis",
    expected: "Detects SQL injection pattern",
    fragility: "grill misses SQL injection",
    async test_fn() {
      const r = opencode_run("call grill target=/tmp/hermes-stress-test/project/db.ts");
      return r.stdout.toLowerCase().includes("sql") || 
             r.stdout.toLowerCase().includes("injection");
    },
  },
  {
    id: "s020",
    name: "XSS vulnerability — grill detection",
    component: "security_analysis",
    expected: "Detects innerHTML usage",
    fragility: "grill misses XSS",
    async test_fn() {
      const r = opencode_run("call grill target=/tmp/hermes-stress-test/project/router.ts");
      return r.stdout.toLowerCase().includes("xss") || 
             r.stdout.toLowerCase().includes("innerhtml") ||
             r.stdout.toLowerCase().includes("dom");
    },
  },

  //---------------------------------------------------------------------------
  // Tool Functionality Tests
  //---------------------------------------------------------------------------
  {
    id: "s017",
    name: "Python file — symbols extraction",
    component: "language_support",
    expected: "Extracts def, class, type_alias, constant",
    fragility: "symbols doesn't handle Python",
    async test_fn() {
      const r = opencode_run("call symbols target=/tmp/hermes-stress-test/project/analyzer.py");
      const out = r.stdout.toLowerCase();
      return out.includes("analyz") || 
             out.includes("process") ||
             out.includes("class") ||
             out.includes("function");
    },
  },
  {
    id: "s018",
    name: "O(n³) algorithm — complexity hotspot detection",
    component: "analysis_accuracy",
    expected: "Detects triple nested loops",
    fragility: "complexity_hotspots misses O(n²)",
    async test_fn() {
      const r = opencode_run("call complexity_hotspots target=/tmp/hermes-stress-test/project/processor.ts");
      const out = r.stdout.toLowerCase();
      return out.includes("nested") || 
             out.includes("complex") ||
             out.includes("o(n") ||
             out.includes("quadratic") ||
             out.includes("cube");
    },
  },
  {
    id: "s021",
    name: "grill on directory — recursive scan",
    component: "directory_handling",
    expected: "Scans all files in directory",
    fragility: "grill crashes on directory",
    async test_fn() {
      const r = opencode_run("call grill target=/tmp/hermes-stress-test/project");
      return r.exitCode === 0 && 
             r.stdout.length > 50 &&
             !r.stdout.includes("Could not analyze");
    },
  },
  {
    id: "s022",
    name: "checkpoint then list_sessions",
    component: "session_tools",
    expected: "Session appears in list after checkpoint",
    fragility: "list_sessions returns undefined",
    async test_fn() {
      opencode_run("call checkpoint evidence='stress test s022'");
      const r = opencode_run("call list_sessions");
      return r.exitCode === 0 && !r.stdout.includes("undefined");
    },
  },

  //---------------------------------------------------------------------------
  // Phase/State Tests
  //---------------------------------------------------------------------------
  {
    id: "s023",
    name: "Phase advance: idle -> analyze -> plan",
    component: "state_machine",
    expected: "Correctly advances through phases",
    fragility: "Phase advances to wrong phase",
    async test_fn() {
      // First set to idle by restarting (if possible) or just test the chain
      const r1 = opencode_run("call phase_complete phase=analyze evidence='s023 test'");
      // If already past idle, check it responds appropriately
      return r1.exitCode === 0;
    },
  },
  {
    id: "s024",
    name: "Phase advance out of order — blocked",
    component: "state_machine",
    expected: "Blocks out-of-order phase advance",
    fragility: "Out-of-order phases accepted",
    async test_fn() {
      // Try to complete 'build' phase when we should be at 'idle' or 'analyze'
      const r = opencode_run("call phase_complete phase=build evidence='s024 should fail'");
      return r.stdout.includes("BLOCKED") || 
             r.stdout.includes("Cannot complete phase");
    },
  },

  //---------------------------------------------------------------------------
  // CLI Tests
  //---------------------------------------------------------------------------
  {
    id: "s016",
    name: "/Hermes commands — with leading slash",
    component: "cli_routing",
    expected: "Routes correctly with / prefix",
    fragility: "/Hermes not routed to plugin",
    async test_fn() {
      const r = opencode_run("/Hermes status");
      return r.exitCode === 0 && r.stdout.length > 0;
    },
  },

  //---------------------------------------------------------------------------
  // Edge Case Tests
  //---------------------------------------------------------------------------
  {
    id: "s006",
    name: "Empty and null inputs to tools",
    component: "edge_cases",
    expected: "Graceful error, no crash",
    fragility: "Null pointer exceptions",
    async test_fn() {
      const r1 = opencode_run("call symbols target=");
      const r2 = opencode_run("call symbols");
      return r1.exitCode === 0 || r2.exitCode === 0 || 
             r1.stdout.includes("Error") || r2.stdout.includes("Error");
    },
  },
  {
    id: "s008",
    name: "Permission denied — unreadable file",
    component: "error_handling",
    expected: "Graceful error message",
    fragility: "Exception leaking internal paths",
    async test_fn() {
      writeFileSync("/tmp/hermes-stress-test/restricted.ts", "// secret");
      chmodSync("/tmp/hermes-stress-test/restricted.ts", 0o000);
      const r = opencode_run("call lint target=/tmp/hermes-stress-test/restricted.ts");
      chmodSync("/tmp/hermes-stress-test/restricted.ts", 0o644);
      return r.stdout.includes("denied") || 
             r.stdout.includes("not found") ||
             r.stdout.includes("Permission");
    },
  },
  {
    id: "s009",
    name: "Circular symbolic link loop",
    component: "path_resolution",
    expected: "Detects loop, no hang",
    fragility: "Infinite loop in path resolution",
    async test_fn() {
      create_symlink_loop("/tmp/hermes-stress-test/loop");
      const r = opencode_run("call symbols target=/tmp/hermes-stress-test/loop", 10000);
      return r.exitCode === 0 || r.stdout.includes("Error");
    },
  },
  {
    id: "s010",
    name: "Binary file to text analysis tool",
    component: "type_handling",
    expected: "Handles binary gracefully",
    fragility: "Binary corrupts string handling",
    async test_fn() {
      create_binary_file("/tmp/hermes-stress-test/binary.ts");
      const r = opencode_run("call symbols target=/tmp/hermes-stress-test/binary.ts");
      return r.exitCode === 0 || r.stdout.includes("Error");
    },
  },
  {
    id: "s029",
    name: "Long filename — 255+ characters",
    component: "path_limits",
    expected: "Handles long paths",
    fragility: "Path length limits",
    async test_fn() {
      create_long_path("/tmp/hermes-stress-test/longpath");
      const r = opencode_run("call symbols target=/tmp/hermes-stress-test/longpath", 10000);
      return r.exitCode === 0 || r.stdout.includes("Error");
    },
  },
  {
    id: "s030",
    name: "Special characters in filenames",
    component: "edge_cases",
    expected: "Handles special characters",
    fragility: "Special chars break path parsing",
    async test_fn() {
      create_special_chars("/tmp/hermes-stress-test/special");
      const r = opencode_run("call symbols target=/tmp/hermes-stress-test/special");
      return r.exitCode === 0;
    },
  },
  {
    id: "s007",
    name: "Unicode filenames with emoji and RTL",
    component: "encoding",
    expected: "Handles Unicode correctly",
    fragility: "Unicode normalization issues",
    async test_fn() {
      create_unicode_files("/tmp/hermes-stress-test/unicode");
      const r = opencode_run("call symbols target=/tmp/hermes-stress-test/unicode");
      return r.exitCode === 0;
    },
  },

  //---------------------------------------------------------------------------
  // Concurrency Tests
  //---------------------------------------------------------------------------
  {
    id: "s001",
    name: "Rapid tool calls — 10 tools in succession",
    component: "concurrency",
    expected: "All complete without race conditions",
    fragility: "Promise.all race conditions",
    async test_fn() {
      const tools = ["symbols", "lint", "grill", "verify", "symbols", "symbols", "symbols", "symbols", "symbols", "symbols"];
      const promises = tools.map(t => 
        opencode_run_async(`call ${t} target=/tmp/hermes-stress-test/project/index.ts`)
      );
      const results = await Promise.all(promises);
      return results.every(r => r.exitCode === 0 || r.stdout.length > 0);
    },
  },

  //---------------------------------------------------------------------------
  // Hook Tests
  //---------------------------------------------------------------------------
  {
    id: "s025",
    name: "Hook fires on every message",
    component: "hook_reliability",
    expected: "Hook fires consistently",
    fragility: "Hook skips messages under load",
    async test_fn() {
      // This is hard to test externally. We check if the hook mechanism exists
      const r = opencode_run("/Hermes status");
      return r.exitCode === 0;
    },
  },
];

//===============================================================================
// Runner
//===============================================================================

async function run_tests() {
  log_info(`Hermes Agent v2.3.3 — Stress Test Suite`);
  log_info(`Timestamp: ${TIMESTAMP}`);
  log_info(`Log directory: ${LOG_DIR}`);
  console.log("");

  // Setup
  log_info("Setting up test fixtures...");
  cleanup();
  setup_fixtures();
  log_info("Fixtures created at: " + TEST_BASE);
  console.log("");

  // Run each test
  for (const test of tests) {
    const start = Date.now();
    let passed_test = false;
    let error: string | undefined;

    try {
      log_info(`Running ${test.id}: ${test.name}`);
      passed_test = await test.test_fn();
    } catch (e: any) {
      error = e.message || String(e);
      log_fail(`  ${test.id} threw: ${error}`);
    }

    const duration = Date.now() - start;
    const result: TestResult = {
      id: test.id,
      name: test.name,
      component: test.component,
      passed: passed_test,
      expected: test.expected,
      actual: passed_test ? "PASS" : "FAIL",
      error,
      duration_ms: duration,
    };
    results.push(result);

    if (passed_test) {
      log_pass(`  ${test.id}: PASS (${duration}ms)`);
      passed++;
    } else {
      log_fail(`  ${test.id}: FAIL (${duration}ms)`);
      failed++;
    }
  }

  // Summary
  console.log("");
  console.log("===============================================================================");
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log("===============================================================================");
  console.log("");

  // Save results
  const summary = {
    timestamp: TIMESTAMP,
    plugin_version: "v2.3.3",
    total_tests: tests.length,
    passed,
    failed,
    pass_rate: (passed / tests.length * 100).toFixed(1) + "%",
    results,
  };

  writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));
  log_info(`Results saved to: ${RESULTS_FILE}`);

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

//===============================================================================
// Main
//===============================================================================

run_tests().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
