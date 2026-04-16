#!/usr/bin/env python3
"""
Rename T2 synthesized files with semantic context tokens.

Reads each T2 file, extracts GOAL and KEY BREAKTHROUGHS,
generates a semantic filename that describes what the data contains.

New naming: {category}__{concept1}__{concept2}__{concept3}.md
"""

import os
import re
import json

T2_BASE = "/home/leviathan/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED"

def extract_semantic_tokens(content):
    """Extract key semantic concepts from T2 content."""
    tokens = []
    
    # Extract GOAL section
    goal_match = re.search(r'## GOAL\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if goal_match:
        goal = goal_match.group(1).strip()
        # Extract key technical terms
        # Look for: file paths, tool names, framework names, action verbs
        file_paths = re.findall(r'[/\w.-]+\.(?:py|ts|js|json|md|sh|sql|yaml|yml|toml)', goal)
        technical_terms = re.findall(r'\b(?:SQLite|OpenCode|OpenViking|Agent Swarm|MiniMax|DeepSeek|GLM|VLLM|session|plugin|adapter|pipeline|ETL|API|REST|database|memory|context|orchestration|synthesis|extraction|ingest|monitor|daemon|workflow|scheduler|authentication|build|test|review|deploy|migration|integration|architecture|firewall|guardian|shark|spider|hive mind|neural|pathway|knowledge|embedding|vector|semantic|chunk|token|model|inference|generation|compilation|bundling|docker|container|deployment|configuration|schema|validation|parser|lexer|tokenizer|compiler|interpreter|runtime|framework|library|module|package|dependency|import|export|function|class|method|interface|protocol|endpoint|route|handler|middleware|hook|event|listener|observer|publisher|subscriber|queue|stream|buffer|cache|store|repository|service|component|widget|view|template|render|layout|style|theme|animation|transition|gesture|touch|keyboard|mouse|input|output|display|screen|window|dialog|modal|popup|notification|alert|toast|banner|badge|icon|image|video|audio|media|file|document|text|string|number|boolean|array|object|map|set|list|tuple|dict|enum|struct|union|type|interface|class|instance|prototype|constructor|destructor|initializer|finalizer|allocator|deallocator|memory|heap|stack|register|cache|buffer|queue|stack|heap|pool|arena|slab|chunk|block|page|frame|segment|section|region|zone|area|space|volume|dimension|coordinate|vector|matrix|tensor|scalar|graph|tree|list|queue|stack|heap|hash|map|set|bag|multiset|multimap|priority_queue|deque|array|vector|string|stream|buffer|socket|pipe|channel|port|endpoint|address|host|server|client|peer|node|cluster|grid|mesh|network|protocol|stack|layer|tier|level|rank|grade|class|category|type|kind|sort|variety|form|shape|pattern|structure|organization|arrangement|configuration|setup|installation|deployment|release|version|revision|update|upgrade|patch|fix|bug|error|fault|defect|issue|problem|challenge|difficulty|obstacle|barrier|hurdle|impediment|constraint|limitation|restriction|boundary|border|edge|margin|fringe|periphery|exterior|surface|skin|shell|cover|wrapper|container|box|package|bundle|archive|zip|tar|gzip|bzip|xz|lzma|lz4|zstd|snappy|brotli|deflate|inflate|compress|decompress|encode|decode|encrypt|decrypt|hash|digest|signature|certificate|key|token|credential|password|passphrase|secret|private|public|shared|common|global|local|static|dynamic|volatile|mutable|immutable|constant|variable|parameter|argument|option|flag|switch|toggle|setting|preference|configuration|option|choice|selection|decision|determination|resolution|solution|answer|response|reply|result|outcome|consequence|effect|impact|influence|power|force|strength|energy|momentum|velocity|speed|rate|pace|tempo|rhythm|beat|pulse|cycle|period|interval|duration|time|moment|instant|second|minute|hour|day|week|month|year|decade|century|millennium|epoch|era|age|period|phase|stage|step|level|degree|grade|rank|tier|class|category|type|kind|sort|variety|form|shape|pattern|structure|organization|arrangement|configuration|setup|installation|deployment|release|version|revision|update|upgrade|patch|fix|bug|error|fault|defect|issue|problem|challenge|difficulty|obstacle|barrier|hurdle|impediment|constraint|limitation|restriction|boundary|border|edge|margin|fringe|periphery|exterior|surface|skin|shell|cover|wrapper|container|box|package|bundle|archive|zip|tar|gzip|bzip|xz|lzma|lz4|zstd|snappy|brotli|deflate|inflate|compress|decompress|encode|decode|encrypt|decrypt|hash|digest|signature|certificate|key|token|credential|password|passphrase|secret|private|public|shared|common|global|local|static|dynamic|volatile|mutable|immutable|constant|variable|parameter|argument|option|flag|switch|toggle|setting|preference|configuration)\b', goal, re.IGNORECASE)
        tokens.extend(file_paths)
        tokens.extend(technical_terms)
    
    # Extract KEY BREAKTHROUGHS
    breakthrough_match = re.search(r'## KEY BREAKTHROUGHS\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if breakthrough_match:
        breakthroughs = breakthrough_match.group(1).strip()
        # Extract concepts in {braces}
        braced = re.findall(r'\{([^}]+)\}', breakthroughs)
        tokens.extend(braced)
        # Also extract technical terms
        technical = re.findall(r'\b(?:self.verification|bypass|reviewer|QA|gate|pipeline|delegation|subagent|coder|reviewer|test.engineer|SME|architect|spider|swarm|session|context|memory|knowledge|embedding|vector|semantic|chunk|token|model|inference|generation|compilation|bundling|docker|container|deployment|configuration|schema|validation|parser|lexer|tokenizer|compiler|interpreter|runtime|framework|library|module|package|dependency|import|export|function|class|method|interface|protocol|endpoint|route|handler|middleware|hook|event|listener|observer|publisher|subscriber|queue|stream|buffer|cache|store|repository|service|component|widget|view|template|render|layout|style|theme|animation|transition|gesture|touch|keyboard|mouse|input|output|display|screen|window|dialog|modal|popup|notification|alert|toast|banner|badge|icon|image|video|audio|media|file|document|text|string|number|boolean|array|object|map|set|list|tuple|dict|enum|struct|union|type|interface|class|instance|prototype|constructor|destructor|initializer|finalizer|allocator|deallocator|memory|heap|stack|register|cache|buffer|queue|stack|heap|pool|arena|slab|chunk|block|page|frame|segment|section|region|zone|area|space|volume|dimension|coordinate|vector|matrix|tensor|scalar|graph|tree|list|queue|stack|heap|hash|map|set|bag|multiset|multimap|priority_queue|deque|array|vector|string|stream|buffer|socket|pipe|channel|port|endpoint|address|host|server|client|peer|node|cluster|grid|mesh|network|protocol|stack|layer|tier|level|rank|grade|class|category|type|kind|sort|variety|form|shape|pattern|structure|organization|arrangement|configuration|setup|installation|deployment|release|version|revision|update|upgrade|patch|fix|bug|error|fault|defect|issue|problem|challenge|difficulty|obstacle|barrier|hurdle|impediment|constraint|limitation|restriction|boundary|border|edge|margin|fringe|periphery|exterior|surface|skin|shell|cover|wrapper|container|box|package|bundle|archive|zip|tar|gzip|bzip|xz|lzma|lz4|zstd|snappy|brotli|deflate|inflate|compress|decompress|encode|decode|encrypt|decrypt|hash|digest|signature|certificate|key|token|credential|password|passphrase|secret|private|public|shared|common|global|local|static|dynamic|volatile|mutable|immutable|constant|variable|parameter|argument|option|flag|switch|toggle|setting|preference|configuration)\b', breakthroughs, re.IGNORECASE)
        tokens.extend(technical)
    
    # Extract LESSONS
    lessons_match = re.search(r'## LESSONS\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if lessons_match:
        lessons = lessons_match.group(1).strip()
        technical = re.findall(r'\b(?:self.verification|bypass|reviewer|QA|gate|pipeline|delegation|subagent|coder|reviewer|test.engineer|SME|architect|spider|swarm|session|context|memory|knowledge|embedding|vector|semantic|chunk|token|model|inference|generation|compilation|bundling|docker|container|deployment|configuration|schema|validation|parser|lexer|tokenizer|compiler|interpreter|runtime|framework|library|module|package|dependency|import|export|function|class|method|interface|protocol|endpoint|route|handler|middleware|hook|event|listener|observer|publisher|subscriber|queue|stream|buffer|cache|store|repository|service|component|widget|view|template|render|layout|style|theme|animation|transition|gesture|touch|keyboard|mouse|input|output|display|screen|window|dialog|modal|popup|notification|alert|toast|banner|badge|icon|image|video|audio|media|file|document|text|string|number|boolean|array|object|map|set|list|tuple|dict|enum|struct|union|type|interface|class|instance|prototype|constructor|destructor|initializer|finalizer|allocator|deallocator|memory|heap|stack|register|cache|buffer|queue|stack|heap|pool|arena|slab|chunk|block|page|frame|segment|section|region|zone|area|space|volume|dimension|coordinate|vector|matrix|tensor|scalar|graph|tree|list|queue|stack|heap|hash|map|set|bag|multiset|multimap|priority_queue|deque|array|vector|string|stream|buffer|socket|pipe|channel|port|endpoint|address|host|server|client|peer|node|cluster|grid|mesh|network|protocol|stack|layer|tier|level|rank|grade|class|category|type|kind|sort|variety|form|shape|pattern|structure|organization|arrangement|configuration|setup|installation|deployment|release|version|revision|update|upgrade|patch|fix|bug|error|fault|defect|issue|problem|challenge|difficulty|obstacle|barrier|hurdle|impediment|constraint|limitation|restriction|boundary|border|edge|margin|fringe|periphery|exterior|surface|skin|shell|cover|wrapper|container|box|package|bundle|archive|zip|tar|gzip|bzip|xz|lzma|lz4|zstd|snappy|brotli|deflate|inflate|compress|decompress|encode|decode|encrypt|decrypt|hash|digest|signature|certificate|key|token|credential|password|passphrase|secret|private|public|shared|common|global|local|static|dynamic|volatile|mutable|immutable|constant|variable|parameter|argument|option|flag|switch|toggle|setting|preference|configuration)\b', lessons, re.IGNORECASE)
        tokens.extend(technical)
    
    return tokens


def generate_semantic_name(category, tokens, original_title):
    """Generate a semantic filename from extracted tokens."""
    # Clean and deduplicate tokens
    cleaned = []
    seen = set()
    for t in tokens:
        # Clean: lowercase, replace spaces with underscores, remove special chars
        clean = re.sub(r'[^a-z0-9_]', '_', t.lower().strip())
        clean = re.sub(r'_+', '_', clean).strip('_')
        if clean and len(clean) > 2 and clean not in seen:
            seen.add(clean)
            cleaned.append(clean)
    
    # If no tokens extracted, use original title cleaned
    if not cleaned:
        clean_title = re.sub(r'[^a-z0-9_]', '_', original_title.lower().strip())
        clean_title = re.sub(r'_+', '_', clean_title).strip('_')
        if clean_title:
            cleaned = [clean_title]
        else:
            cleaned = ['unknown_session']
    
    # Limit to 3-4 key concepts
    concepts = cleaned[:4]
    
    # Build filename: category__concept1__concept2__concept3.md
    name = '__'.join(concepts)
    return f"{name}.md"


def process_file(filepath, category):
    """Process a single T2 file and return new name."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Extract original title from the file
    title_match = re.search(r'# SESSION:\s*(.+)', content)
    original_title = title_match.group(1).strip() if title_match else "unknown"
    
    # Extract semantic tokens
    tokens = extract_semantic_tokens(content)
    
    # Generate semantic name
    new_name = generate_semantic_name(category, tokens, original_title)
    
    return new_name, original_title, tokens


def main():
    stats = {'renamed': 0, 'skipped': 0, 'errors': 0}
    
    for category in sorted(os.listdir(T2_BASE)):
        cat_dir = os.path.join(T2_BASE, category)
        if not os.path.isdir(cat_dir):
            continue
        
        print(f"\n=== {category.upper()} ===")
        
        for filename in sorted(os.listdir(cat_dir)):
            if not filename.endswith('.md'):
                continue
            
            old_path = os.path.join(cat_dir, filename)
            
            try:
                new_name, original_title, tokens = process_file(old_path, category)
                
                # Handle name collisions
                new_path = os.path.join(cat_dir, new_name)
                if os.path.exists(new_path) and new_path != old_path:
                    # Add numeric suffix
                    base, ext = os.path.splitext(new_name)
                    counter = 1
                    while os.path.exists(os.path.join(cat_dir, f"{base}_{counter}{ext}")):
                        counter += 1
                    new_name = f"{base}_{counter}{ext}"
                    new_path = os.path.join(cat_dir, new_name)
                
                if new_path != old_path:
                    os.rename(old_path, new_path)
                    print(f"  {filename[:60]:60s} → {new_name[:60]}")
                    stats['renamed'] += 1
                else:
                    print(f"  {filename[:60]:60s} (unchanged)")
                    stats['skipped'] += 1
                    
            except Exception as e:
                print(f"  ERROR: {filename[:60]} → {e}")
                stats['errors'] += 1
    
    print(f"\n=== SUMMARY ===")
    print(f"  Renamed: {stats['renamed']}")
    print(f"  Skipped: {stats['skipped']}")
    print(f"  Errors:  {stats['errors']}")


if __name__ == '__main__':
    main()
