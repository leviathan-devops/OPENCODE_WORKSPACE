# 🦈 SHARK PERFORMANCE LOGGING & ANALYTICS

## Overview
Comprehensive performance tracking system for Shark Frankenstein CLI integrated with opencode-ultra. Tracks model usage, costs, success rates, and system performance.

## Logging Architecture

### Data Collection Points
1. **Model Usage**: API calls, tokens, latency
2. **Agent Performance**: Success/failure rates, completion times
3. **Tool Usage**: Tool calls, success rates, errors
4. **Workflow Metrics**: Stage completion times, violations
5. **Safety Metrics**: Guardian blocks, firewall actions
6. **Cost Tracking**: Model costs per task, per agent

### Storage Backend
```typescript
interface PerformanceLog {
  timestamp: Date;
  sessionId: string;
  taskId: string;
  agent: string;
  model: string;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
    cost: number;
    success: boolean;
    error?: string;
  };
  context: {
    workflowStage: string;
    taskComplexity: string;
    toolsUsed: string[];
    filesTouched: string[];
  };
}
```

## Implementation

### 1. Model Usage Tracker
```typescript
class ModelUsageTracker {
  private logs: ModelLog[] = [];
  
  async trackApiCall(
    model: string,
    provider: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number
  ): Promise<void> {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    
    const log: ModelLog = {
      timestamp: new Date(),
      model,
      provider,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs,
      cost,
      sessionId: this.getCurrentSessionId()
    };
    
    this.logs.push(log);
    await this.persistLog(log);
    
    // Update real-time metrics
    this.updateMetrics(model, log);
  }
  
  private calculateCost(model: string, input: number, output: number): number {
    const rates = this.getModelRates(model);
    return (input * rates.inputPer1K / 1000) + (output * rates.outputPer1K / 1000);
  }
  
  getModelRates(model: string): ModelRates {
    // Model pricing (per 1K tokens)
    const rates: Record<string, ModelRates> = {
      'glm-5-turbo': { inputPer1K: 0.005, outputPer1K: 0.015 },
      'glm-4.7': { inputPer1K: 0.003, outputPer1K: 0.009 },
      'glm-4.5-flash': { inputPer1K: 0.001, outputPer1K: 0.003 },
      'deepseek-reasoner': { inputPer1K: 0.002, outputPer1K: 0.006 },
      'deepseek-chat': { inputPer1K: 0.001, outputPer1K: 0.003 },
      'mimo-v2-omni': { inputPer1K: 0.004, outputPer1K: 0.012 },
      'nemotron-3-super': { inputPer1K: 0.006, outputPer1K: 0.018 }
    };
    
    return rates[model] || { inputPer1K: 0.001, outputPer1K: 0.003 };
  }
}
```

### 2. Agent Performance Tracker
```typescript
class AgentPerformanceTracker {
  private agentStats: Map<string, AgentStats> = new Map();
  
  async trackAgentPerformance(
    agent: string,
    task: string,
    success: boolean,
    durationMs: number,
    error?: string
  ): Promise<void> {
    const stats = this.agentStats.get(agent) || this.createDefaultStats(agent);
    
    stats.totalTasks++;
    stats.totalDurationMs += durationMs;
    
    if (success) {
      stats.successfulTasks++;
    } else {
      stats.failedTasks++;
      if (error) {
        stats.errorCounts[error] = (stats.errorCounts[error] || 0) + 1;
      }
    }
    
    // Update averages
    stats.avgDurationMs = stats.totalDurationMs / stats.totalTasks;
    stats.successRate = (stats.successfulTasks / stats.totalTasks) * 100;
    
    this.agentStats.set(agent, stats);
    await this.persistAgentStats(agent, stats);
  }
  
  getAgentRecommendation(task: string): string {
    // Analyze task and recommend best agent based on historical performance
    const taskType = this.analyzeTaskType(task);
    const candidates = this.getCandidatesForTaskType(taskType);
    
    return candidates.reduce((best, current) => {
      const statsA = this.agentStats.get(best) || this.createDefaultStats(best);
      const statsB = this.agentStats.get(current) || this.createDefaultStats(current);
      
      // Weighted score: 70% success rate, 30% speed
      const scoreA = (statsA.successRate * 0.7) + ((1000 / statsA.avgDurationMs) * 0.3);
      const scoreB = (statsB.successRate * 0.7) + ((1000 / statsB.avgDurationMs) * 0.3);
      
      return scoreB > scoreA ? current : best;
    });
  }
}
```

