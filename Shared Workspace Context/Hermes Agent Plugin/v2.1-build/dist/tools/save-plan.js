import { tool } from "./create-tool.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
export const savePlan = tool({
    description: "Save plan to plan.json and auto-generate plan.md",
    args: {
        plan: tool.schema.object({
            tasks: tool.schema.array(tool.schema.object({
                id: tool.schema.string(),
                description: tool.schema.string(),
                filePaths: tool.schema.array(tool.schema.string()),
                testCommands: tool.schema.array(tool.schema.string()),
                acceptanceCriteria: tool.schema.array(tool.schema.string()),
            })),
        }).describe("Plan structure"),
    },
    execute: async (args, context) => {
        const planDir = resolve(context.worktree, "docs", "plans");
        if (!existsSync(planDir)) {
            mkdirSync(planDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().split("T")[0];
        const planId = `plan-${timestamp}-${Date.now()}`;
        const planJsonPath = join(planDir, `${planId}.json`);
        writeFileSync(planJsonPath, JSON.stringify(args.plan, null, 2));
        const planMd = generatePlanMarkdown(args.plan, planId);
        const planMdPath = join(planDir, `${planId}.md`);
        writeFileSync(planMdPath, planMd);
        return `Plan saved:
- JSON: ${planJsonPath}
- Markdown: ${planMdPath}

Tasks: ${args.plan.tasks.length}`;
    },
});
function generatePlanMarkdown(plan, planId) {
    return `# Plan: ${planId}\n\n${plan.tasks
        .map((t, i) => `
## Task ${i + 1}: ${t.description}

**File**: ${t.filePaths.join(", ")}

### Test Commands
${t.testCommands.map((c) => `\`\`\`\n${c}\n\`\`\``).join("\n")}

### Acceptance Criteria
${t.acceptanceCriteria.map((a) => `- [ ] ${a}`).join("\n")}
`)
        .join("\n")}`;
}
