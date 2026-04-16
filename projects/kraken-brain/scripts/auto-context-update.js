#!/usr/bin/env bun
// 🦑 Auto‑Context Update Script
// Monitors token usage and updates ACTIVE_CONTEXT.md at 85% threshold
// Runs as background process via Bun.spawn

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const KRAKEN_DIR = '/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain';
const ACTIVE_CONTEXT = join(KRAKEN_DIR, 'ACTIVE_CONTEXT.md');
const PROJECT_ARCH = join(KRAKEN_DIR, 'Shared Macro Context/PROJECT_ARCHITECTURE.md');
const SNAPSHOT_DIR = join(KRAKEN_DIR, 'Nemotron Snapshots');
const LOG_FILE = join(KRAKEN_DIR, 'scripts/auto-context.log');

// Session state
let lastUpdateTime = 0;
const UPDATE_COOLDOWN = 30 * 60 * 1000; // 30 minutes minimum between updates
let sessionTokenEstimate = 0;
const TOKEN_THRESHOLD = 0.85; // 85%

// Simple token estimation (4 tokens per word, ~1.3 per character)
function estimateTokens(text) {
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.max(words * 4, chars * 1.3);
}

// Extract key insights from recent messages (simplified)
function extractInsights() {
  // In a real implementation, this would parse session logs or recent tool calls
  // For now, return placeholder insights
  const date = new Date().toDateString();
  return [
    `Auto‑context capture triggered at ${new Date().toLocaleTimeString()}`,
    `Token usage estimated at ${Math.round(sessionTokenEstimate / 1000)}K`,
    `Background process running since ${new Date().toISOString().split('T')[0]}`
  ];
}

// Read and parse ACTIVE_CONTEXT.md
async function readActiveContext() {
  try {
    const content = await readFile(ACTIVE_CONTEXT, 'utf-8');
    const lines = content.split('\n');
    
    // Find "Pre‑Compaction Summaries" section
    let summaryStart = -1;
    let summaryEnd = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('## 📋 **PRE-COMPACTION SUMMARIES**')) {
        summaryStart = i;
      } else if (summaryStart !== -1 && lines[i].includes('---') && i > summaryStart + 10) {
        summaryEnd = i;
        break;
      }
    }
    
    return { content, lines, summaryStart, summaryEnd };
  } catch (err) {
    console.error(`[Auto‑Context] Failed to read ACTIVE_CONTEXT.md: ${err.message}`);
    return null;
  }
}

// Rotate summaries (keep only 3 most recent)
async function rotateSummaries() {
  try {
    const ctx = await readActiveContext();
    if (!ctx || ctx.summaryStart === -1) return;
    
    const { lines, summaryStart, summaryEnd } = ctx;
    const summarySection = lines.slice(summaryStart, summaryEnd);
    
    // Extract existing summaries
    const summaries = [];
    let currentSummary = [];
    let inSummary = false;
    
    for (const line of summarySection) {
      if (line.includes('### **Summary #')) {
        if (currentSummary.length > 0) {
          summaries.push(currentSummary.join('\n'));
        }
        currentSummary = [line];
        inSummary = true;
      } else if (inSummary && line.trim() === '') {
        // End of summary
        summaries.push(currentSummary.join('\n'));
        currentSummary = [];
        inSummary = false;
      } else if (inSummary) {
        currentSummary.push(line);
      }
    }
    
    if (currentSummary.length > 0) {
      summaries.push(currentSummary.join('\n'));
    }
    
    // Keep only 3 most recent
    if (summaries.length > 3) {
      const oldest = summaries.shift(); // Remove oldest
      
      // Archive oldest to PROJECT_ARCHITECTURE.md
      try {
        let archContent = await readFile(PROJECT_ARCH, 'utf-8');
        const archiveMarker = '## 📜 **ARCHIVED SUMMARIES**';
        const archiveIndex = archContent.indexOf(archiveMarker);
        
        if (archiveIndex === -1) {
          // Create archive section
          archContent += `\n\n${archiveMarker}\n\n${oldest}\n`;
        } else {
          // Append to existing archive
          const before = archContent.slice(0, archiveIndex + archiveMarker.length);
          const after = archContent.slice(archiveIndex + archiveMarker.length);
          archContent = before + '\n\n' + oldest + '\n' + after;
        }
        
        await writeFile(PROJECT_ARCH, archContent);
        console.log(`[Auto‑Context] Archived oldest summary to PROJECT_ARCHITECTURE.md`);
      } catch (err) {
        console.error(`[Auto‑Context] Failed to archive summary: ${err.message}`);
      }
    }
    
    return summaries.slice(-3); // Return remaining summaries (max 3)
  } catch (err) {
    console.error(`[Auto‑Context] Failed to rotate summaries: ${err.message}`);
    return [];
  }
}

