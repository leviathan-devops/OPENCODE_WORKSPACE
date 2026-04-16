"use strict";
/**
 * DEEP PLANNING MODE - Pattern Library
 *
 * Contains all regex patterns for requirement extraction,
 * dependency mapping, risk analysis, and checkpoint detection.
 *
 * Each pattern follows the format:
 * { regex: RegExp, severity: SEVERITY, note?: string }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTRAINT_PATTERNS = exports.CHECKPOINT_PATTERNS = exports.RISK_PATTERNS = exports.DEPENDENCY_PATTERNS = exports.REQUIREMENT_PATTERNS = exports.SEVERITY = void 0;
exports.scanWithPatterns = scanWithPatterns;
exports.scanRequirements = scanRequirements;
exports.scanConstraints = scanConstraints;
exports.scanDeliverables = scanDeliverables;
exports.scanFileDependencies = scanFileDependencies;
exports.scanAPIDependencies = scanAPIDependencies;
exports.scanServiceDependencies = scanServiceDependencies;
exports.scanHumanDependencies = scanHumanDependencies;
exports.scanRisks = scanRisks;
exports.scanCheckpoints = scanCheckpoints;
exports.scanTimeConstraints = scanTimeConstraints;
exports.scanScopeConstraints = scanScopeConstraints;
exports.fullScan = fullScan;
const types_1 = require("./types");
Object.defineProperty(exports, "SEVERITY", { enumerable: true, get: function () { return types_1.SEVERITY; } });
// ============================================================
// REQUIREMENT PATTERNS
// Extract requirements, constraints, and deliverables from text
// ============================================================
exports.REQUIREMENT_PATTERNS = {
    FEATURE: [
        {
            regex: /feature:\s*(.+)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Explicit feature declaration'
        },
        {
            regex: /should\s+([^\n]+?)(?=\s+should|\.|$|\n)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'User expectation statement'
        },
        {
            regex: /needs?\s+([^\n]+?)(?=\.|$|\s+should|\s+need)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Stated user need'
        },
        {
            regex: /want\s+([^\n]+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.LOW,
            note: 'User desire'
        },
        {
            regex: /as\s+a\s+(?:\w+),?\s+I\s+(?:want|need|should)\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'User story format'
        },
    ],
    CONSTRAINT: [
        {
            regex: /must\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Hard constraint'
        },
        {
            regex: /can't\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Negative constraint'
        },
        {
            regex: /cannot\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Negative constraint'
        },
        {
            regex: /only\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Scope constraint'
        },
        {
            regex: /within\s+(\d+)\s*(hour|day|week|month)s?/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Time constraint'
        },
        {
            regex: /budget\s+(?:is\s+)?(\d+)\s*(?:dollars|usd|\$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Budget constraint'
        },
        {
            regex: /limited\s+to\s+(\d+)\s*(?:users?|requests?|items?)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Scale constraint'
        },
    ],
    DELIVERABLE: [
        {
            regex: /deliverable:\s*(.+)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Explicit deliverable'
        },
        {
            regex: /end\s+result\s+is\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Outcome statement'
        },
        {
            regex: /produce\s+(?:a\s+)?(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Production statement'
        },
        {
            regex: /generate\s+(?:a\s+)?(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Generation statement'
        },
        {
            regex: /create\s+(?:a\s+)?(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.LOW,
            note: 'Creation statement'
        },
    ],
};
// ============================================================
// DEPENDENCY PATTERNS
// Map file, API, service, and human dependencies
// ============================================================
exports.DEPENDENCY_PATTERNS = {
    FILE_DEP: [
        {
            regex: /depends?\s+on\s+[`'"]?([\w./-]+)[`'"]?/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Explicit file dependency'
        },
        {
            regex: /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|[A-Z]\w*)\s+from\s+[`'"]?([\w./-]+)[`'"]?/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'ES6 import statement'
        },
        {
            regex: /import\s+[`'"]?([\w./-]+)[`'"]?/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'CommonJS import'
        },
        {
            regex: /require\s*\(\s*[`'"]?([\w./-]+)[`'"]?\s*\)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'CommonJS require statement'
        },
        {
            regex: /from\s+[`'"]?([\w./-]+)[`'"]?\s+import/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Python import'
        },
        {
            regex: /#include\s*[<"]([^\">]+)[>"]/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'C/C++ include'
        },
        {
            regex: /extends\s+([A-Z]\w*)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Class inheritance'
        },
        {
            regex: /implements\s+([A-Z]\w*)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Interface implementation'
        },
    ],
    API_DEP: [
        {
            regex: /api:\s*(\w+)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Named API dependency'
        },
        {
            regex: /calls?\s+(?:the\s+)?(\w+)\s*API/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'API call statement'
        },
        {
            regex: /(\w+)\s+API/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'API reference'
        },
        {
            regex: /endpoint:\s*(\/\S+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Endpoint reference'
        },
        {
            regex: /GET|POST|PUT|DELETE|PATCH\s+(\/\S+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'HTTP method endpoint'
        },
        {
            regex: /base[_\s]?url:\s*(\S+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Base URL config'
        },
    ],
    SERVICE_DEP: [
        {
            regex: /service:\s*(\w+)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Named service dependency'
        },
        {
            regex: /uses?\s+(?:the\s+)?(\w+)\s+service/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Service usage'
        },
        {
            regex: /connects?\s+to\s+(\w+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Service connection'
        },
        {
            regex: /(\w+)\s+database/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Database dependency'
        },
        {
            regex: /queue:\s*(\w+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Queue dependency'
        },
        {
            regex: /cache:\s*(\w+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Cache dependency'
        },
    ],
    HUMAN_DEP: [
        {
            regex: /needs?\s+(?:\w+\s+)?to\s+(?:contact|ask|coordinate|check\s+with)\s+(\w+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Human dependency'
        },
        {
            regex: /coordinate\s+with\s+(\w+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Coordination needed'
        },
        {
            regex: /approval\s+from\s+(\w+)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Approval dependency'
        },
        {
            regex: /depends?\s+on\s+(\w+)\s+team/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Team dependency'
        },
        {
            regex: /input\s+from\s+(\w+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Input provider'
        },
    ],
};
// ============================================================
// RISK PATTERNS
// Identify failure modes, blockers, and uncertainties
// ============================================================
exports.RISK_PATTERNS = {
    FAILURE_MODE: [
        {
            regex: /might\s+(?:fail|break|crash|error)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Stated failure possibility'
        },
        {
            regex: /could\s+(?:fail|break|crash|error)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Stated failure possibility'
        },
        {
            regex: /race\s+condition/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Concurrency risk'
        },
        {
            regex: /deadlock/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Critical concurrency risk'
        },
        {
            regex: /memory\s+leak/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Resource leak risk'
        },
        {
            regex: /stack\s+overflow/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Critical resource risk'
        },
        {
            regex: /null\s+pointer|null\s+reference|npe/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Null reference risk'
        },
        {
            regex: /timeout/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Timeout risk'
        },
        {
            regex: /data\s+loss/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Critical data risk'
        },
        {
            regex: /data\s+corruption/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Critical data risk'
        },
    ],
    BLOCKER: [
        {
            regex: /blocked\s+by\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Stated blocker'
        },
        {
            regex: /blocker:\s*(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Named blocker'
        },
        {
            regex: /waiting\s+on\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Pending dependency'
        },
        {
            regex: /circular\s+dependency|circular\s+dep/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Critical circular dependency'
        },
        {
            regex: /cyclic\s+dependency/gi,
            severity: types_1.SEVERITY.CRITICAL,
            note: 'Critical cyclic dependency'
        },
        {
            regex: /chicken\s+and\s+egg/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Circular dependency reference'
        },
        {
            regex: /can't\s+proceed\s+until/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Proceed blocker'
        },
    ],
    UNCERTAINTY: [
        {
            regex: /unknown\s+(?:if|whether)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Uncertainty flagged'
        },
        {
            regex: /not\s+sure\s+(?:if|whether|about)/gi,
            severity: types_1.SEVERITY.LOW,
            note: 'Minor uncertainty'
        },
        {
            regex: /might\s+need\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Potential requirement'
        },
        {
            regex: /may\s+(?:need|require|have)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Potential requirement'
        },
        {
            regex: /unclear\s+(?:if|whether|what)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Unclear requirement'
        },
        {
            regex: /tbd|to\s+be\s+determined/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Unresolved item'
        },
        {
            regex: /todo|fixme|xxx/gi,
            severity: types_1.SEVERITY.LOW,
            note: 'TODO marker'
        },
    ],
};
// ============================================================
// CHECKPOINT PATTERNS
// Detect milestones, deliverables, and timeline markers
// ============================================================
exports.CHECKPOINT_PATTERNS = {
    MILESTONE: [
        {
            regex: /^##\s*Step\s+(\d+):\s*(.+)/gm,
            severity: types_1.SEVERITY.INFO,
            note: 'Explicit step header'
        },
        {
            regex: /^###\s*(.+?)\s*(?:\((\d+)h?\))?\s*$/gm,
            severity: types_1.SEVERITY.INFO,
            note: 'Timed substep'
        },
        {
            regex: /^\s*-\s*\*\*([^*]+)\*\*:\s*(.+)/gm,
            severity: types_1.SEVERITY.INFO,
            note: 'Named item with description'
        },
        {
            regex: /^####?\s*(?:checkpoint|cp|milestone):\s*(.+)/gim,
            severity: types_1.SEVERITY.INFO,
            note: 'Checkpoint marker'
        },
    ],
    DELIVERABLE: [
        {
            regex: /^\s*-\s*\[\s*\]\s*(.+)/gm,
            severity: types_1.SEVERITY.INFO,
            note: 'Unchecked deliverable'
        },
        {
            regex: /^\s*-\s*\[x\]\s*(.+)/gim,
            severity: types_1.SEVERITY.INFO,
            note: 'Completed deliverable'
        },
        {
            regex: /^\s*\*\s*\[\s*\]\s*(.+)/gm,
            severity: types_1.SEVERITY.INFO,
            note: 'Alternate unchecked'
        },
    ],
    TIMELINE: [
        {
            regex: /(\d+)\s*(?:hour|hr|h)\s*(?:work|effort)/gi,
            severity: types_1.SEVERITY.INFO,
            note: 'Hour estimate'
        },
        {
            regex: /(\d+)\s*(?:day|dy|d)\s*(?:work|effort)/gi,
            severity: types_1.SEVERITY.INFO,
            note: 'Day estimate'
        },
        {
            regex: /week\s+(\d+)/gi,
            severity: types_1.SEVERITY.INFO,
            note: 'Week reference'
        },
        {
            regex: /phase\s*(\d+)/gi,
            severity: types_1.SEVERITY.INFO,
            note: 'Phase marker'
        },
    ],
};
// ============================================================
// CONSTRAINT PATTERNS
// Extract time, scope, and resource constraints
// ============================================================
exports.CONSTRAINT_PATTERNS = {
    TIME: [
        {
            regex: /deadline:\s*(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Explicit deadline'
        },
        {
            regex: /due\s+(?:by|in|on)\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Due date statement'
        },
        {
            regex: /complete\s+(?:by|within|in)\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Completion timeframe'
        },
        {
            regex: /within\s+(\d+)\s*(hour|day|week|month)s?/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Within timeframe'
        },
        {
            regex: /(\d+)\s*(?:hour|day|week|month)s?\s*(?:time|timeframe|limit)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Time limit'
        },
    ],
    SCOPE: [
        {
            regex: /scope:\s*(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Explicit scope'
        },
        {
            regex: /in\s+scope:\s*(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'In-scope items'
        },
        {
            regex: /out\s+of\s+scope:\s*(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Out-of-scope items'
        },
        {
            regex: /exclude[sd]?\s+(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Excluded items'
        },
    ],
    RESOURCE: [
        {
            regex: /budget:\s*(\d+)\s*(?:dollars|usd|\$)/gi,
            severity: types_1.SEVERITY.HIGH,
            note: 'Budget constraint'
        },
        {
            regex: /resources?:\s*(.+?)(?:\.|$)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Resource constraint'
        },
        {
            regex: /team\s+size:\s*(\d+)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Team size constraint'
        },
        {
            regex: /max\s+(\d+)\s*(?:users?|requests?|items?)/gi,
            severity: types_1.SEVERITY.MEDIUM,
            note: 'Scale constraint'
        },
    ],
};
/**
 * Scan content with a pattern category, ensuring global flag
 * and safety count to prevent infinite loops.
 */
