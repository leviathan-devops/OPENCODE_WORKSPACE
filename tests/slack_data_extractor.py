#!/usr/bin/env python3
"""
Simple Slack Data Extractor

Extracts data from Slack channels and prepares it for the Research Agent.
This is a simplified version - in production, you'd use Slack API properly.

Usage:
    python3 slack_data_extractor.py --channel general --output slack_data.json
"""

import json
import argparse
import os
from typing import List, Dict, Any
from datetime import datetime

class SlackDataExtractor:
    """
    Extract and organize data from Slack channels.
    """
    
    def __init__(self, slack_token: str = None):
        """
        Initialize the Slack data extractor.
        
        Args:
            slack_token: Slack API token (optional for demo)
        """
        self.slack_token = slack_token or os.environ.get('SLACK_BOT_TOKEN')
        self.data_types = {
            'twitter': ['twitter.com', 'x.com', 't.co'],
            'github': ['github.com', 'git.io'],
            'articles': ['medium.com', 'dev.to', 'towardsdatascience.com', 'arxiv.org'],
            'code': ['.py', '.js', '.ts', '.java', '.cpp', '.go'],
            'images': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
            'documents': ['.pdf', '.doc', '.docx', '.txt', '.md']
        }
    
    def extract_from_channel(self, channel_name: str, limit: int = 100) -> Dict[str, Any]:
        """
        Extract data from a Slack channel.
        
        Args:
            channel_name: Name of the Slack channel
            limit: Maximum number of messages to extract
            
        Returns:
            Extracted and organized data
        """
        print(f"📥 Extracting data from Slack channel: #{channel_name}")
        
        # In a real implementation, you would:
        # 1. Use Slack API to fetch channel messages
        # 2. Parse messages and attachments
        # 3. Categorize by type
        
        # For demo purposes, we'll create sample data
        sample_data = self._create_sample_data(channel_name, limit)
        
        print(f"✅ Extracted {len(sample_data['messages'])} messages")
        print(f"   Links: {len(sample_data['links'])}")
        print(f"   Files: {len(sample_data['files'])}")
        print(f"   Code snippets: {len(sample_data['code_snippets'])}")
        
        return sample_data
    
    def _create_sample_data(self, channel_name: str, limit: int) -> Dict[str, Any]:
        """Create sample Slack data for demonstration."""
        
        # Sample messages with different content types
        messages = [
            {
                "id": "1",
                "user": "alice",
                "text": "Check out this cool AI paper: https://arxiv.org/abs/2401.04088",
                "timestamp": "2026-03-19T10:00:00Z",
                "reactions": ["👏", "🔥"],
                "type": "link"
            },
            {
                "id": "2", 
                "user": "bob",
                "text": "Just pushed new code to GitHub: https://github.com/example/ai-project",
                "timestamp": "2026-03-19T10:05:00Z",
                "reactions": ["🚀"],
                "type": "github"
            },
            {
                "id": "3",
                "user": "charlie",
                "text": "Interesting Twitter thread about LLMs: https://twitter.com/ai_researcher/status/123456789",
                "timestamp": "2026-03-19T10:10:00Z",
                "reactions": ["💭", "📚"],
                "type": "twitter"
            },
            {
                "id": "4",
                "user": "dave",
                "text": "```python\ndef train_model(data):\n    # Training code here\n    return model```",
                "timestamp": "2026-03-19T10:15:00Z",
                "reactions": ["🐍", "💻"],
                "type": "code"
            },
            {
                "id": "5",
                "user": "eve",
                "text": "Great article on agent systems: https://medium.com/@aiwriter/agent-systems-101",
                "timestamp": "2026-03-19T10:20:00Z",
                "reactions": ["📖"],
                "type": "article"
            }
        ]
        
        # Limit to requested number
        messages = messages[:min(limit, len(messages))]
        
        # Extract and categorize data
        links = []
        files = []
        code_snippets = []
        
        for msg in messages:
            # Extract links
            if 'http' in msg['text']:
                # Simple link extraction
                import re
                url_pattern = r'https?://[^\s]+'
                urls = re.findall(url_pattern, msg['text'])
                for url in urls:
                    link_type = self._categorize_link(url)
                    links.append({
                        "url": url,
                        "type": link_type,
                        "source_message": msg['id'],
                        "user": msg['user'],
                        "timestamp": msg['timestamp']
                    })
            
            # Extract code snippets
            if '```' in msg['text']:
                # Simple code extraction
                code_blocks = msg['text'].split('```')
                if len(code_blocks) >= 3:
                    code = code_blocks[1].strip()
                    language = code.split('\n')[0] if '\n' in code else 'unknown'
                    code_snippets.append({
                        "code": code,
                        "language": language,
                        "source_message": msg['id'],
                        "user": msg['user']
                    })
        
        return {
            "channel": channel_name,
            "extraction_time": datetime.now().isoformat(),
            "message_count": len(messages),
            "messages": messages,
            "links": links,
            "files": files,
            "code_snippets": code_snippets,
            "summary": {
                "twitter_links": len([l for l in links if l['type'] == 'twitter']),
                "github_links": len([l for l in links if l['type'] == 'github']),
                "article_links": len([l for l in links if l['type'] == 'articles']),
                "code_blocks": len(code_snippets)
            }
        }
    
    def _categorize_link(self, url: str) -> str:
        """Categorize a URL by type."""
        url_lower = url.lower()
        
        for link_type, domains in self.data_types.items():
            for domain in domains:
                if domain in url_lower:
                    return link_type
        
        return "other"
    
    def prepare_for_research_agent(self, extracted_data: Dict[str, Any]) -> List[Dict]:
        """
        Prepare extracted Slack data for the Research Agent.
        
        Args:
            extracted_data: Data extracted from Slack
            
        Returns:
            List of sources ready for Research Agent
        """
        print("\n🔧 Preparing data for Research Agent...")
        
        sources = []
        
        # Create source from links
        if extracted_data['links']:
            links_by_type = {}
            for link in extracted_data['links']:
                link_type = link['type']
                if link_type not in links_by_type:
                    links_by_type[link_type] = []
                links_by_type[link_type].append(link)
            
            for link_type, links in links_by_type.items():
                sources.append({
                    "type": f"slack_{link_type}_links",
                    "content": f"{len(links)} {link_type} links from Slack channel #{extracted_data['channel']}. Examples: {', '.join([l['url'][:50] + '...' for l in links[:3]])}",
                    "count": len(links),
                    "metadata": {
                        "channel": extracted_data['channel'],
                        "time_range": f"{extracted_data['messages'][0]['timestamp']} to {extracted_data['messages'][-1]['timestamp']}"
                    }
                })
        
        # Create source from code snippets
        if extracted_data['code_snippets']:
            languages = {}
            for snippet in extracted_data['code_snippets']:
                lang = snippet['language']
                if lang not in languages:
                    languages[lang] = []
                languages[lang].append(snippet)
            
            for lang, snippets in languages.items():
                sources.append({
                    "type": f"slack_code_{lang}",
                    "content": f"{len(snippets)} code snippets in {lang} from Slack. Sample: {snippets[0]['code'][:200]}...",
                    "count": len(snippets),
                    "metadata": {
                        "language": lang,
                        "users": list(set([s['user'] for s in snippets]))
                    }
                })
        
        # Create source from messages summary
        sources.append({
            "type": "slack_messages_summary",
            "content": f"{extracted_data['message_count']} messages from Slack channel #{extracted_data['channel']} with various content types including links, code, and discussions.",
            "count": extracted_data['message_count'],
            "metadata": extracted_data['summary']
        })
        
        print(f"✅ Prepared {len(sources)} data sources for Research Agent")
        return sources
    
    def save_extracted_data(self, data: Dict[str, Any], output_file: str):
        """Save extracted data to a file."""
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"💾 Data saved to: {output_file}")