### 3. Workflow Metrics Tracker
```typescript
class WorkflowMetricsTracker {
  private stageMetrics: Map<string, StageMetrics> = new Map();
  
  async trackStageCompletion(
    stage: WorkflowStep,
    durationMs: number,
    violations: number,
    autoFixes: number
  ): Promise<void> {
    const metrics = this.stageMetrics.get(stage) || this.createStageMetrics(stage);
    
    metrics.completions++;
    metrics.totalDurationMs += durationMs;
    metrics.totalViolations += violations;
    metrics.totalAutoFixes += autoFixes;
    
    // Update averages
    metrics.avgDurationMs = metrics.totalDurationMs / metrics.completions;
    metrics.violationsPerCompletion = metrics.totalViolations / metrics.completions;
    metrics.autoFixesPerCompletion = metrics.totalAutoFixes / metrics.completions;
    
    this.stageMetrics.set(stage, metrics);
  }
  
  getBottleneckAnalysis(): BottleneckReport {
    const reports: StageBottleneck[] = [];
    
    for (const [stage, metrics] of this.stageMetrics) {
      if (metrics.avgDurationMs > this.getThreshold(stage)) {
        reports.push({
          stage,
          avgDurationMs: metrics.avgDurationMs,
          threshold: this.getThreshold(stage),
          recommendation: this.getRecommendation(stage)
        });
      }
    }
    
    return {
      timestamp: new Date(),
      totalStages: this.stageMetrics.size,
      bottlenecks: reports,
      overallHealth: this.calculateOverallHealth()
    };
  }
}
```

### 4. Cost Analytics
```typescript
class CostAnalytics {
  private dailyCosts: Map<string, DailyCost> = new Map();
  
  async trackCost(
    agent: string,
    model: string,
    cost: number,
    taskId: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const daily = this.dailyCosts.get(today) || this.createDailyCost(today);
    
    daily.totalCost += cost;
    daily.agentCosts[agent] = (daily.agentCosts[agent] || 0) + cost;
    daily.modelCosts[model] = (daily.modelCosts[model] || 0) + cost;
    daily.tasks.push({ taskId, cost, agent, model, timestamp: new Date() });
    
    this.dailyCosts.set(today, daily);
    
    // Check budget alerts
    await this.checkBudgetAlerts(daily);
  }
  
  async checkBudgetAlerts(daily: DailyCost): Promise<void> {
    const budget = this.getDailyBudget();
    
    if (daily.totalCost > budget * 0.8) {
      await this.sendAlert({
        type: 'budget_warning',
        message: `Daily cost ($${daily.totalCost.toFixed(2)}) approaching budget ($${budget})`,
        daily,
        percentage: (daily.totalCost / budget) * 100
      });
    }
    
    if (daily.totalCost > budget) {
      await this.sendAlert({
        type: 'budget_exceeded',
        message: `Daily budget exceeded: $${daily.totalCost.toFixed(2)} > $${budget}`,
        daily,
        overage: daily.totalCost - budget
      });
    }
  }
  
  getCostOptimizationSuggestions(): CostSuggestion[] {
    const suggestions: CostSuggestion[] = [];
    const last7Days = this.getLastNDays(7);
    
    // Analyze agent costs
    const agentAverages = this.calculateAgentAverages(last7Days);
    for (const [agent, avgCost] of Object.entries(agentAverages)) {
      const alternative = this.findCheaperAlternative(agent);
      if (alternative && alternative.avgCost < avgCost * 0.7) {
        suggestions.push({
          type: 'agent_switch',
          current: agent,
          alternative: alternative.agent,
          savings: avgCost - alternative.avgCost,
          confidence: this.calculateSwitchConfidence(agent, alternative.agent)
        });
      }
    }
    
    // Analyze model usage patterns
    const modelPatterns = this.analyzeModelPatterns(last7Days);
    for (const pattern of modelPatterns.inefficient) {
      suggestions.push({
        type: 'model_optimization',
        pattern: pattern.description,
        recommendation: pattern.recommendation,
        potentialSavings: pattern.savings
      });
    }
    
    return suggestions;
  }
}
```

## Dashboard & Reporting

### Real-Time Dashboard
```typescript
class PerformanceDashboard {
  async getRealTimeMetrics(): Promise<DashboardMetrics> {
    return {
      currentSession: await this.getCurrentSessionMetrics(),
      today: await this.getTodayMetrics(),
      agents: await this.getAgentPerformance(),
      models: await this.getModelUsage(),
      workflow: await this.getWorkflowMetrics(),
      costs: await this.getCostMetrics(),
      alerts: await this.getActiveAlerts()
    };
  }
  
  async generateDailyReport(): Promise<DailyReport> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    return {
      date: today,
      summary: {
        totalTasks: await this.getTaskCount(today),
        successfulTasks: await this.getSuccessfulTaskCount(today),
        successRate: await this.getSuccessRate(today),
        totalCost: await this.getTotalCost(today),
        avgCostPerTask: await this.getAvgCostPerTask(today),
        totalTokens: await this.getTotalTokens(today)
      },
      agentPerformance: await this.getAgentPerformanceForDate(today),
      modelUsage: await this.getModelUsageForDate(today),
      workflowEfficiency: await this.getWorkflowEfficiency(today),
      costAnalysis: await this.getCostAnalysis(today, yesterday),
      recommendations: await this.getRecommendations(today)
    };
  }
}
```