// Create new summary entry
function createSummary(number, insights) {
  const date = new Date().toDateString();
  const time = new Date().toLocaleTimeString();
  
  return `### **Summary #${number}: ${date} – Auto‑Capture at ${time}**
- **Trigger**: Token usage reached ${Math.round(TOKEN_THRESHOLD * 100)}% threshold
- **Insights**:
${insights.map(insight => `  - ${insight}`).join('\n')}
- **Action**: Context preserved before potential compaction`;
}

// Update ACTIVE_CONTEXT.md with new summary
async function updateActiveContext() {
  try {
    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_COOLDOWN) {
      console.log(`[Auto‑Context] Cooldown active, skipping update`);
      return;
    }
    
    const ctx = await readActiveContext();
    if (!ctx) return;
    
    const { content, lines, summaryStart, summaryEnd } = ctx;
    
    // Get current summaries and rotate if needed
    const keptSummaries = await rotateSummaries();
    const nextNumber = keptSummaries.length + 1;
    
    // Extract insights
    const insights = extractInsights();
    const newSummary = createSummary(nextNumber, insights);
    
    // Build new content
    let newLines = [...lines];
    
    if (summaryStart !== -1 && summaryEnd !== -1) {
      // Replace summary section
      const beforeSection = newLines.slice(0, summaryStart + 1);
      const afterSection = newLines.slice(summaryEnd);
      
      newLines = [
        ...beforeSection,
        '',
        ...keptSummaries,
        '',
        newSummary,
        '',
        ...afterSection
      ];
    } else {
      // Append new section (shouldn't happen)
      newLines.push('\n## 📋 **PRE‑COMPACTION SUMMARIES**');
      newLines.push('');
      newLines.push(newSummary);
      newLines.push('');
      newLines.push('---');
    }
    
    // Update token usage line
    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].includes('**Token Usage**:')) {
        newLines[i] = `**Token Usage**: ${Math.round(TOKEN_THRESHOLD * 100)}% (auto‑capture triggered)`;
        break;
      }
    }
    
    // Update last updated date
    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].includes('**Last Updated**:')) {
        newLines[i] = `**Last Updated**: ${new Date().toDateString()}  `;
        break;
      }
    }
    
    await writeFile(ACTIVE_CONTEXT, newLines.join('\n'));
    lastUpdateTime = now;
    
    console.log(`[Auto‑Context] Updated ACTIVE_CONTEXT.md with Summary #${nextNumber}`);
    
    // Log to file
    const logEntry = `[${new Date().toISOString()}] Auto‑capture triggered at ${TOKEN_THRESHOLD * 100}% token usage\n`;
    await writeFile(LOG_FILE, logEntry, { flag: 'a' });
    
  } catch (err) {
    console.error(`[Auto‑Context] Failed to update ACTIVE_CONTEXT.md: ${err.message}`);
  }
}

// Take ground‑truth snapshot
async function takeSnapshot() {
  try {
    const date = new Date().toISOString().split('T')[0];
    const snapshotPath = join(SNAPSHOT_DIR, date);
    
    if (!existsSync(snapshotPath)) {
      await mkdir(snapshotPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = join(snapshotPath, `snapshot-${timestamp}.json`);
    
    const snapshot = {
      timestamp: new Date().toISOString(),
      activeContext: await readFile(ACTIVE_CONTEXT, 'utf-8'),
      tokenEstimate: sessionTokenEstimate,
      insights: extractInsights()
    };
    
    await writeFile(snapshotFile, JSON.stringify(snapshot, null, 2));
    console.log(`[Auto‑Context] Snapshot saved to ${snapshotFile}`);
    
  } catch (err) {
    console.error(`[Auto‑Context] Failed to take snapshot: ${err.message}`);
  }
}

// Main monitoring loop
async function monitor() {
  console.log(`[Auto‑Context] Starting monitor (threshold: ${TOKEN_THRESHOLD * 100}%)`);
  
  // Initial snapshot
  await takeSnapshot();
  
  // Simulate token accumulation (in real use, this would come from OpenCode API)
  // For now, we'll trigger after a fixed time for demonstration
  let simulatedTokens = 0;
  const TOKEN_INCREMENT = 5000; // Simulate 5K tokens per minute
  
  setInterval(() => {
    simulatedTokens += TOKEN_INCREMENT;
    sessionTokenEstimate = simulatedTokens;
    
    // Simulated context size (128K tokens)
    const usage = simulatedTokens / (128 * 1024);
    
    if (usage >= TOKEN_THRESHOLD) {
      console.log(`[Auto‑Context] Token usage reached ${Math.round(usage * 100)}%, triggering update`);
      updateActiveContext();
      
      // Take snapshot after update
      takeSnapshot();
      
      // Reset for next cycle (simulating compaction)
      simulatedTokens = 0;
    }
    
    // Daily snapshot at midnight
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 1) {
      takeSnapshot();
    }
    
  }, 60000); // Check every minute
}

// Start monitoring
if (import.meta.main) {
  monitor().catch(err => {
    console.error(`[Auto‑Context] Fatal error: ${err.message}`);
    process.exit(1);
  });
}

export { monitor, updateActiveContext, takeSnapshot };