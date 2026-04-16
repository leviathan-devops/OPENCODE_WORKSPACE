/**
 * src/coordination/hooks/slop-detector-hook.ts
 * 
 * Quality degradation detection - pattern matching for repetitive code.
 */

import type { HookHandler } from '../../hooks/utils.js';

export interface SlopDetectorConfig {
  classRepetitionThreshold?: number;
  commentRatioMin?: number;
  diffSizeWarning?: number;
}

export function createSlopDetectorHook(config: SlopDetectorConfig = {}): HookHandler<any, any> {
  const {
    classRepetitionThreshold = 3,
    commentRatioMin = 0.1,
    diffSizeWarning = 1000,
  } = config;
  
  return async (input: any, _output: any) => {
    // Detect class repetition in code generation
    if (input?.tool === 'write' || input?.tool === 'edit') {
      const content = input?.content || input?.code || '';
      
      // Count class/interface repetitions
      const classMatches = content.match(/\bclass\s+\w+/g) || [];
      const uniqueClasses = new Set(classMatches);
      
      if (classMatches.length > classRepetitionThreshold * 2) {
        // Many class declarations but few unique - potential copy-paste
        if (uniqueClasses.size < classMatches.length / 2) {
          console.warn(
            `[SlopDetector] WARNING: Code contains ${classMatches.length} class declarations ` +
            `but only ${uniqueClasses.size} unique. Possible copy-paste duplication.`
          );
        }
      }
      
      // Check comment ratio
      const commentMatches = content.match(/\/\/|\/\*|\*|/g) || [];
      const commentRatio = commentMatches.length / Math.max(content.length, 1);
      
      if (commentRatio < commentRatioMin && content.length > 500) {
        console.warn(
          `[SlopDetector] WARNING: Low comment ratio (${(commentRatio * 100).toFixed(1)}%). ` +
          `Consider adding documentation.`
        );
      }
    }
    
    // Detect large diffs
    if (input?.diff && input?.diff.length > diffSizeWarning) {
      console.warn(
        `[SlopDetector] WARNING: Large diff detected (${input.diff.length} chars). ` +
        `Consider splitting into smaller changes.`
      );
    }
  };
}
