const supervisorIssues = [];
export function createIssue(agentId, type, description, risk) {
    const issue = {
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
export function resolveIssue(issueId, resolution) {
    const issue = supervisorIssues.find((i) => i.id === issueId);
    if (issue) {
        issue.resolved = true;
        issue.resolution = resolution;
        return true;
    }
    return false;
}
export function getOpenIssues(agentId) {
    return supervisorIssues.filter((i) => !i.resolved && (!agentId || i.agentId === agentId));
}
export function getHighRiskIssues() {
    return supervisorIssues.filter((i) => i.risk === "HIGH" && !i.resolved);
}
export function classifyRisk(description, type) {
    if (type === "security" || type === "data")
        return "HIGH";
    if (type === "architecture" || type === "performance")
        return "MEDIUM";
    if (description.includes("typo") || description.includes("formatting")) {
        return "LOW";
    }
    return "LOW";
}
export function generateRecommendation(issue) {
    switch (issue.risk) {
        case "HIGH":
            return `[ESCALATION_NOTICE] Issue requires human approval: ${issue.description}`;
        case "MEDIUM":
            return `[REVIEW_REQUEST] Consider reviewing: ${issue.description}`;
        case "LOW":
            return `[ACK] Auto-fixing: ${issue.description}`;
    }
}
export function getSupervisorSummary() {
    const open = getOpenIssues();
    return {
        openCount: open.length,
        highRiskCount: getHighRiskIssues().length,
        recentIssues: open.slice(-5),
    };
}
