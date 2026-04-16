import { describe, expect, test } from "bun:test"
import { enforceSharkArchitecture, type EnforcementParams } from "@/enforcement/enforcer"
import { AuditLogger } from "@/enforcement/audit-logger"
import { detectMockMode, validateToolArgs } from "@/validation/mock-detector"
import { detectTheatricalCode } from "@/validation/theatrical-detector"
import { validateCodeStyle } from "@/validation/style-enforcer"
import { detectRepoRootTests } from "@/validation/test-enforcer"
import { validateDocumentation } from "@/validation/doc-validator"
import { classifyZone, ZoneType } from "@/guardian"
import * as os from "os"
import * as path from "path"

const mockLogger = {
  log: async () => {},
  getEntries: () => [],
  getEntriesFromFile: async () => []
} as unknown as AuditLogger

const workspacePath = "/tmp/test-workspace"

describe("enforcement", () => {
  describe("mock detection", () => {
    test("detects mock mode patterns", () => {
      const result = detectMockMode("I would run this command in a real environment")
      expect(result.isMock).toBe(true)
    })

    test("allows real code", () => {
      const result = detectMockMode("const x = 1 + 2")
      expect(result.isMock).toBe(false)
    })

    test("validateToolArgs extracts content", () => {
      const result = validateToolArgs("write", { content: "I would run this" })
      expect(result.isMock).toBe(true)
    })
  })

  describe("theatrical code detection", () => {
    test("detects unused functions", () => {
      const code = `
        function unusedHelper() {
          return 1
        }
      `
      const result = detectTheatricalCode(code)
      expect(result.isTheatrical).toBe(true)
      expect(result.issues.some(i => i.type === "unused_function")).toBe(true)
    })

    test("allows exported functions", () => {
      const code = `
        export function helper() {
          return 1
        }
      `
      const result = detectTheatricalCode(code)
      expect(result.issues.some(i => i.type === "unused_function")).toBe(false)
    })
  })

  describe("style guide enforcement", () => {
    test("rejects multi-word identifiers", () => {
      const code = "const overlyLongVariableName = 1"
      const result = validateCodeStyle(code)
      expect(result.isValid).toBe(false)
    })

    test("allows single-word identifiers", () => {
      const code = "const count = 1"
      const result = validateCodeStyle(code)
      expect(result.isValid).toBe(true)
    })
  })

  describe("repo root test detection", () => {
    test("detects npm test from root", () => {
      const result = detectRepoRootTests({ command: "npm test" })
      expect(result.isRepoRoot).toBe(true)
    })

    test("allows other commands", () => {
      const result = detectRepoRootTests({ command: "ls -la" })
      expect(result.isRepoRoot).toBe(false)
    })
  })

  describe("documentation validation", () => {
    test("rejects theatrical docs", () => {
      const result = validateDocumentation("This would work in a real environment")
      expect(result.isValid).toBe(false)
    })

    test("allows real documentation", () => {
      const result = validateDocumentation("This function adds two numbers")
      expect(result.isValid).toBe(true)
    })
  })

  describe("guardian zone classification", () => {
    test("classifies workspace path", () => {
      const result = classifyZone("/tmp/test-workspace/src/file.ts", "/tmp/test-workspace")
      expect(result.zone).toBe(ZoneType.WORKSPACE)
    })

    test("classifies system path", () => {
      const result = classifyZone("/etc/passwd", "/tmp/test-workspace")
      expect(result.zone).toBe(ZoneType.SYSTEM)
    })

    test("classifies personal path", () => {
      const homeDir = os.homedir()
      const result = classifyZone(path.join(homeDir, ".ssh/id_rsa"), "/tmp/test-workspace")
      expect(result.zone).toBe(ZoneType.PERSONAL)
    })
  })
})
