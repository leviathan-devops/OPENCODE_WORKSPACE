// Quick test of pattern matching

const IMPATIENCE_MESSAGE_PATTERNS = [
  /just.*ship.*it/i,
  /let's.*move.*on/i,
  /good.*enough/i,
  /close.*enough/i,
  /ship.*it/i,
  /fuck.*it/i,
];

const message = "just ship it without any testing";

console.log("Testing message:", message);
console.log("\nIMPATIENCE patterns:");
for (const p of IMPATIENCE_MESSAGE_PATTERNS) {
  console.log(`  ${p}: ${p.test(message)}`);
}

console.log("\nAll IMPATIENCE matched:", IMPATIENCE_MESSAGE_PATTERNS.filter(p => p.test(message)).length);
