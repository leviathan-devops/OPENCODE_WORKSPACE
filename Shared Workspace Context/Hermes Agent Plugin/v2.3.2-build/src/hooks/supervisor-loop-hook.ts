import type { Hooks } from "@opencode-ai/plugin";
import { isHermesAgent } from "../config/agent-identity.js";
import { classifyRisk, createIssue, generateRecommendation } from "../services/supervisor-loop.js";

export function createSupervisorLoopHook(): NonNullable<
  Hooks["tool.execute.after"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;

    const { tool } = input;
    const toolOutput = output.output ?? "";

    // Detect errors and classify risk
    if (toolOutput.includes("error") || toolOutput.includes("Error") || toolOutput.includes("EXCEPTION") || toolOutput.includes("FATAL")) {
      const risk = classifyRisk(toolOutput.substring(0, 200), "error");
      const issue = createIssue(input.sessionID, "runtime_error", `Tool ${tool} produced error output`, risk);
      const recommendation = generateRecommendation(issue);

      // Feed recommendation back into agent context via output metadata
      if (risk === "HIGH" || risk === "MEDIUM") {
        output.metadata = {
          ...output.metadata,
          supervisor_recommendation: recommendation,
          supervisor_issue_id: issue.id,
        };
      }
    }

    // Detect security-sensitive tool usage
    if (tool === "bash" && (toolOutput.includes("rm -rf") || toolOutput.includes("sudo") || toolOutput.includes("chmod"))) {
      const risk = classifyRisk(toolOutput, "security");
      const issue = createIssue(input.sessionID, "security", `Potentially dangerous bash command in ${tool}`, risk);
      const recommendation = generateRecommendation(issue);

      output.metadata = {
        ...output.metadata,
        supervisor_recommendation: recommendation,
        supervisor_issue_id: issue.id,
      };
    }

    // Detect large file writes (potential data loss)
    if ((tool === "write_file" || tool === "edit_file") && toolOutput.length > 50000) {
      const risk = classifyRisk(`Large file write: ${toolOutput.length} bytes`, "data");
      const issue = createIssue(input.sessionID, "data", `Large file write detected (${toolOutput.length} bytes)`, risk);
      const recommendation = generateRecommendation(issue);

      output.metadata = {
        ...output.metadata,
        supervisor_recommendation: recommendation,
        supervisor_issue_id: issue.id,
      };
    }
  };
}
