import { tool } from "./create-tool.js";

export const lint = tool({
  description: "Run linter on project files",
  args: {
    path: tool.schema.string().optional().describe("Path to lint (default: project root)"),
    fix: tool.schema.boolean().optional().default(false).describe("Auto-fix issues"),
  },
  execute: async (args, context) => {
    return `Linting ${args.path ?? context.directory}...
No lint errors found.`;
  },
});

export const diff = tool({
  description: "Show uncommitted changes",
  args: {},
  execute: async (args, context) => {
    return `diff --git a/src/main.ts b/src/main.ts
--- a/src/main.ts
+++ b/src/main.ts
@@ -1 +1 @@
-console.log("hello");
+console.log("hello world");
`;
  },
});

export const buildCheck = tool({
  description: "Verify the project builds successfully",
  args: {
    target: tool.schema.string().optional().describe("Build target"),
  },
  execute: async (args, context) => {
    return `Running build check...
Build successful.`;
  },
});

export const syntaxCheck = tool({
  description: "Verify TypeScript/JavaScript syntax is valid",
  args: {
    path: tool.schema.string().describe("File or directory to check"),
  },
  execute: async (args, context) => {
    return `Syntax check: ${args.path}
✓ No syntax errors`;
  },
});
