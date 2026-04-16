import { tool } from "./create-tool.js";
export const getSupervisorRecommendations = tool({
    description: "Get open supervisor issues and recommendations for current session",
    args: {},
    execute: async (args, context) => {
        const { getSupervisorSummary, getOpenIssues } = await import("../services/supervisor-loop.js");
        const summary = getSupervisorSummary();
        const issues = getOpenIssues();
        if (issues.length === 0) {
            return `## Supervisor Status\n\n✓ No open issues.`;
        }
        const rows = issues.map(i => `| ${i.id} | ${i.risk} | ${i.type} | ${i.description.substring(0, 50)}... |`).join("\n");
        return `## Supervisor Status\n\n**Open Issues**: ${summary.openCount}\n**High Risk**: ${summary.highRiskCount}\n\n| ID | Risk | Type | Description |\n|-----|------|------|-------------|\n${rows}\n\n**Recommendation**: Address high-risk issues before proceeding.`;
    },
});
