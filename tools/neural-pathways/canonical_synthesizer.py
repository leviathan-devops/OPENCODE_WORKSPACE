#!/usr/bin/env python3
"""
Canonical T2 Synthesizer — Round 2

Reads actual session data from opencode.db, identifies the canonical sessions
that represent the real build journey, and generates deep, accurate T2 macro context.

Output: /home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_CANONICAL/
"""

import sqlite3
import json
import os
import re
from datetime import datetime
from collections import Counter

DB_PATH = "/home/leviathan/.local/share/opencode/opencode.db"
OUTPUT_DIR = "/home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_CANONICAL"

CATEGORIES = {
    'architecture': ['shark', 'spider', 'guardian', 'firewall', 'agent plugin', 'agent cli', 'cli ultra', 'plugin v2', 'plugin realignment', 'build shark'],
    'build': ['kraken brain', 'kraken ultra', 'kraken hive', 'workspace migration', 'mattermost', 'space invader', 'vtt workshop', 'opendev swarm', 'agent swarm setup', 'deerflow', 'inra overhaul', 'vllm setup', 'swarm plugin setup', 'turboquant', 'migration build'],
    'integration': ['glm', 'model integration', 'opencode-ultra tool', 'openviking', 'model details', 'page labeling', 'tool interfaces'],
    'investigation': ['explore opencode auth', 'explore opencode state', 'explore opencode tui', 'read anchor', 'analyze opencode-ultra plugin', 'analyze system', 'auto-switch', 'minimax api', 'keyboard', 'robotgo', 'vosk'],
    'orchestration': ['reviewer agent bug', 'review opencode adapter', 'test opencode adapter', 'write hive mind os', 'agent swarm setup', 'opencode workspace migration', 'review index', 'critic review', 'qa session', 'review timeout', 'review opencode'],
    'planning': ['hive mind plugin', 'session_extractor', 'synthesizer', 'flowspec planning', 'hermes local', 'hive installation', 'yolo mode', 'sieve of eratosthenes', 'coordinator overhaul', 'blog database', 'rest api', 'deepseek token'],
    'gold_standard': ['omnicoder', 'space invader', 'omnicoder debug', 'sme omnicoder'],
    'failure': ['crash', 'fail', 'error', 'bug', 'issue', 'problem', 'reviewer bug'],
    'review': ['review', 'qa', 'critic', 'shell script review', 'python file review'],
}

NOISE_PATTERNS = [
    'new session', 'greeting', 'hello', 'test message', 'quick check',
    'quick test', 'saying hello', 'check-in', 'check in', 'basic math',
    'simple math', 'python function', 'python hello', 'python calculator',
    'title generation', 'context window', 'model details', 'glm model',
    'glm-5', 'list files', 'list current', 'echo test', 'echo integration',
    'blog database', 'rest api design', 'pokemon',
    'sieve of eratosthenes', 'python.*two numbers', 'python.*prime',
    'large python file', 'python.*hello world', 'system test',
    'yolo mode', 'model details and page', 'user asked', 'user wants',
    'user requested', 'user is asking', 'user appears', 'user wanted',
    'answer', 'constraint', 'number', 'n/a', 'minimal session',
    'test session', 'test environment', 'test input', 'test integration',
    'test pipeline', 'test system', 'test minimal', 'test none',
    'validation response', 'validation test', 'validation check',
    'session context', 'session layer', 'session organization',
    'session pattern', 'session test', 'session category',
    'file context', 'file session', 'file list',
    'input error', 'input test', 'input session',
    'problem input', 'problem session',
    'rest api endpoint', 'rest api pattern',
    'memory shark', 'memory model',
    'memory context', 'plugin shared',
    'pattern context', 'pattern session',
    'structure knowledge', 'structure session',
    'model context', 'model n/a',
    'model glm', 'model deepseek',
    'glm identity', 'glm model no',
    'na no breakthroughs', 'na session',
    'na session context',
    'opencode session',
    'openviking shark',
    'openviking plugin',
    'new_session',
]