function scanWithPatterns(content, patterns, category, options = {}) {
    const { maxMatches = 100, maxLineLength = 2000 } = options;
    const findings = [];
    const lines = content.split('\n');
    for (const pattern of patterns) {
        // Ensure global flag for exec() to advance
        let flags = pattern.regex.flags;
        if (!flags.includes('g')) {
            flags = flags + 'g';
        }
        const regex = new RegExp(pattern.regex.source, flags);
        let safetyCount = 0;
        let match;
        while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
            safetyCount++;
            // Calculate line and column
            const matchPos = match.index;
            let lineNum = 1;
            let lineStart = 0;
            for (let i = 0; i < lines.length; i++) {
                const lineEnd = lineStart + lines[i].length + 1; // +1 for newline
                if (matchPos < lineEnd) {
                    lineNum = i + 1;
                    break;
                }
                lineStart = lineEnd;
            }
            const col = matchPos - lineStart + 1;
            // Truncate evidence if too long
            let evidence = match[0];
            if (evidence.length > maxLineLength) {
                evidence = evidence.substring(0, maxLineLength) + '...[truncated]';
            }
            findings.push({
                pattern: pattern.regex.source,
                category,
                match: match[0],
                line: lineNum,
                column: col,
                severity: pattern.severity,
                note: pattern.note,
                evidence,
            });
            // Prevent infinite loop if match is empty
            if (match[0].length === 0) {
                regex.lastIndex++;
            }
        }
    }
    return findings;
}
// ============================================================
// CONVENIENCE SCANNERS
// ============================================================
function scanRequirements(content, options) {
    return scanWithPatterns(content, exports.REQUIREMENT_PATTERNS.FEATURE, 'REQUIREMENT', options);
}
function scanConstraints(content, options) {
    return scanWithPatterns(content, exports.REQUIREMENT_PATTERNS.CONSTRAINT, 'CONSTRAINT', options);
}
function scanDeliverables(content, options) {
    return scanWithPatterns(content, exports.REQUIREMENT_PATTERNS.DELIVERABLE, 'DELIVERABLE', options);
}
function scanFileDependencies(content, options) {
    return scanWithPatterns(content, exports.DEPENDENCY_PATTERNS.FILE_DEP, 'FILE_DEP', options);
}
function scanAPIDependencies(content, options) {
    return scanWithPatterns(content, exports.DEPENDENCY_PATTERNS.API_DEP, 'API_DEP', options);
}
function scanServiceDependencies(content, options) {
    return scanWithPatterns(content, exports.DEPENDENCY_PATTERNS.SERVICE_DEP, 'SERVICE_DEP', options);
}
function scanHumanDependencies(content, options) {
    return scanWithPatterns(content, exports.DEPENDENCY_PATTERNS.HUMAN_DEP, 'HUMAN_DEP', options);
}
function scanRisks(content, options) {
    return [
        ...scanWithPatterns(content, exports.RISK_PATTERNS.FAILURE_MODE, 'FAILURE_MODE', options),
        ...scanWithPatterns(content, exports.RISK_PATTERNS.BLOCKER, 'BLOCKER', options),
        ...scanWithPatterns(content, exports.RISK_PATTERNS.UNCERTAINTY, 'UNCERTAINTY', options),
    ];
}
function scanCheckpoints(content, options) {
    return scanWithPatterns(content, exports.CHECKPOINT_PATTERNS.MILESTONE, 'MILESTONE', options);
}
function scanTimeConstraints(content, options) {
    return scanWithPatterns(content, exports.CONSTRAINT_PATTERNS.TIME, 'TIME', options);
}
function scanScopeConstraints(content, options) {
    return scanWithPatterns(content, exports.CONSTRAINT_PATTERNS.SCOPE, 'SCOPE', options);
}
/**
 * Full scan - all pattern categories
 */
function fullScan(content, options) {
    return [
        ...scanRequirements(content, options),
        ...scanConstraints(content, options),
        ...scanDeliverables(content, options),
        ...scanFileDependencies(content, options),
        ...scanAPIDependencies(content, options),
        ...scanServiceDependencies(content, options),
        ...scanHumanDependencies(content, options),
        ...scanRisks(content, options),
        ...scanCheckpoints(content, options),
        ...scanTimeConstraints(content, options),
        ...scanScopeConstraints(content, options),
    ];
}
//# sourceMappingURL=patterns.js.map