### Report Generation
```bash
#!/bin/bash
# Generate performance reports

# Daily report
shark-oc --report daily --output daily-report-$(date +%Y%m%d).json

# Weekly summary  
shark-oc --report weekly --output weekly-report-$(date +%Y%m).json

# Agent performance report
shark-oc --report agents --output agent-performance-$(date +%Y%m%d).json

# Cost analysis report
shark-oc --report costs --output cost-analysis-$(date +%Y%m%d).json
```

## Integration with OpenCode

### OpenCode Plugin Integration
```typescript
// OpenCode plugin for performance logging
class SharkPerformancePlugin implements OpenCodePlugin {
  private tracker: ModelUsageTracker;
  private agentTracker: AgentPerformanceTracker;
  
  constructor() {
    this.tracker = new ModelUsageTracker();
    this.agentTracker = new AgentPerformanceTracker();
  }
  
  async onToolCall(toolCall: ToolCall, result: ToolResult): Promise<void> {
    // Track tool usage
    await this.trackToolUsage(toolCall, result);
  }
  
  async onAgentResponse(agent: string, response: AgentResponse): Promise<void> {
    // Track agent performance
    const duration = Date.now() - response.startTime;
    const success = !response.error;
    
    await this.agentTracker.trackAgentPerformance(
      agent,
      response.task,
      success,
      duration,
      response.error
    );
    
    // Track model usage if available
    if (response.modelUsage) {
      await this.tracker.trackApiCall(
        response.model,
        response.provider,
        response.modelUsage.inputTokens,
        response.modelUsage.outputTokens,
        duration
      );
    }
  }
  
  async onWorkflowStageChange(
    oldStage: WorkflowStep,
    newStage: WorkflowStep,
    context: any
  ): Promise<void> {
    // Track workflow stage transitions
    await this.trackWorkflowTransition(oldStage, newStage, context);
  }
}
```

### Configuration
```json
{
  "performanceLogging": {
    "enabled": true,
    "storage": {
      "type": "file",
      "path": "~/.config/opencode/logs/",
      "retentionDays": 30
    },
    "metrics": {
      "modelUsage": true,
      "agentPerformance": true,
      "workflowMetrics": true,
      "costTracking": true,
      "toolUsage": true
    },
    "alerts": {
      "budget": {
        "daily": 10.0,
        "weekly": 50.0,
        "monthly": 200.0
      },
      "performance": {
        "successRateThreshold": 80,
        "latencyThresholdMs": 30000
      }
    },
    "reporting": {
      "dailyReport": true,
      "weeklySummary": true,
      "agentPerformance": true
    }
  }
}
```

## Analytics & Insights

### Performance Insights
```typescript
class PerformanceInsights {
  async getTopPerformingAgents(
    period: 'day' | 'week' | 'month',
    taskType?: string
  ): Promise<AgentRanking[]> {
    const data = await this.getPerformanceData(period);
    
    return data
      .filter(entry => !taskType || entry.taskType === taskType)
      .map(entry => ({
        agent: entry.agent,
        successRate: entry.successRate,
        avgDurationMs: entry.avgDurationMs,
        tasksCompleted: entry.tasksCompleted,
        costPerTask: entry.avgCost
      }))
      .sort((a, b) => {
        // Composite score: success rate (50%), speed (30%), cost (20%)
        const scoreA = (a.successRate * 0.5) + 
                      ((1000 / a.avgDurationMs) * 0.3) + 
                      ((1 / a.costPerTask) * 0.2);
        const scoreB = (b.successRate * 0.5) + 
                      ((1000 / b.avgDurationMs) * 0.3) + 
                      ((1 / b.costPerTask) * 0.2);
        return scoreB - scoreA;
      });
  }
  
  async getCostOptimizationOpportunities(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];
    
    // 1. Model substitution opportunities
    const modelSubstitutions = await this.findModelSubstitutions();
    opportunities.push(...modelSubstitutions);
    
    // 2. Agent routing optimizations
    const routingOptimizations = await this.findRoutingOptimizations();
    opportunities.push(...routingOptimizations);
    
    // 3. Workflow efficiency improvements
    const workflowImprovements = await this.findWorkflowImprovements();
    opportunities.push(...workflowImprovements);
    
    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
  
  async getPredictiveRouting(
    task: string,
    context: any
  ): Promise<RoutingPrediction> {
    const taskType = this.classifyTask(task);
    const similarTasks = await this.findSimilarTasks(taskType);
    
    return {
      recommendedAgent: this.predictBestAgent(similarTasks),
      expectedSuccessRate: this.predictSuccessRate(similarTasks),
      expectedCost: this.predictCost(similarTasks),
      expectedDuration: this.predictDuration(similarTasks),
      confidence: this.calculateConfidence(similarTasks)
    };
  }
}
```