def classify_session(title):
    t = title.lower()
    for cat, keywords in CATEGORIES.items():
        for kw in keywords:
            if kw in t:
                return cat
    return 'planning'

def is_noise(title):
    t = title.lower()
    for pattern in NOISE_PATTERNS:
        if pattern in t:
            return True
    return False

def extract_tools_from_parts(parts_data):
    tools = Counter()
    for part in parts_data:
        try:
            data = json.loads(part['data']) if part['data'] else {}
            if data.get('type') == 'tool':
                tool_name = data.get('tool', 'unknown')
                tools[tool_name] += 1
        except:
            pass
    return tools

def extract_user_intents(messages_data):
    """Extract what the user actually asked for."""
    intents = []
    for msg in messages_data:
        try:
            data = json.loads(msg['data']) if msg['data'] else {}
            if data.get('role') == 'user':
                content = data.get('content', '')
                if isinstance(content, list):
                    text_parts = [c.get('text', '') for c in content if isinstance(c, dict) and c.get('type') == 'text']
                    content = ' '.join(text_parts)
                if content and len(content) > 30:
                    intents.append(content[:300])
        except:
            pass
    return intents[:5]

def extract_key_actions(parts_data):
    """Extract key actions (file writes, bash commands, edits)."""
    actions = []
    for part in parts_data:
        try:
            data = json.loads(part['data']) if part['data'] else {}
            if data.get('type') == 'tool':
                tool = data.get('tool', '')
                state = data.get('state', {})
                inp = state.get('input', {})
                if tool == 'bash' and inp.get('command'):
                    cmd = inp['command']
                    if any(k in cmd for k in ['mkdir', 'cp ', 'mv ', 'rm ', 'npm ', 'bun ', 'python3', 'git ', 'docker', 'systemctl']):
                        actions.append(f"bash: {cmd[:120]}")
                elif tool == 'write' and inp.get('filePath'):
                    actions.append(f"write: {inp['filePath']}")
                elif tool == 'edit' and inp.get('filePath'):
                    actions.append(f"edit: {inp['filePath']}")
        except:
            pass
    return actions[:15]

def extract_breakthroughs(messages_data, parts_data):
    """Identify breakthrough moments from tool usage patterns."""
    breakthroughs = []
    tools = extract_tools_from_parts(parts_data)
    
    # Look for significant tool usage patterns
    if tools.get('bash', 0) > 50:
        breakthroughs.append(f"Heavy bash usage ({tools['bash']} calls) — extensive system interaction and testing")
    if tools.get('write', 0) > 10:
        breakthroughs.append(f"Significant code generation ({tools['write']} files written)")
    if tools.get('edit', 0) > 10:
        breakthroughs.append(f"Extensive code modification ({tools['edit']} edits)")
    if tools.get('task', 0) > 5:
        breakthroughs.append(f"Multi-agent delegation ({tools['task']} subagent tasks spawned)")
    
    return breakthroughs

