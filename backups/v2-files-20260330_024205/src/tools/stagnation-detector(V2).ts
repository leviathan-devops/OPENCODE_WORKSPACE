/**
 * 🦈 SHARK CLI - Stagnation Detector
 *
 * Tracks repeated failures (same command/tool 3x+) and triggers escalation.
 * Forces approach change after thresholds, does not block flow.
 *
 * DESIGN PRINCIPLE: Detect loops, suggest alternatives, escalate to orchestrator.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ToolCall } from '../brain/types';

export interface StagnationEvent {
  timestamp: string;
  tool: string;
  identifier: string;
  failureReason: string;
  attemptNumber: number;
}

export interface StagnationAlert {
  type: 'warning' | 'critical' | 'escalation';
  tool: string;
  identifier: string;
  attemptCount: number;
  message: string;
  suggestions: string[];
}

export interface StagnationConfig {
  warningThreshold: number;
  criticalThreshold: number;
  escalationThreshold: number;
  resetAfterMs: number;
  maxHistorySize: number;
}

const DEFAULT_CONFIG: StagnationConfig = {
  warningThreshold: 2,
  criticalThreshold: 3,
  escalationThreshold: 5,
  resetAfterMs: 300000, // 5 minutes
  maxHistorySize: 1000,
};

export class StagnationDetector {
  private history: Map<string, StagnationEvent[]> = new Map();
  private config: StagnationConfig;
  private storagePath: string;
  private alerts: StagnationAlert[] = [];

  constructor(workspacePath: string, config: Partial<StagnationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storagePath = path.join(workspacePath, '.shark', 'stagnation-history.json');
    this.loadHistory();
  }

  recordFailure(toolCall: ToolCall, failureReason: string): StagnationAlert | null {
    const identifier = this.getIdentifier(toolCall);
    const key = `${toolCall.name}:${identifier}`;
    const timestamp = new Date().toISOString();

    const events = this.history.get(key) || [];
    
    const filtered = events.filter(
      e => Date.now() - new Date(e.timestamp).getTime() < this.config.resetAfterMs
    );

    const newEvent: StagnationEvent = {
      timestamp,
      tool: toolCall.name,
      identifier,
      failureReason,
      attemptNumber: filtered.length + 1,
    };

    filtered.push(newEvent);
    this.history.set(key, filtered);
    this.pruneHistory();
    this.saveHistory();

    return this.checkThresholds(key, filtered);
  }

  private getIdentifier(toolCall: ToolCall): string {
    switch (toolCall.name) {
      case 'run_command':
        return this.normalizeCommand(toolCall.arguments.command as string);
      case 'write_file':
        return toolCall.arguments.file_path as string;
      case 'read_file':
        return toolCall.arguments.file_path as string;
      default:
        return JSON.stringify(toolCall.arguments).slice(0, 100);
    }
  }

  private normalizeCommand(command: string): string {
    return command
      .replace(/--?[a-zA-Z-]+=\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  private checkThresholds(key: string, events: StagnationEvent[]): StagnationAlert | null {
    const count = events.length;
    const lastEvent = events[events.length - 1];
    
    let alert: StagnationAlert | null = null;

    if (count >= this.config.escalationThreshold) {
      alert = {
        type: 'escalation',
        tool: lastEvent.tool,
        identifier: lastEvent.identifier,
        attemptCount: count,
        message: `ESCALATION: ${lastEvent.tool} failed ${count} times - requires orchestrator intervention`,
        suggestions: this.generateSuggestions(lastEvent.tool, lastEvent.identifier, count),
      };
    } else if (count >= this.config.criticalThreshold) {
      alert = {
        type: 'critical',
        tool: lastEvent.tool,
        identifier: lastEvent.identifier,
        attemptCount: count,
        message: `CRITICAL: ${lastEvent.tool} failing repeatedly (${count}x) - consider alternative approach`,
        suggestions: this.generateSuggestions(lastEvent.tool, lastEvent.identifier, count),
      };
    } else if (count >= this.config.warningThreshold) {
      alert = {
        type: 'warning',
        tool: lastEvent.tool,
        identifier: lastEvent.identifier,
        attemptCount: count,
        message: `WARNING: ${lastEvent.tool} failed ${count} times - may need approach change`,
        suggestions: this.generateSuggestions(lastEvent.tool, lastEvent.identifier, count),
      };
    }

    if (alert) {
      this.alerts.push(alert);
    }

    return alert;
  }

  private generateSuggestions(tool: string, identifier: string, count: number): string[] {
    const suggestions: string[] = [];

    if (tool === 'run_command') {
      suggestions.push('Check command syntax and required dependencies');
      suggestions.push('Try running with verbose logging: shark --verbose');
      suggestions.push('Consider breaking into smaller steps');
      if (count >= 4) {
        suggestions.push('ESCALATE: Run AutoDebug analysis: shark debug analyze');
      }
    } else if (tool === 'write_file') {
      suggestions.push('Check file permissions and disk space');
      suggestions.push('Verify parent directory exists');
      suggestions.push('Check Guardian zone classification');
    } else if (tool === 'read_file') {
      suggestions.push('Verify file path is correct');
      suggestions.push('Check file encoding (expected UTF-8)');
    }

    if (count >= 5) {
      suggestions.push('Consider asking user for guidance');
      suggestions.push('Review recent changes that may have caused this');
    }

    return suggestions;
  }

  getStats(): {
    totalFailures: number;
    uniqueTools: number;
    topFailures: Array<{ tool: string; identifier: string; count: number }>;
    recentAlerts: StagnationAlert[];
  } {
    let totalFailures = 0;
    const toolSet = new Set<string>();
    const failureCounts: Array<{ tool: string; identifier: string; count: number }> = [];

    for (const [key, events] of this.history) {
      totalFailures += events.length;
      const [tool] = key.split(':');
      toolSet.add(tool);
      if (events.length > 0) {
        failureCounts.push({
          tool: events[0].tool,
          identifier: events[0].identifier,
          count: events.length,
        });
      }
    }

    return {
      totalFailures,
      uniqueTools: toolSet.size,
      topFailures: failureCounts.sort((a, b) => b.count - a.count).slice(0, 5),
      recentAlerts: this.alerts.slice(-10),
    };
  }

  clearHistory(): void {
    this.history.clear();
    this.alerts = [];
    if (fs.existsSync(this.storagePath)) {
      fs.unlinkSync(this.storagePath);
    }
  }

  private pruneHistory(): void {
    if (this.history.size > this.config.maxHistorySize) {
      const keys = Array.from(this.history.keys());
      const toRemove = keys.slice(0, keys.length - this.config.maxHistorySize);
      for (const key of toRemove) {
        this.history.delete(key);
      }
    }
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        for (const [key, events] of Object.entries(data.history || {})) {
          this.history.set(key, events as StagnationEvent[]);
        }
        this.alerts = data.alerts || [];
      }
    } catch {
      // Start fresh if corrupt
    }
  }

  private saveHistory(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        history: Object.fromEntries(this.history),
        alerts: this.alerts.slice(-100),
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch {
      // Fail silently
    }
  }
}

export default StagnationDetector;
