import type { HermesAgentConfig } from "./schema.js";

export interface PermissionRule {
  action: "allow" | "deny";
  pattern: RegExp;
  reason?: string;
}

export interface PermissionContext {
  agent: string;
  tool: string;
  path?: string;
  directory: string;
}

const DEFAULT_ALLOW = ["read_file", "glob", "grep", "bash"];
const DEFAULT_DENY = ["rm -rf /", "sudo", "* secrets*"];

export class PermissionCascade {
  private rules: PermissionRule[] = [];

  constructor(
    private config: HermesAgentConfig,
    private projectPath?: string
  ) {
    this.buildRules();
  }

  private buildRules() {
    this.rules = [];

    const denyList = this.config.permissions?.deny ?? [];
    for (const deny of denyList) {
      this.rules.push({
        action: "deny",
        pattern: this.globToRegex(deny),
        reason: "User-configured deny",
      });
    }

    const allowList = this.config.permissions?.allow ?? [];
    for (const allow of allowList) {
      this.rules.push({
        action: "allow",
        pattern: this.globToRegex(allow),
        reason: "User-configured allow",
      });
    }
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`, "i");
  }

  check(ctx: PermissionContext): { allowed: boolean; reason?: string } {
    for (const rule of this.rules) {
      if (this.matches(rule.pattern, ctx)) {
        return {
          allowed: rule.action === "allow",
          reason: rule.reason,
        };
      }
    }

    if (DEFAULT_DENY.some((d) => ctx.tool.includes(d))) {
      return { allowed: false, reason: "Default deny" };
    }

    if (DEFAULT_ALLOW.includes(ctx.tool)) {
      return { allowed: true, reason: "Default allow" };
    }

    return { allowed: true, reason: "No rule matched, default allow" };
  }

  private matches(pattern: RegExp, ctx: PermissionContext): boolean {
    if (pattern.test(ctx.tool)) return true;
    if (ctx.path && pattern.test(ctx.path)) return true;
    if (pattern.test(`${ctx.tool}:${ctx.path || ""}`)) return true;
    return false;
  }

  addRule(rule: PermissionRule) {
    this.rules.unshift(rule);
  }

  removeRules(action: "allow" | "deny") {
    this.rules = this.rules.filter((r) => r.action !== action);
  }
}

export function createPermissionCascade(
  config: HermesAgentConfig,
  projectPath?: string
): PermissionCascade {
  return new PermissionCascade(config, projectPath);
}