def generate_t2_content(session, messages, parts):
    sid = session['id']
    title = session['title']
    duration_min = round((session['time_updated'] - session['time_created']) / 60000.0, 1)
    category = classify_session(title)
    
    tools = extract_tools_from_parts(parts)
    top_tools = tools.most_common(10)
    user_intents = extract_user_intents(messages)
    key_actions = extract_key_actions(parts)
    breakthroughs = extract_breakthroughs(messages, parts)
    
    content = f"""# CANONICAL T2: {title}

**Session ID:** {sid}
**Category:** {category}
**Timeline:** {datetime.fromtimestamp(session['time_created']/1000).isoformat()} → {datetime.fromtimestamp(session['time_updated']/1000).isoformat()}
**Duration:** {duration_min:.1f} minutes ({duration_min/60:.1f} hours)
**Messages:** {len(messages)}
**Parts:** {len(parts)}
**Directory:** {session.get('directory', 'unknown')}
**Parent:** {session.get('parent_id', 'root')}

---

## SESSION OVERVIEW

{title} — a {duration_min:.0f}-minute session with {len(messages)} messages and {len(parts)} parts.

"""
    if user_intents:
        content += "### User Intent\n\n"
        for i, intent in enumerate(user_intents[:3], 1):
            content += f"{i}. {intent}\n\n"
    
    content += """---

## TOOL USAGE

| Tool | Calls |
|------|-------|
"""
    for tool, count in top_tools:
        content += f"| {tool} | {count} |\n"
    
    content += f"""
---

## KEY ACTIONS

"""
    for i, action in enumerate(key_actions[:15], 1):
        content += f"{i}. {action}\n"
    
    if breakthroughs:
        content += f"""
---

## BREAKTHROUGHS

"""
        for i, b in enumerate(breakthroughs, 1):
            content += f"{i}. {b}\n"
    
    content += f"""
---

## SEMANTIC TOKENS

"""
    tokens = set()
    words = re.findall(r'\b[a-z]{4,}\b', title.lower())
    stop = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'been', 'were', 'subagent', 'agent'}
    words = [w for w in words if w not in stop and len(w) > 3]
    tokens.update(words[:5])
    for tool, _ in top_tools[:5]:
        tokens.add(tool)
    tokens.add(category)
    
    content += ', '.join(sorted(tokens)) + '\n'
    
    return content, category

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Remove old canonical files
    for cat_dir in os.listdir(OUTPUT_DIR):
        full = os.path.join(OUTPUT_DIR, cat_dir)
        if os.path.isdir(full):
            for f in os.listdir(full):
                os.remove(os.path.join(full, f))
    
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT s.*, 
               (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) as msg_count,
               (SELECT COUNT(*) FROM part p WHERE p.session_id = s.id) as part_count,
               ROUND((s.time_updated - s.time_created) / 60000.0, 1) as duration_min
        FROM session s
        ORDER BY (s.time_updated - s.time_created) DESC
    ''')
    
    sessions = cursor.fetchall()
    print(f"Total sessions: {len(sessions)}")
    
    canonical_count = 0
    noise_count = 0
    
    for session in sessions:
        sid = session['id']
        title = session['title']
        duration = session['duration_min']
        msg_count = session['msg_count']
        part_count = session['part_count']
        
        if is_noise(title):
            noise_count += 1
            continue
        
        # Canonical: >5 min OR >50 messages OR >100 parts
        if duration <= 5 and msg_count <= 50 and part_count <= 100:
            noise_count += 1
            continue
        
        canonical_count += 1
        
        cursor.execute('SELECT * FROM message WHERE session_id = ? ORDER BY time_created ASC', (sid,))
        messages = cursor.fetchall()
        
        cursor.execute('SELECT * FROM part WHERE session_id = ? ORDER BY id ASC', (sid,))
        parts = cursor.fetchall()
        
        content, category = generate_t2_content(dict(session), messages, parts)
        
        cat_dir = os.path.join(OUTPUT_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)
        
        words = re.findall(r'\b[a-z]{4,}\b', title.lower())
        stop = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'been', 'were', 'subagent', 'agent'}
        words = [w for w in words if w not in stop and len(w) > 3]
        semantic_words = words[:3] if words else ['session']
        filename = '__'.join(semantic_words) + '.md'
        
        filepath = os.path.join(cat_dir, filename)
        if os.path.exists(filepath):
            base, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(os.path.join(cat_dir, f"{base}_{counter}{ext}")):
                counter += 1
            filepath = os.path.join(cat_dir, f"{base}_{counter}{ext}")
        
        with open(filepath, 'w') as f:
            f.write(content)
        
        print(f"  [{category:15s}] {title[:50]:50s} → {os.path.basename(filepath)}")
    
    print(f"\n=== SUMMARY ===")
    print(f"  Canonical sessions: {canonical_count}")
    print(f"  Noise sessions: {noise_count}")
    print(f"  Total: {canonical_count + noise_count}")
    
    db.close()

if __name__ == '__main__':
    main()
