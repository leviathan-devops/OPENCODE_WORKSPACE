"use strict";
/**
 * DEEP PLANNING MODE - Planning Core
 *
 * Core planning logic including dependency graph analysis,
 * risk calculation, and plan verification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyGraph = void 0;
exports.calculateRiskScore = calculateRiskScore;
exports.sortRisksByScore = sortRisksByScore;
exports.validatePlanCompleteness = validatePlanCompleteness;
exports.estimatePlanHours = estimatePlanHours;
exports.extractContextFromFindings = extractContextFromFindings;
exports.buildContextFromUserMessage = buildContextFromUserMessage;
class DependencyGraph {
    constructor(dependencies) {
        this.nodes = new Map();
        this.cycles = [];
        this.buildGraph(dependencies);
        this.detectCycles();
    }
    buildGraph(dependencies) {
        for (const dep of dependencies) {
            if (!this.nodes.has(dep.id)) {
                this.nodes.set(dep.id, {
                    id: dep.id,
                    name: dep.name,
                    type: dep.type,
                    dependsOn: [],
                    dependents: [],
                    depth: 0,
                    isCircular: false,
                });
            }
            const node = this.nodes.get(dep.id);
            node.dependsOn = [...dep.dependsOn];
            for (const parentId of dep.dependsOn) {
                if (!this.nodes.has(parentId)) {
                    this.nodes.set(parentId, {
                        id: parentId,
                        name: parentId,
                        type: 'unknown',
                        dependsOn: [],
                        dependents: [],
                        depth: 0,
                        isCircular: false,
                    });
                }
                this.nodes.get(parentId).dependents.push(dep.id);
            }
        }
        this.calculateDepths();
    }
    calculateDepths() {
        let changed = true;
        while (changed) {
            changed = false;
            for (const node of this.nodes.values()) {
                if (node.dependsOn.length === 0) {
                    if (node.depth !== 0) {
                        node.depth = 0;
                        changed = true;
                    }
                }
                else {
                    const maxParentDepth = Math.max(...node.dependsOn.map(id => this.nodes.get(id)?.depth ?? 0));
                    if (node.depth !== maxParentDepth + 1) {
                        node.depth = maxParentDepth + 1;
                        changed = true;
                    }
                }
            }
        }
    }
    detectCycles() {
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (nodeId, path) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            const node = this.nodes.get(nodeId);
            if (node) {
                for (const parentId of node.dependsOn) {
                    if (!visited.has(parentId)) {
                        if (dfs(parentId, [...path])) {
                            return true;
                        }
                    }
                    else if (recursionStack.has(parentId)) {
                        const cycleStart = path.indexOf(parentId);
                        const cycle = path.slice(cycleStart);
                        cycle.push(parentId);
                        this.cycles.push({
                            nodes: cycle,
                            type: cycle.length === 2 ? 'direct' : 'indirect',
                        });
                        node.isCircular = true;
                        return true;
                    }
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                dfs(nodeId, []);
            }
        }
    }
    getNodes() {
        return Array.from(this.nodes.values());
    }
    getCycles() {
        return this.cycles;
    }
    hasCycles() {
        return this.cycles.length > 0;
    }
    getMaxDepth() {
        return Math.max(...Array.from(this.nodes.values()).map(n => n.depth));
    }
    getRootNodes() {
        return Array.from(this.nodes.values()).filter(n => n.dependsOn.length === 0);
    }
    getLeafNodes() {
        return Array.from(this.nodes.values()).filter(n => n.dependents.length === 0);
    }
    topologicalSort() {
        const result = [];
        const visited = new Set();
        const temp = new Set();
        const dfs = (nodeId) => {
            if (temp.has(nodeId))
                return false;
            if (visited.has(nodeId))
                return true;
            temp.add(nodeId);
            const node = this.nodes.get(nodeId);
            if (node) {
                for (const parentId of node.dependsOn) {
                    if (!dfs(parentId))
                        return false;
                }
            }
            temp.delete(nodeId);
            visited.add(nodeId);
            result.push(nodeId);
            return true;
        };
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                if (!dfs(nodeId))
                    return null;
            }
        }
        return result;
    }
}
exports.DependencyGraph = DependencyGraph;
function calculateRiskScore(risk) {
    const probMap = { low: 1, medium: 2, high: 3 };
    const impactMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const prob = probMap[risk.probability] || 2;
    const impact = impactMap[risk.impact] || 2;
    const score = prob * impact;
    let rating;
    if (score >= 9)
        rating = 'critical';
    else if (score >= 6)
        rating = 'high';
    else if (score >= 3)
        rating = 'medium';
    else
        rating = 'low';
    return { risk, score, rating };
}
function sortRisksByScore(risks) {
    return risks
        .map(r => calculateRiskScore(r))
        .sort((a, b) => b.score - a.score);
}
function validatePlanCompleteness(plan) {
    const issues = [];
    if (plan.requirements.length === 0) {
        issues.push('No requirements defined');
    }
    if (plan.steps.length === 0) {
        issues.push('No execution steps defined');
    }
    if (plan.steps.length > 10) {
        issues.push(`Too many steps (${plan.steps.length}). Consider breaking into smaller plans.`);
    }
    const stepsWithoutRollback = plan.steps.filter(s => s.rollback === 'N/A' && s.id !== 'STEP-1');
    if (stepsWithoutRollback.length > 0) {
        issues.push(`${stepsWithoutRollback.length} step(s) missing rollback procedures`);
    }
    const undeliveredCheckpoints = plan.checkpoints.filter(cp => cp.criteria.length === 0);
    if (undeliveredCheckpoints.length > 0) {
        issues.push(`${undeliveredCheckpoints.length} checkpoint(s) missing criteria`);
    }
    if (plan.constraints.some(c => c.hard && c.type === 'time')) {
        const totalHours = estimatePlanHours(plan);
        const timeConstraint = plan.constraints.find(c => c.hard && c.type === 'time');
        if (timeConstraint) {
            const constraintMatch = timeConstraint.value.match(/(\d+)/);
            if (constraintMatch) {
                const maxHours = parseInt(constraintMatch[1]) * (timeConstraint.value.includes('day') ? 8 : 1);
                if (totalHours > maxHours) {
                    issues.push(`Estimated ${totalHours}h exceeds constraint of ${maxHours}h`);
                }
            }
        }
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
function estimatePlanHours(plan) {
    let totalMinutes = 0;
    for (const step of plan.steps) {
        const match = step.time.match(/(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (step.time.includes('hour') || step.time.includes('h')) {
                totalMinutes += num * 60;
            }
            else if (step.time.includes('day')) {
                totalMinutes += num * 8 * 60;
            }
            else {
                totalMinutes += num;
            }
        }
    }
    return Math.round(totalMinutes / 60);
}
function extractContextFromFindings(findings) {
    const byCategory = new Map();
    for (const finding of findings) {
        if (!byCategory.has(finding.category)) {
            byCategory.set(finding.category, []);
        }
        byCategory.get(finding.category).push(finding.match);
    }
    let context = '';
    for (const [category, matches] of byCategory) {
        context += `${category}: ${matches.join(', ')}\n`;
    }
    return context;
}
function buildContextFromUserMessage(message) {
    const lines = message.split('\n').filter(l => l.trim());
    const requirements = [];
    const constraints = [];
    const risks = [];
    const dependencies = [];
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('feature:') || lower.includes('should') || lower.includes('need')) {
            requirements.push(line);
        }
        if (lower.includes('must') || lower.includes('within') || lower.includes('limited')) {
            constraints.push(line);
        }
        if (lower.includes('risk') || lower.includes('might') || lower.includes('blocked')) {
            risks.push(line);
        }
        if (lower.includes('import') || lower.includes('depend') || lower.includes('api')) {
            dependencies.push(line);
        }
    }
    return { requirements, constraints, risks, dependencies };
}
//# sourceMappingURL=planning-core.js.map