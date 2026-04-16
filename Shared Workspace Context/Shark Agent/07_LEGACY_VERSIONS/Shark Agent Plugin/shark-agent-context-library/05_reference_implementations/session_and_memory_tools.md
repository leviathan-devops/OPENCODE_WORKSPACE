# Session & Memory Tools (from v2.1)

## SessionDB Tools

From `v2.1-build/src/tools/sessions.ts`.

```typescript
// Session checkpointing + snapshot tools
// State: stored in ~/.hermes/sessions/ as JSON files

interface SessionCheckpoint {
  id: string;
  parentId?: string;
  messages: any[];
  state: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  label?: string;
}

export const checkpoint = tool({
  description: 'Create a named checkpoint of the current session',
  args: {
    label: tool.schema.string().describe('Checkpoint label'),
  },
  execute: async (args, context) => {
    const sessionsDir = join(process.env.HOME!, '.hermes', 'sessions');
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
    const id = `cp_${Date.now()}`;
    const checkpoint: SessionCheckpoint = {
      id,
      parentId: context.session?.id,
      messages: [],
      state: { label: args.label },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      label: args.label,
    };
    writeFileSync(join(sessionsDir, `${id}.json`), JSON.stringify(checkpoint));
    return `Checkpoint created: ${id} (${args.label})`;
  },
});

export const list_sessions = tool({
  description: 'List all saved sessions and checkpoints',
  args: {},
  execute: async () => {
    const sessionsDir = join(process.env.HOME!, '.hermes', 'sessions');
    if (!existsSync(sessionsDir)) return 'No sessions found.';
    const files = readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
    const sessions = files.map(f => {
      const content = readFileSync(join(sessionsDir, f), 'utf-8');
      const data = JSON.parse(content);
      return `[${data.id}] ${data.label ?? 'unnamed'} — ${new Date(data.createdAt).toISOString()}`;
    });
    return sessions.length > 0 ? sessions.join('\n') : 'No sessions found.';
  },
});

export const load_session = tool({
  description: 'Load a saved session',
  args: {
    id: tool.schema.string().describe('Session ID to load'),
  },
  execute: async (args) => {
    const sessionsDir = join(process.env.HOME!, '.hermes', 'sessions');
    const file = join(sessionsDir, `${args.id}.json`);
    if (!existsSync(file)) return `Session ${args.id} not found.`;
    const content = readFileSync(file, 'utf-8');
    const data = JSON.parse(content);
    return `Loaded session ${args.id}:\n${JSON.stringify(data, null, 2)}`;
  },
});

export const fork_session = tool({
  description: 'Fork from a session snapshot into a new branch',
  args: {
    id: tool.schema.string().describe('Session ID to fork from'),
    label: tool.schema.string().describe('Label for new fork'),
  },
  execute: async (args) => {
    const sessionsDir = join(process.env.HOME!, '.hermes', 'sessions');
    const file = join(sessionsDir, `${args.id}.json`);
    if (!existsSync(file)) return `Session ${args.id} not found.`;
    const content = readFileSync(file, 'utf-8');
    const original = JSON.parse(content);
    const newId = `fork_${Date.now()}`;
    const forked: SessionCheckpoint = {
      ...original,
      id: newId,
      parentId: args.id,
      label: args.label,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    writeFileSync(join(sessionsDir, `${newId}.json`), JSON.stringify(forked));
    return `Forked ${args.id} → ${newId} (${args.label})`;
  },
});

export const create_snapshot = tool({
  description: 'Create a full snapshot of the current state',
  args: {
    label: tool.schema.string().describe('Snapshot label'),
  },
  execute: async (args, context) => {
    const sessionsDir = join(process.env.HOME!, '.hermes', 'sessions');
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
    const id = `snap_${Date.now()}`;
    const snapshot = {
      id,
      label: args.label,
      session: context.session,
      directory: context.directory,
      createdAt: Date.now(),
    };
    writeFileSync(join(sessionsDir, `${id}.json`), JSON.stringify(snapshot));
    return `Snapshot created: ${id} (${args.label})`;
  },
});
```

