#!/usr/bin/env python3
"""
Research Agent with DeepSeek Brain Bridge

A specialized agent for:
1. Extracting and organizing data from various sources
2. Using DeepSeek web chat for advanced reasoning (thinking layer)
3. Synthesizing information and creating detailed reports
4. Building foundational training datasets

Usage:
    python3 research_agent.py "Analyze this data: [data description]"
"""

import os
import sys
import json
from typing import List, Dict, Any
from pathlib import Path

# Try to import DeepSeek brain bridge
try:
    from deepseek_brain_bridge import DeepSeekBrainBridge
    DEEPSEEK_AVAILABLE = True
except ImportError:
    print("⚠️  DeepSeek brain bridge not found. Install it or check path.")
    DEEPSEEK_AVAILABLE = False

class ResearchAgent:
    """
    Research Agent that uses DeepSeek for advanced reasoning.
    """
    
    def __init__(self, use_deepseek: bool = True):
        """
        Initialize the Research Agent.
        
        Args:
            use_deepseek: Whether to use DeepSeek brain bridge for thinking
        """
        self.use_deepseek = use_deepseek and DEEPSEEK_AVAILABLE
        
        if self.use_deepseek:
            print("🧠 Initializing DeepSeek Brain Bridge...")
            try:
                self.brain_bridge = DeepSeekBrainBridge(session_name="deepseek-agent")
                print("✅ DeepSeek Brain Bridge ready")
            except Exception as e:
                print(f"❌ Failed to initialize DeepSeek: {e}")
                self.use_deepseek = False
        else:
            print("⚠️  DeepSeek thinking layer disabled")
            self.brain_bridge = None
    
    def think_with_deepseek(self, prompt: str, context: str = "") -> str:
        """
        Use DeepSeek for advanced reasoning.
        
        Args:
            prompt: The question or analysis request
            context: Additional context for DeepSeek
            
        Returns:
            DeepSeek's analysis
        """
        if not self.use_deepseek or not self.brain_bridge:
            return "DeepSeek thinking layer not available."
        
        # Combine context and prompt
        full_prompt = f"{context}\n\n{prompt}" if context else prompt
        
        print(f"\n🤔 Consulting DeepSeek: {prompt[:80]}...")
        
        try:
            response = self.brain_bridge.think(full_prompt)
            print(f"✅ DeepSeek response received ({len(response)} chars)")
            return response
        except Exception as e:
            return f"Error consulting DeepSeek: {e}"
    
    def analyze_data(self, data_description: str, data_type: str = "mixed") -> Dict[str, Any]:
        """
        Analyze data using DeepSeek thinking layer.
        
        Args:
            data_description: Description of the data to analyze
            data_type: Type of data (twitter, github, articles, mixed)
            
        Returns:
            Analysis results
        """
        print(f"\n📊 Analyzing {data_type} data...")
        print(f"Data: {data_description[:100]}...")
        
        # Use DeepSeek for analysis
        analysis_prompt = f"""
        Analyze this {data_type} data and provide:
        1. Key patterns and insights
        2. Data quality assessment (good vs bad data)
        3. Recommendations for organization
        4. Potential use cases for training AI agents
        
        Data description: {data_description}
        
        Be thorough and specific.
        """
        
        deepseek_analysis = self.think_with_deepseek(analysis_prompt)
        
        # Extract structured insights
        insights = self._extract_insights(deepseek_analysis)
        
        return {
            "data_type": data_type,
            "analysis": deepseek_analysis,
            "insights": insights,
            "recommendations": self._generate_recommendations(insights)
        }
    
    def synthesize_multiple_sources(self, sources: List[Dict]) -> Dict[str, Any]:
        """
        Synthesize information from multiple data sources.
        
        Args:
            sources: List of source descriptions with 'type' and 'content'
            
        Returns:
            Synthesized report
        """
        print(f"\n🔗 Synthesizing {len(sources)} data sources...")
        
        # Prepare synthesis prompt for DeepSeek
        sources_text = "\n\n".join([
            f"Source {i+1} ({src.get('type', 'unknown')}): {src.get('content', '')[:500]}"
            for i, src in enumerate(sources)
        ])
        
        synthesis_prompt = f"""
        Synthesize information from these {len(sources)} data sources:
        
        {sources_text}
        
        Provide:
        1. Overall synthesis and connections between sources
        2. Key themes and patterns across all sources
        3. Data quality assessment across sources
        4. Recommendations for a unified dataset
        5. Potential gaps or areas needing more data
        """
        
        synthesis = self.think_with_deepseek(synthesis_prompt)
        
        return {
            "source_count": len(sources),
            "synthesis": synthesis,
            "themes": self._extract_themes(synthesis),
            "dataset_recommendations": self._generate_dataset_recommendations(synthesis)
        }
    
    def create_training_dataset(self, analyses: List[Dict], output_format: str = "json") -> str:
        """
        Create a training dataset from analyzed data.
        
        Args:
            analyses: List of analysis results
            output_format: Output format (json, csv, text)
            
        Returns:
            Path to created dataset file
        """
        print(f"\n📁 Creating training dataset ({output_format})...")
        
        # Prepare dataset creation prompt
        analyses_summary = "\n\n".join([
            f"Analysis {i+1} ({a.get('data_type', 'unknown')}): {a.get('analysis', '')[:300]}"
            for i, a in enumerate(analyses)
        ])
        
        dataset_prompt = f"""
        Based on these {len(analyses)} analyses, create a structured training dataset.
        
        Analyses:
        {analyses_summary}
        
        Create a dataset suitable for training AI agents that includes:
        1. Clean, organized data points
        2. Metadata about each data point
        3. Quality labels (good/bad/uncertain)
        4. Categorization/tags
        5. Potential use cases
        
        Format the dataset as {output_format.upper()}.
        """
        
        dataset_structure = self.think_with_deepseek(dataset_prompt)
        
        # Save dataset
        output_file = f"research_dataset_{len(analyses)}_sources.{output_format}"
        
        if output_format == "json":
            dataset_data = {
                "analyses_count": len(analyses),
                "created_at": "2026-03-19",
                "dataset_structure": dataset_structure,
                "analyses": analyses
            }
            with open(output_file, 'w') as f:
                json.dump(dataset_data, f, indent=2)
        else:
            # For text/CSV, save the DeepSeek response
            with open(output_file, 'w') as f:
                f.write(dataset_structure)
        
        print(f"✅ Dataset saved to: {output_file}")
        return output_file
    
    def _extract_insights(self, analysis: str) -> List[str]:
        """Extract key insights from analysis text."""
        insights = []
        lines = analysis.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 20:  # Substantial lines
                # Look for insight indicators
                if any(indicator in line.lower() for indicator in [
                    'insight', 'pattern', 'trend', 'finding', 'key', 'important',
                    'notable', 'significant', 'observation'
                ]):
                    insights.append(line)
        
        return insights[:10]  # Limit to 10 insights
    
    def _extract_themes(self, synthesis: str) -> List[str]:
        """Extract themes from synthesis."""
        themes = []
        lines = synthesis.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and ('theme' in line.lower() or 'topic' in line.lower()):
                themes.append(line)
            elif line and line[0].isdigit() and '. ' in line:  # Numbered items
                themes.append(line)
        
        return themes[:5]  # Top 5 themes
    
    def _generate_recommendations(self, insights: List[str]) -> List[str]:
        """Generate recommendations based on insights."""
        recommendations = []
        
        for insight in insights:
            # Simple recommendation generation
            if 'quality' in insight.lower():
                recommendations.append("Review data quality before inclusion")
            elif 'pattern' in insight.lower():
                recommendations.append("Further investigate identified patterns")
            elif 'gap' in insight.lower():
                recommendations.append("Collect additional data to fill gaps")
        
        # Add default recommendations
        default_recs = [
            "Clean and normalize data before training",
            "Create metadata for each data point",
            "Validate data with domain experts if possible",
            "Consider data privacy and ethical implications"
        ]
        
        return list(set(recommendations + default_recs))[:5]
    
    def _generate_dataset_recommendations(self, synthesis: str) -> List[str]:
        """Generate dataset-specific recommendations."""
        recommendations = [
            "Create a versioned dataset with clear changelog",
            "Include data provenance information",
            "Add data quality scores for each entry",
            "Consider multiple dataset formats (JSON, CSV, Parquet)",
            "Document dataset schema and usage guidelines"
        ]
        
        # Add synthesis-based recommendations
        if 'diverse' in synthesis.lower():
            recommendations.append("Balance dataset across different source types")
        if 'technical' in synthesis.lower():
            recommendations.append("Include code examples and technical documentation")
        
        return recommendations