def main():
    """Main function for Slack Data Extractor."""
    parser = argparse.ArgumentParser(description='Extract data from Slack channels')
    parser.add_argument('--channel', default='general', help='Slack channel name')
    parser.add_argument('--limit', type=int, default=50, help='Max messages to extract')
    parser.add_argument('--output', default='slack_extracted_data.json', help='Output file')
    parser.add_argument('--prepare-for-agent', action='store_true', help='Prepare data for Research Agent')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("📥 SLACK DATA EXTRACTOR")
    print("=" * 70)
    
    # Initialize extractor
    extractor = SlackDataExtractor()
    
    # Extract data
    extracted_data = extractor.extract_from_channel(args.channel, args.limit)
    
    # Save extracted data
    extractor.save_extracted_data(extracted_data, args.output)
    
    # Prepare for Research Agent if requested
    if args.prepare_for_agent:
        sources = extractor.prepare_for_research_agent(extracted_data)
        
        # Save prepared sources
        sources_file = 'slack_sources_for_agent.json'
        with open(sources_file, 'w') as f:
            json.dump(sources, f, indent=2)
        
        print(f"\n📋 Prepared sources saved to: {sources_file}")
        print("\nTo use with Research Agent:")
        print(f"  python3 research_agent.py")
        print("  Then choose option 2 and load the sources file")
    
    print("\n" + "=" * 70)
    print("✅ EXTRACTION COMPLETE")
    print("=" * 70)
    print("\nNext steps:")
    print("1. For real Slack data, set SLACK_BOT_TOKEN environment variable")
    print("2. Modify extract_from_channel() to use actual Slack API")
    print("3. Use research_agent.py to analyze the extracted data")
    print("4. Create training datasets from analyzed Slack data")

if __name__ == "__main__":
    main()