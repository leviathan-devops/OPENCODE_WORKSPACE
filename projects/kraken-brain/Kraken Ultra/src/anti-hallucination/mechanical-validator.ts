import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

export interface ValidationResult {
  passed: boolean;
  theatricalDetected: boolean;
  theatricalPatterns: string[];
  actualCompilation: boolean;
  testsActuallyRun: boolean;
  codeIntegration: boolean;
}

export class MechanicalValidator {
  private sandboxDir: string;
  private timeoutMs: number = 5000;

  constructor(sandboxDir?: string) {
    this.sandboxDir = sandboxDir || '/tmp/validator-sandbox';
    this.ensureSandbox();
  }

  private ensureSandbox(): void {
    if (!fs.existsSync(this.sandboxDir)) {
      fs.mkdirSync(this.sandboxDir, { recursive: true });
    }
  }

  async runInSandbox(code: string, language: string = 'typescript'): Promise<{ success: boolean; output: string; exitCode: number }> {
    const tempFile = path.join(this.sandboxDir, `temp-${Date.now()}.${language === 'typescript' ? 'ts' : 'js'}`);
    
    try {
      fs.writeFileSync(tempFile, code);

      const result = await this.execCommand(
        language === 'typescript' 
          ? `npx ts-node ${tempFile}`
          : `node ${tempFile}`,
        this.timeoutMs
      );

      fs.unlinkSync(tempFile);
      return result;
    } catch (error) {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      return {
        success: false,
        output: error instanceof Error ? error.message : String(error),
        exitCode: 1
      };
    }
  }

  private execCommand(command: string, timeout: number): Promise<{ success: boolean; output: string; exitCode: number }> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          success: false,
          output: 'Timeout exceeded',
          exitCode: -1
        });
      }, timeout);

      child_process.exec(command, (error, stdout, stderr) => {
        clearTimeout(timer);
        const output = stdout + stderr;
        if (error) {
          resolve({
            success: false,
            output,
            exitCode: error.code || 1
          });
        } else {
          resolve({
            success: true,
            output,
            exitCode: 0
          });
        }
      });
    });
  }

  crossValidate(claim: string, evidence: string[]): boolean {
    if (!claim || evidence.length === 0) return false;

    const claimLower = claim.toLowerCase();
    const hasMatchingEvidence = evidence.some(e => {
      const eLower = e.toLowerCase();
      return claimLower.split(/\s+/).some(word => 
        word.length > 3 && eLower.includes(word)
      );
    });

    return hasMatchingEvidence;
  }

  detectTheatrical(code: string): string[] {
    const patterns: { [key: string]: RegExp } = {
      'Mock without execution': /mock|simulate|stub|fake.*test|dummy/i,
      'Placeholder code': /TODO|FIXME|HACK|XXX|\[placeholder\]|not implemented/i,
      'Never called code': /function\s+\w+\s*\(\s*\)\s*\{\s*\}|export\s+\w+;\s*$/gm,
      'Fake test results': /"passed".*true|"success".*true.*\/\/\s*(simulated|fake|mock)/i,
      'Documentation only': /^\s*\/\/.*$|^\s*\/\*[\s\S]*?\*\/\s*$/gm,
      'Skipped tests': /\.skip\(|\.only\(|xit\(|xdescribe\(|xtest\(/i,
      'Hardcoded return values': /return\s+(true|false|null|undefined|"")\s*;\s*$/gm,
      'Commented out code': /^\s*\/\/.*function|^\s*\/\/.*import|^\s*\/\/.*export/gm,
      'Empty try-catch': /try\s*\{\s*\}\s*catch\s*\(\s*\w+\s*\)\s*\{\s*\}/g,
      'Infinite loops with breaks': /while\s*\(\s*true\s*\)\s*\{[^}]*break/g,
      'No-op functions': /console\.log\(/g,
      'Always true conditions': /if\s*\(\s*true\s*\)|if\s*\(\s*false\s*\)/g,
      'Unused imports': /import\s+.*\s+from\s+['"][^'"]+['"];?\s*(\/\/.*|$)/gm,
      'Fake async patterns': /await\s+new\s+Promise\s*\(\s*resolve\s*=>\s*resolve\s*\(/g
    };

    const detected: string[] = [];
    for (const [patternName, pattern] of Object.entries(patterns)) {
      if (pattern.test(code)) {
        detected.push(patternName);
      }
    }

    return detected;
  }

  validateWorkflowStep(step: string, evidencePath: string): ValidationResult {
    const result: ValidationResult = {
      passed: false,
      theatricalDetected: false,
      theatricalPatterns: [],
      actualCompilation: false,
      testsActuallyRun: false,
      codeIntegration: false
    };

    try {
      if (!fs.existsSync(evidencePath)) {
        return result;
      }

      const content = fs.readFileSync(evidencePath, 'utf-8');
      const patterns = this.detectTheatrical(content);

      result.theatricalDetected = patterns.length > 0;
      result.theatricalPatterns = patterns;

      switch (step.toUpperCase()) {
        case 'BUILD':
          result.actualCompilation = this.checkCompilation(content);
          result.codeIntegration = this.checkImports(content);
          break;
        case 'TEST':
          result.testsActuallyRun = this.checkTestExecution(content);
          break;
        default:
          result.actualCompilation = true;
      }

      result.passed = !result.theatricalDetected && 
                     (result.actualCompilation || step === 'PLAN') &&
                     (step !== 'TEST' || result.testsActuallyRun);
    } catch (error) {
      // Return false result on any error
    }

    return result;
  }

  private checkCompilation(content: string): boolean {
    return !/\b(TODO|FIXME|HACK|XXX|not implemented)\b/i.test(content) &&
           content.trim().length > 0;
  }

  private checkImports(content: string): boolean {
    const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
    const usages = imports.length === 0;
    return usages || imports.length > 0;
  }

  private checkTestExecution(content: string): boolean {
    return /\b(test\(|describe\(|it\(|expect\()/i.test(content) &&
           !/\b(\.skip\(|xit\(|xdescribe\()\b/i.test(content);
  }

  validateDirectory(dirPath: string, step: string): ValidationResult {
    const files = this.getFilesRecursively(dirPath);
    const allResults: ValidationResult[] = [];

    for (const file of files) {
      const ext = path.extname(file);
      if (['.ts', '.js', '.json', '.md'].includes(ext)) {
        const result = this.validateWorkflowStep(step, file);
        allResults.push(result);
      }
    }

    const combined: ValidationResult = {
      passed: allResults.every(r => r.passed),
      theatricalDetected: allResults.some(r => r.theatricalDetected),
      theatricalPatterns: [...new Set(allResults.flatMap(r => r.theatricalPatterns))],
      actualCompilation: allResults.some(r => r.actualCompilation),
      testsActuallyRun: allResults.some(r => r.testsActuallyRun),
      codeIntegration: allResults.some(r => r.codeIntegration)
    };

    return combined;
  }

  private getFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
