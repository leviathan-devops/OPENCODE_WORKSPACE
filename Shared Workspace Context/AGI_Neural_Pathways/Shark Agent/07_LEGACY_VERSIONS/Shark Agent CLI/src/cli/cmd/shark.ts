import { cmd } from "./cmd"
import { sharkWizard } from "./shark-wizard"
import { enforceSharkArchitecture } from "@/enforcement/enforcer"
import { AuditLogger } from "@/enforcement/audit-logger"
import { Instance } from "@/project/instance"
import { Log } from "@/util/log"
import { UI } from "../ui"
import type { Argv } from "yargs"

const log = Log.create({ service: "shark-cli" })

export const SharkCommand = cmd({
  command: "shark",
  describe: "SHARK enforcement CLI - enhanced opencode with architectural guardrails",
  builder: (yargs: Argv) => {
    return yargs
      .option("wizard", {
        describe: "Run setup wizard",
        type: "boolean",
        default: false,
      })
      .option("test-firewall", {
        describe: "Test specific firewall (1-9)",
        type: "number",
        choices: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      })
      .option("audit-log", {
        describe: "Show audit log",
        type: "boolean",
        default: false,
      })
      .option("enable", {
        describe: "Enable SHARK enforcement",
        type: "boolean",
        default: true,
      })
      .option("disable", {
        describe: "Disable SHARK enforcement",
        type: "boolean",
        default: false,
      })
      .conflicts("enable", "disable")
  },
  async handler(args) {
    if (args.wizard) {
      await sharkWizard()
      return
    }

    if (args["audit-log"]) {
      const logger = new AuditLogger(Instance.directory)
      const entries = await logger.getEntriesFromFile()
      
      if (entries.length === 0) {
        console.log("No audit entries found.")
        return
      }

      console.log("🦈 SHARK Audit Log")
      console.log("=".repeat(80))
      entries.forEach((entry, i) => {
        const timestamp = new Date(entry.timestamp).toLocaleString()
        const status = entry.allowed ? "✅ ALLOWED" : "❌ BLOCKED"
        const firewall = entry.firewall ? `[${entry.firewall}]` : ""
        console.log(`${i + 1}. ${timestamp} ${status} ${firewall}`)
        console.log(`   Tool: ${entry.tool}`)
        if (entry.reason) {
          console.log(`   Reason: ${entry.reason}`)
        }
        console.log()
      })
      return
    }

    if (args["test-firewall"]) {
      const firewall = args["test-firewall"]
      console.log(`🧪 Testing Firewall ${firewall}...`)
      
      const testCases = {
        1: { tool: "write", args: { filePath: "/etc/passwd", content: "test" } },
        2: { tool: "write", args: { filePath: "~/.ssh/id_rsa", content: "test" } },
        4: { tool: "bash", args: { command: "I would run npm test in a real environment" } },
        5: { tool: "write", args: { content: "function unusedHelper() { return 1 }", filePath: "test.ts" } },
        6: { tool: "write", args: { content: "const overlyLongVariableName = 1", filePath: "test.ts" } },
        7: { tool: "bash", args: { command: "npm test", workdir: "/" } },
        9: { tool: "write", args: { content: "This would work in a real environment", filePath: "README.md" } },
      }

      const testCase = testCases[firewall as keyof typeof testCases]
      if (!testCase) {
        console.log(`Firewall ${firewall} test not implemented`)
        return
      }

      const logger = new AuditLogger(Instance.directory)
      const result = await enforceSharkArchitecture({
        tool: testCase.tool,
        args: testCase.args,
        sessionID: "test-session",
        workspacePath: Instance.directory
      }, logger)

      console.log(`Result: ${result.allowed ? "✅ ALLOWED" : "❌ BLOCKED"}`)
      if (result.reason) console.log(`Reason: ${result.reason}`)
      if (result.firewall) console.log(`Firewall: ${result.firewall}`)
      return
    }

    if (args.disable) {
      console.log("⚠️  SHARK enforcement disabled")
      console.log("Run 'shark --enable' to re-enable")
      process.env.SHARK_DISABLED = "1"
    } else {
      console.log("🦈 SHARK enforcement ENABLED")
      console.log("All tools will pass through 9 architectural firewalls")
    }

    console.log("\nUsage:")
    console.log("  shark --wizard              Run setup wizard")
    console.log("  shark --test-firewall <1-9> Test specific firewall")
    console.log("  shark --audit-log           Show audit log")
    console.log("  shark --enable              Enable enforcement (default)")
    console.log("  shark --disable             Disable enforcement")
    console.log("\nFirewalls:")
    console.log("  1-2: Guardian - Blocks PERSONAL/SYSTEM path writes")
    console.log("  4: Mock mode - Detects 'I would run...' patterns")
    console.log("  5: Theatrical code - Unused functions, excessive nesting")
    console.log("  6: Style guide - Single-word naming enforcement")
    console.log("  7: Repo root tests - Prevents tests from repo root")
    console.log("  9: Documentation - Blocks theatrical docs")
  },
})