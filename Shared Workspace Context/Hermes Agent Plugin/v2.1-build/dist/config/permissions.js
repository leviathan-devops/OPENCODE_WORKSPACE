const DEFAULT_ALLOW = ["read_file", "glob", "grep", "bash"];
const DEFAULT_DENY = ["rm -rf /", "sudo", "* secrets*"];
export class PermissionCascade {
    config;
    projectPath;
    rules = [];
    constructor(config, projectPath) {
        this.config = config;
        this.projectPath = projectPath;
        this.buildRules();
    }
    buildRules() {
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
    globToRegex(pattern) {
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".");
        return new RegExp(`^${escaped}$`, "i");
    }
    check(ctx) {
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
    matches(pattern, ctx) {
        if (pattern.test(ctx.tool))
            return true;
        if (ctx.path && pattern.test(ctx.path))
            return true;
        if (pattern.test(`${ctx.tool}:${ctx.path || ""}`))
            return true;
        return false;
    }
    addRule(rule) {
        this.rules.unshift(rule);
    }
    removeRules(action) {
        this.rules = this.rules.filter((r) => r.action !== action);
    }
}
export function createPermissionCascade(config, projectPath) {
    return new PermissionCascade(config, projectPath);
}
