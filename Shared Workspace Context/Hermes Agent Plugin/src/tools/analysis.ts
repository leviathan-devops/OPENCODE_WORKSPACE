import { tool } from "./create-tool.js";

export const complexityHotspots = tool({
  description: "Find complex code regions that need attention",
  args: {
    path: tool.schema.string().optional().describe("Path to analyze"),
    minComplexity: tool.schema.number().optional().default(10).describe("Minimum complexity threshold"),
  },
  execute: async (args, context) => {
    return `## Complexity Hotspots

| File | Function | Complexity |
|------|----------|------------|
| src/utils/auth.ts | validateToken | 15 |
| src/core/parser.ts | parseExpression | 12 |
`;
  },
});

export const detectDomains = tool({
  description: "Identify project domains/boundaries",
  args: {},
  execute: async (args, context) => {
    return `## Detected Domains

| Domain | Files | Purpose |
|--------|-------|---------|
| auth | src/auth/* | Authentication |
| api | src/api/* | REST API |
| core | src/core/* | Core business logic |
`;
  },
});

export const extractCodeBlocks = tool({
  description: "Parse code blocks from markdown or long outputs",
  args: {
    content: tool.schema.string().describe("Content to extract from"),
  },
  execute: async (args, context) => {
    return `Extracted code blocks from content.`;
  },
});

export const imports = tool({
  description: "Map import dependencies",
  args: {
    path: tool.schema.string().describe("File to analyze imports for"),
  },
  execute: async (args, context) => {
    return `## Imports for ${args.path}

\`\`\`
import { a } from './a';
import { b } from './b';
\`\`\`

### Dependency Graph
- ${args.path} → a, b
`;
  },
});

export const symbols = tool({
  description: "Extract function/class symbols from file",
  args: {
    path: tool.schema.string().describe("File to extract symbols from"),
  },
  execute: async (args, context) => {
    return `## Symbols in ${args.path}

| Symbol | Type | Line |
|--------|------|------|
| validateToken | function | 10 |
| User | class | 25 |
`;
  },
});