def main():
    """Main function for Research Agent."""
    print("=" * 70)
    print("🧠 RESEARCH AGENT WITH DEEPSEEK BRAIN BRIDGE")
    print("=" * 70)
    
    # Check if DeepSeek is available
    if not DEEPSEEK_AVAILABLE:
        print("\n⚠️  WARNING: DeepSeek brain bridge not found.")
        print("   Research Agent will run without DeepSeek thinking layer.")
        print("   To enable DeepSeek:")
        print("   1. Run: python3 authenticate_deepseek.py")
        print("   2. Ensure deepseek_brain_bridge.py is in the same directory")
        print()
    
    # Initialize agent
    agent = ResearchAgent(use_deepseek=True)
    
    # Check command line arguments
    if len(sys.argv) > 1:
        # Analyze data from command line
        data_description = ' '.join(sys.argv[1:])
        print(f"\n📝 Analyzing: {data_description[:100]}...")
        
        result = agent.analyze_data(data_description, "mixed")
        
        print(f"\n✅ Analysis complete!")
        print(f"Insights: {len(result['insights'])}")
        print(f"Recommendations: {len(result['recommendations'])}")
        
        # Save analysis
        with open('analysis_result.json', 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Analysis saved to: analysis_result.json")
        
    else:
        # Interactive mode
        print("\n📋 Research Agent Menu:")
        print("1. Analyze data")
        print("2. Synthesize multiple sources")
        print("3. Create training dataset")
        print("4. Test DeepSeek connection")
        print("5. Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == '1':
            data = input("Describe the data to analyze: ")
            data_type = input("Data type (twitter/github/articles/mixed): ") or "mixed"
            
            result = agent.analyze_data(data, data_type)
            print(f"\n📊 Analysis Results:")
            print(json.dumps(result, indent=2)[:500] + "...")
            
        elif choice == '2':
            sources = []
            print("\nEnter data sources (type 'done' when finished):")
            
            while True:
                src_type = input("Source type: ")
                if src_type.lower() == 'done':
                    break
                
                src_content = input("Source content/description: ")
                sources.append({"type": src_type, "content": src_content})
                
                if len(sources) >= 5:
                    print("Maximum 5 sources for demo purposes.")
                    break
            
            if sources:
                result = agent.synthesize_multiple_sources(sources)
                print(f"\n🔗 Synthesis Results:")
                print(f"Themes: {result['themes']}")
                print(f"\nFull synthesis saved to synthesis_result.json")
                
                with open('synthesis_result.json', 'w') as f:
                    json.dump(result, f, indent=2)
        
        elif choice == '3':
            print("\n📁 Dataset creation requires existing analyses.")
            print("Run analysis or synthesis first to create datasets.")
        
        elif choice == '4':
            print("\n🔗 Testing DeepSeek connection...")
            if agent.use_deepseek:
                test_response = agent.think_with_deepseek("Hello DeepSeek! Are you working?")
                print(f"DeepSeek response: {test_response[:200]}...")
            else:
                print("DeepSeek not available.")
        
        elif choice == '5':
            print("\n👋 Exiting Research Agent.")
            return
    
    print("\n" + "=" * 70)
    print("Research Agent complete!")
    print("=" * 70)
    print("\nNext steps for your Slack data project:")
    print("1. Use this agent to analyze extracted Slack data")
    print("2. Create a Slack bot to feed data to this agent")
    print("3. Build training datasets from analyzed data")
    print("4. Train custom agents on your curated datasets")

if __name__ == "__main__":
    main()