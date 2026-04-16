export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SupervisorIssue {
  id: string;
  agentId: string;
  type: string;
  description: string;
  risk: RiskLevel;
  timestamp: number;
  resolved: boolean;
  resolution?: string;
}

export interface SupervisorLog {
  issues: SupervisorIssue[];
  recommendations: string[];
}

const supervisorIssues: SupervisorIssue[] = [];

export function createIssue(
  agentId: string,
  type: string,
  description: string,
  risk: RiskLevel
): SupervisorIssue {
  const issue: SupervisorIssue = {
    id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId,
    type,
    description,
    risk,
    timestamp: Date.now(),
    resolved: false,
  };
  supervisorIssues.push(issue);
  return issue;
}

export function resolveIssue(issueId: string, resolution: string): boolean {
  const issue = supervisorIssues.find((i) => i.id === issueId);
  if (issue) {
    issue.resolved = true;
    issue.resolution = resolution;
    return true;
  }
  return false;
}

export function getOpenIssues(agentId?: string): SupervisorIssue[] {
  return supervisorIssues.filter(
    (i) => !i.resolved && (!agentId || i.agentId === agentId)
  );
}

export function getHighRiskIssues(): SupervisorIssue[] {
  return supervisorIssues.filter((i) => i.risk === "HIGH" && !i.resolved);
}

export function classifyRisk(
  description: string,
  type: string
): RiskLevel {
  if (type === "security" || type === "data") return "HIGH";
  if (type === "architecture" || type === "performance") return "MEDIUM";
  if (description.includes("typo") || description.includes("formatting")) {
    return "LOW";
  }
  return "LOW";
}

export function generateRecommendation(issue: SupervisorIssue): string {
  switch (issue.risk) {
    case "HIGH":
      return `[ESCALATION_NOTICE] Issue requires human approval: ${issue.description}`;
    case "MEDIUM":
      return `[REVIEW_REQUEST] Consider reviewing: ${issue.description}`;
    case "LOW":
      return `[ACK] Auto-fixing: ${issue.description}`;
  }
}

export function getSupervisorSummary(): {
  openCount: number;
  highRiskCount: number;
  recentIssues: SupervisorIssue[];
} {
  const open = getOpenIssues();
  return {
    openCount: open.length,
    highRiskCount: getHighRiskIssues().length,
    recentIssues: open.slice(-5),
  };
}