## Command Line Interface

### Performance Commands
```bash
# Show real-time metrics
shark-oc --metrics

# Show today's performance
shark-oc --metrics today

# Show agent performance
shark-oc --metrics agents

# Show cost analysis
shark-oc --metrics costs

# Generate report
shark-oc --report daily --format json
shark-oc --report weekly --format html

# Get optimization suggestions
shark-oc --optimize

# Clear old logs
shark-oc --metrics clean --older-than 30d
```

### Interactive Dashboard
```bash
# Start interactive performance dashboard
shark-oc --dashboard

# Dashboard with specific view
shark-oc --dashboard costs
shark-oc --dashboard agents
shark-oc --dashboard workflow
```

## Alerting System

### Alert Configuration
```json
{
  "alerts": {
    "budget": {
      "daily": 10.0,
      "weekly": 50.0,
      "monthly": 200.0,
      "notifications": ["console", "email", "slack"]
    },
    "performance": {
      "successRate": 80,
      "latency": 30000,
      "errorRate": 10,
      "notifications": ["console"]
    },
    "system": {
      "diskSpace": 1024,  # MB
      "memoryUsage": 80,   # percentage
      "notifications": ["console", "email"]
    }
  }
}
```

### Alert Examples
```typescript
interface Alert {
  type: 'budget' | 'performance' | 'system' | 'security';
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
  actions: string[];
}

// Example alerts
const alerts: Alert[] = [
  {
    type: 'budget',
    level: 'warning',
    message: 'Daily budget (80%) approaching limit',
    data: { dailyCost: 8.0, budget: 10.0, percentage: 80 },
    timestamp: new Date(),
    actions: ['Consider switching to cheaper models', 'Review large tasks']
  },
  {
    type: 'performance',
    level: 'error',
    message: 'Agent success rate below threshold',
    data: { agent: 'architect', successRate: 65, threshold: 80 },
    timestamp: new Date(),
    actions: ['Review failed tasks', 'Consider agent retraining']
  },
  {
    type: 'system',
    level: 'warning',
    message: 'High memory usage detected',
    data: { memoryUsage: 85, threshold: 80 },
    timestamp: new Date(),
    actions: ['Clear cache', 'Restart service']
  }
];
```

## Data Retention & Privacy

### Retention Policies
```typescript
class DataRetentionManager {
  private policies: RetentionPolicy[] = [
    {
      dataType: 'performance_logs',
      retentionDays: 30,
      compression: true,
      anonymize: false
    },
    {
      dataType: 'cost_data',
      retentionDays: 90,
      compression: true,
      anonymize: true
    },
    {
      dataType: 'error_logs',
      retentionDays: 7,
      compression: false,
      anonymize: true
    },
    {
      dataType: 'user_tasks',
      retentionDays: 14,
      compression: true,
      anonymize: true
    }
  ];
  
  async applyRetentionPolicies(): Promise<void> {
    for (const policy of this.policies) {
      await this.cleanupOldData(policy);
    }
  }
  
  async anonymizeData(data: any): Promise<any> {
    // Remove personally identifiable information
    const anonymized = { ...data };
    
    if (anonymized.user) {
      anonymized.user = this.hashUser(anonymized.user);
    }
    
    if (anonymized.filePaths) {
      anonymized.filePaths = anonymized.filePaths.map((path: string) =>
        path.replace(/\/home\/[^/]+/, '/home/***')
      );
    }
    
    return anonymized;
  }
}
```

## Conclusion

The Shark performance logging system provides comprehensive analytics for the integrated opencode-ultra system, enabling:

1. **Cost Optimization**: Track and optimize model usage costs
2. **Performance Monitoring**: Monitor agent and workflow performance
3. **Predictive Routing**: Intelligent agent selection based on historical data
4. **Alerting**: Proactive notifications for issues
5. **Reporting**: Detailed analytics and insights

This system transforms the integrated Shark Frankenstein CLI from a tool into a data-driven development platform with continuous improvement capabilities.