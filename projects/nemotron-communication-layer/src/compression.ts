import { Message, CompactedMessage, Priority } from './types';
import { MessageClassifier } from './message-classifier';

export class CompressionPipeline {
  private classifier = new MessageClassifier();
  
  compress(message: Message): CompactedMessage {
    const targetTokens = this.classifier.determineTokenTarget(message);
    const originalTokens = this.classifier.estimateTokens(message.content);
    
    // If already under target, return as-is (don't force max budget)
    if (originalTokens <= targetTokens) {
      return {
        originalId: message.id,
        targetTokens,
        actualTokens: originalTokens,
        content: message.content,
        metadata: {
          compressionRatio: 1.0,
          originalTokens,
          priority: message.priority,
          classification: this.classifier.classifyMessage(message),
          usedFullBudget: false,
        },
      };
    }
    
    // Apply compression pipeline
    let compressed = message.content;
    
    compressed = this.extractCriticalInfo(compressed, message.priority);
    compressed = this.removeRedundancy(compressed);
    compressed = this.aggregateDetails(compressed);
    compressed = this.trimToTarget(compressed, targetTokens);
    
    const finalTokens = this.classifier.estimateTokens(compressed);
    
    return {
      originalId: message.id,
      targetTokens,
      actualTokens: finalTokens,
      content: compressed,
      metadata: {
        compressionRatio: originalTokens / finalTokens,
        originalTokens,
        priority: message.priority,
        classification: this.classifier.classifyMessage(message),
        usedFullBudget: finalTokens >= targetTokens * 0.9,
      },
    };
  }
  
  private extractCriticalInfo(content: string, priority: Priority): string {
    const sections = content.split(/##\s*/);
    
    const criticalSections = ['blockers', 'critical', 'errors', 'decisions'];
    const highSections = [...criticalSections, 'progress', 'dependencies', 'next steps'];
    const mediumSections = [...highSections, 'details', 'context', 'background'];
    
    let keepSections: string[];
    if (priority === Priority.CRITICAL) {
      keepSections = criticalSections;
    } else if (priority === Priority.HIGH) {
      keepSections = highSections;
    } else {
      keepSections = mediumSections;
    }
    
    const filtered = sections
      .filter(section => 
        keepSections.some(keyword => 
          section.toLowerCase().startsWith(keyword)
        )
      )
      .map(section => `## ${section}`)
      .join('\n\n');
    
    return filtered || content;
  }
  
  private removeRedundancy(content: string): string {
    const lines = content.split('\n');
    const seen = new Set<string>();
    
    return lines
      .filter(line => {
        const normalized = line.trim().toLowerCase();
        if (normalized.length < 10) return true; // Keep short lines
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .join('\n');
  }
  
  private aggregateDetails(content: string): string {
    // Replace detailed file lists with counts
    content = content.replace(
      /files?:\s*([^\n]+)/gi,
      (match, files) => {
        const fileList = files.split(',').map((f: string) => f.trim());
        if (fileList.length <= 3) return match;
        return `${fileList.length} files: ${fileList.slice(0, 3).join(', ')}...`;
      }
    );
    
    // Replace detailed error logs with summary
    content = content.replace(
      /(\d+)\s*errors?/gi,
      (match, count) => `${count} errors detected`
    );
    
    // Compress repeated status markers
    content = content.replace(/-{3,}/g, '---');
    content = content.replace(/={3,}/g, '===');
    
    return content;
  }
  
  private trimToTarget(content: string, targetTokens: number): string {
    const currentTokens = this.classifier.estimateTokens(content);
    
    if (currentTokens <= targetTokens) {
      return content;
    }
    
    const lines = content.split('\n');
    const targetChars = targetTokens * 4;
    
    // Keep important lines (headers, critical info)
    const importantLines = lines.filter(line => 
      line.startsWith('#') || 
      /\[critical\]|\[high\]|blocker|error/i.test(line)
    );
    
    // Fill remaining space with other content
    let result = importantLines.join('\n');
    const remainingChars = targetChars - result.length;
    
    if (remainingChars > 0) {
      const otherLines = lines.filter(line => !importantLines.includes(line));
      for (const line of otherLines) {
        if (result.length + line.length > targetChars) break;
        result += '\n' + line;
      }
    }
    
    return result;
  }
}