## Memory Tools

From `v2.1-build/src/tools/memory.ts`.

```typescript
// Simple flat-file memory store at ~/.hermes/memory/
// Key-value store with JSON serialization

const MEMORY_DIR = join(process.env.HOME!, '.hermes', 'memory');

function ensureMemoryDir() {
  if (!existsSync(MEMORY_DIR)) {
    mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

export const sharkRecall = tool({
  description: 'Query the persistent memory store',
  args: {
    query: tool.schema.string().describe('Search query'),
    limit: tool.schema.number().optional().default(5).describe('Max results'),
  },
  execute: async (args) => {
    ensureMemoryDir();
    const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.json'));
    const results: string[] = [];
    for (const file of files) {
      const content = readFileSync(join(MEMORY_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      const text = JSON.stringify(data).toLowerCase();
      if (text.includes(args.query.toLowerCase())) {
        results.push(`[${file.replace('.json', '')}] ${JSON.stringify(data).substring(0, 200)}`);
      }
      if (results.length >= args.limit) break;
    }
    return results.length > 0 ? results.join('\n') : `No memory entries found for: ${args.query}`;
  },
});

export const sharkRemember = tool({
  description: 'Store a key-value pair in persistent memory',
  args: {
    key: tool.schema.string().describe('Memory key'),
    value: tool.schema.string().describe('Value to store'),
    tags: tool.schema.array(tool.schema.string()).optional().describe('Tags for categorization'),
  },
  execute: async (args) => {
    ensureMemoryDir();
    const id = args.key.replace(/[^a-z0-9_-]/gi, '_');
    const entry = {
      key: args.key,
      value: args.value,
      tags: args.tags ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    writeFileSync(join(MEMORY_DIR, `${id}.json`), JSON.stringify(entry));
    return `Remembered: ${args.key}`;
  },
});

export const sharkContext = tool({
  description: 'Inject relevant memory context into current session',
  args: {
    topic: tool.schema.string().optional().describe('Topic to inject'),
  },
  execute: async (args) => {
    ensureMemoryDir();
    const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.json'));
    const relevant: string[] = [];
    for (const file of files) {
      const content = readFileSync(join(MEMORY_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      if (!args.topic || JSON.stringify(data).toLowerCase().includes(args.topic.toLowerCase())) {
        relevant.push(`**${data.key}**: ${data.value}`);
      }
    }
    if (relevant.length === 0) return 'No relevant context found.';
    return `Memory context:\n${relevant.join('\n')}`;
  },
});
```

## Phase Completion Tools

```typescript
// From v2.1 src/tools/workflow.ts

export const phase_complete = tool({
  description: 'Mark current phase as complete and record evidence',
  args: {
    phase: tool.schema.string().describe('Phase name'),
    evidence: tool.schema.string().optional().describe('Evidence description'),
  },
  execute: async (args, context) => {
    const evidenceFile = join(context.directory, '.shark', 'phase-completions', `${args.phase}.json`);
    const dir = dirname(evidenceFile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const record = {
      phase: args.phase,
      evidence: args.evidence ?? 'No evidence provided',
      completedAt: Date.now(),
    };
    writeFileSync(evidenceFile, JSON.stringify(record));
    return `Phase ${args.phase} marked complete`;
  },
});

export const save_plan = tool({
  description: 'Save the current plan to disk',
  args: {
    plan: tool.schema.string().describe('Plan content'),
    version: tool.schema.string().optional().describe('Plan version'),
  },
  execute: async (args, context) => {
    const planFile = join(context.directory, '.shark', 'plan.md');
    const dir = dirname(planFile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const header = args.version ? `# Plan v${args.version}\n\n` : '# Plan\n\n';
    writeFileSync(planFile, header + args.plan);
    return `Plan saved to ${planFile}`;
  },
});
```
