# 🦈 Shark CLI - Complete Build Specification for GLM

**Copy this ENTIRE prompt and send to GLM web chat. This is the agent that will actually build the Shark CLI.**

---

## Context: Why We're Building This

### The Problem We Had with Qwen Code

**Original Issue:** Qwen Code CLI (Node.js-based) had a critical scalability limitation:

```
(node:XXXXXX) MaxListenersExceededWarning: Possible EventTarget memory leak detected.
11 abort listeners added to [AbortSignal]. MaxListeners is 10.
```

**Root Cause:**
- Qwen Code is built on Node.js v20
- Each API call creates an `AbortSignal` listener for timeout handling
- Node.js defaults to 10 listeners per EventTarget (safety feature)
- With 3-4 concurrent terminals (7+ Node processes), we hit the limit
- After hitting the limit: API calls start timing out, terminals become unusable

**Attempted Fixes (Node.js):**
```bash
# Temporary workaround - raises limit but doesn't fix root cause
export NODE_OPTIONS="--max-listeners=100"
```

**Why This Matters for Shark CLI:**
- User needs **10+ concurrent Shark CLI terminals** running simultaneously
- Each terminal makes multiple API calls (DeepSeek + GLM)
- Node.js approach would require `NODE_OPTIONS="--max-listeners=200+"`
- This is a band-aid, not a fix - memory still accumulates

**Decision:** Build a **native Rust CLI** that has NO equivalent limitation:
- No event listeners
- No garbage collection
- No runtime overhead
- Direct syscalls for Guardian (chattr/chflags)
- Single static binary (no dependencies)

---

## What We're Building

### Shark CLI - "Qwen --yolo" Feel with Dual-Brain Foundation

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QWEN --YOLO (Node.js - has limitations):                      │
│  ──────────────────────────────────                            │
│  $ qwen --yolo "build me a REST API"                           │
│  [Agent thinking...]                                           │
│  [Writing files...]                                            │
│  ✅ Done!                                                      │
│                                                                 │
│  Problem: Run 4+ terminals simultaneously → API timeouts       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SHARK --YOLO (Rust - NO limitations):                         │
│  ──────────────────────────────────                            │
│  $ shark "build me a REST API"                                 │
│  [Agent thinking...]                                           │
│  [Writing files...]                                            │
│  ✅ Done!                                                      │
│                                                                 │
│  Result: SAME UX, but can run 10+ terminals simultaneously     │
│  No listener limits, no GC pauses, no runtime dependencies     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Requirements

| Requirement | Why It Matters |
|-------------|----------------|
| **Single static binary** | No runtime dependencies, easy deployment |
| **Same UX as `qwen --yolo`** | Zero learning curve for users |
| **10+ concurrent terminals** | No Node.js listener limit issues |
| **Guardian built-in** | File protection at kernel level |
| **Dual-brain orchestration** | DeepSeek R1 (planning) + GLM 4.5 (execution) |
| **Native syscalls** | Direct chattr/chflags without FFI complexity |

---

## Technical Stack (Rust - NOT Node.js)

### Core Dependencies

```toml
[dependencies]
# Async runtime (NO listener limits like Node.js)
tokio = { version = "1.35", features = ["full"] }

# HTTP client with connection pooling (NO AbortSignal issues)
reqwest = { version = "0.11", features = ["json", "stream"] }

# CLI framework
clap = { version = "4.4", features = ["derive"] }

# JSON serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Terminal UI (progress spinners)
indicatif = "0.17"

# File watching (for Guardian)
notify = "6.1"

# Direct syscalls for Guardian (chattr/chflags)
libc = "0.2"

# Error handling
anyhow = "1.0"
thiserror = "1.0"
```

### Why Rust Solves the Node.js Problem

| Issue | Node.js (Qwen Code) | Rust (Shark CLI) |
|-------|---------------------|------------------|
| **Event listeners** | AbortSignal limit (10 default) | N/A - doesn't exist |
| **Memory management** | GC + potential leaks | Compile-time safety, no GC |
| **Async concurrency** | Promise-based, listener accumulation | Tokio futures, no limits |
| **HTTP connections** | Per-call overhead | Connection pooling built-in |
| **Syscalls (Guardian)** | Requires node-gyp, FFI | Direct libc calls |
| **Binary size** | ~150MB with Node runtime | ~5-10MB static binary |
| **Concurrent terminals** | 3-4 before issues | 10+ with no issues |

---

## Architecture

### Project Structure

```
shark-cli/
├── Cargo.toml
├── src/
│   ├── main.rs              # Entry point (like qwen --yolo UX)
│   ├── cli.rs               # Argument parsing (clap)
│   ├── config.rs            # Config + API keys
│   │
│   ├── brain/
│   │   ├── mod.rs           # Dual-brain orchestration
│   │   ├── deepseek.rs      # DeepSeek R1 client (planning)
│   │   └── glm.rs           # GLM 4.5 client (execution)
│   │
│   ├── guardian/
│   │   ├── mod.rs           # File protection layer
│   │   ├── linux.rs         # chattr +i (Linux)
│   │   └── macos.rs         # chflags schg (macOS)
│   │
│   ├── tools/
│   │   ├── mod.rs           # Tool registry
│   │   ├── write_file.rs
│   │   ├── read_file.rs
│   │   ├── edit_file.rs
│   │   ├── run_command.rs
│   │   └── search.rs        # grep
│   │
│   └── sandbox/
│       ├── mod.rs           # Command sandboxing
│       └── linux.rs         # unshare/namespaces
│
└── tests/
    ├── integration.rs
    └── guardian_tests.rs
```

### Entry Point (main.rs)

```rust
// src/main.rs
// SAME UX AS QWEN --YOLO - User types command, agent handles everything

use clap::Parser;
use shark_cli::{cli, brain, guardian, tools};

#[derive(Parser)]
#[command(name = "shark")]
#[command(about = "🦈 Shark CLI - Autonomous AI Agent")]
struct Cli {
    /// Prompt to execute
    #[arg(required = false)]
    prompt: Option<String>,
    
    /// Mode: micro (DeepSeek only), macro (GLM + DeepSeek), auto (default)
    #[arg(short, long, default_value = "auto")]
    mode: String,
    
    /// YOLO mode - no confirmations (default: true)
    #[arg(long, default_value = "true")]
    yolo: bool,
}

#[tokio::main(flavor = "multi_thread", worker_threads = 4)]  // Multi-threaded (NO listener limits)
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    
    if let Some(prompt) = cli.prompt {
        // ONE-SHOT MODE: shark "build me X"
        run_autonomous(prompt, &cli.mode, cli.yolo).await?;
    } else {
        // INTERACTIVE MODE: shark (REPL)
        run_repl().await?;
    }
    
    Ok(())
}

async fn run_autonomous(prompt: String, mode: &str, yolo: bool) -> anyhow::Result<()> {
    // Load config (API keys, protected files)
    let config = config::Config::load()?;
    
    // Initialize dual-brain system
    let brain = brain::DualBrain::new(
        brain::DeepSeekClient::new(&config.deepseek_key),
        brain::GlmClient::new(&config.glm_key),
        guardian::Guardian::new(&config.protected_files),
    ).await?;
    
    // Show progress spinner (like qwen does)
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Thinking...");
    
    // Execute autonomously - user sees same thing as qwen --yolo
    let result = brain.execute_autonomously(&prompt, mode).await?;
    
    spinner.finish();
    
    // Show result
    println!("{}", result.output);
    
    // Summarize what was done (like qwen does)
    if !result.files_created.is_empty() {
        println!("\n✅ Created: {}", result.files_created.join(", "));
    }
    
    Ok(())
}

async fn run_repl() -> anyhow::Result<()> {
    println!("🦈 Shark Agent v1.0.0");
    println!("Type your request. Ctrl+C to exit.\n");
    
    let mut brain = brain::DualBrain::new(...).await?;
    let mut readline = String::new();
    
    loop {
        print!("\nYou: ");
        std::io::stdout().flush().unwrap();
        
        readline.clear();
        std::io::stdin().read_line(&mut readline)?;
        
        if readline.trim().is_empty() {
            continue;
        }
        
        // Execute request
        let result = brain.execute_autonomously(readline.trim(), "auto").await?;
        println!("{}", result.output);
    }
}
```

### Dual-Brain Orchestration (brain/mod.rs)

```rust
// src/brain/mod.rs
// INVISIBLE ORCHESTRATION - User doesn't see which brain is doing what

pub struct DualBrain {
    planner: DeepSeekClient,      // Strategic brain (DeepSeek R1)
    executor: GlmClient,          // Execution brain (GLM 4.5)
    guardian: Guardian,           // Protection layer (silent by default)
    tools: ToolRegistry,
    mode: ExecutionMode,
}

pub enum ExecutionMode {
    Micro,      // DeepSeek only (quick tasks)
    Macro,      // GLM + DeepSeek advisory (complex tasks)
    Auto,       // Auto-select based on complexity
}

impl DualBrain {
    pub async fn execute_autonomously(
        &self,
        prompt: &str,
        mode: &str,
    ) -> anyhow::Result<ExecutionResult> {
        let mut context = ExecutionContext::new(prompt);
        
        // Phase 1: Planning (DeepSeek) - INVISIBLE to user
        let plan = self.planner.plan(prompt, &self.tools.definitions()).await?;
        context.set_plan(plan);
        
        // Phase 2: Execution Loop - SAME FEEL AS QWEN --YOLO
        loop {
            // Get next action from GLM (executor brain)
            let action = self.executor.next_action(&context).await?;
            
            match action {
                Action::ToolCall(tool_call) => {
                    // Guardian check - ONLY pauses if protected file
                    match self.guardian.check(&tool_call) {
                        GuardianAction::Allow => {
                            // Execute tool (silent, like qwen)
                            let result = self.tools.execute(&tool_call).await?;
                            context.add_result(tool_call.id, result);
                            
                            // Show progress (like qwen does)
                            println!("[{}] {}", tool_call.name, result.summary());
                        }
                        GuardianAction::RequestApproval { file, operation, reason } => {
                            // ONLY time user sees Guardian
                            println!("\n🔐 GUARDIAN: Protected file detected");
                            println!("   File: {}", file);
                            println!("   Operation: {}", operation);
                            println!("   Reason: {}", reason);
                            print!("   Approve? [y/n]: ");
                            std::io::stdout().flush()?;
                            
                            let mut response = String::new();
                            std::io::stdin().read_line(&mut response)?;
                            
                            if response.trim().to_lowercase() != "y" {
                                return Err(anyhow::anyhow!("Operation denied by user"));
                            }
                        }
                    }
                }
                
                Action::Done(output) => {
                    // Phase 3: Final review (DeepSeek) - INVISIBLE
                    let approval = self.planner.review(&context).await?;
                    
                    if approval.needs_revision {
                        // Loop back for fixes
                        context.add_feedback(approval.feedback);
                        continue;
                    }
                    
                    // Done!
                    return Ok(ExecutionResult {
                        output,
                        files_created: context.files_created(),
                    });
                }
            }
        }
    }
}
```

### Guardian (guardian/mod.rs) - Silent By Default

```rust
// src/guardian/mod.rs
// SILENT unless protected file is touched

use libc::{ioctl, FS_IOC_GETFLAGS, FS_IOC_SETFLAGS, FS_IMMUTABLE_FL};
use std::fs::File;
use std::os::unix::io::AsRawFd;

pub struct Guardian {
    protected_files: Vec<String>,
}

impl Guardian {
    pub fn new(protected_files: &[String]) -> Self {
        Self {
            protected_files: protected_files.to_vec(),
        }
    }
    
    /// Check if this tool call needs approval
    pub fn check(&self, tool_call: &ToolCall) -> GuardianAction {
        match tool_call.name.as_str() {
            "write_file" | "edit_file" | "delete_file" => {
                let path = tool_call.args["file_path"].as_str().unwrap();
                if self.is_protected(path) {
                    // ONLY time user sees Guardian
                    return GuardianAction::RequestApproval {
                        file: path.to_string(),
                        operation: tool_call.name.clone(),
                        reason: "Protected file".to_string(),
                    };
                }
            }
            "run_command" => {
                let cmd = tool_call.args["command"].as_str().unwrap();
                if self.is_dangerous_command(cmd) {
                    return GuardianAction::RequestApproval {
                        file: "system".to_string(),
                        operation: "command".to_string(),
                        reason: format!("Potentially dangerous: {}", cmd),
                    };
                }
            }
            _ => {}
        }
        
        // Default: Allow without interruption (SILENT)
        GuardianAction::Allow
    }
    
    /// Make file immutable (Linux: chattr +i, macOS: chflags schg)
    pub fn protect(&self, path: &str) -> anyhow::Result<()> {
        #[cfg(target_os = "linux")]
        {
            let file = File::open(path)?;
            unsafe {
                let mut flags: i32 = 0;
                ioctl(file.as_raw_fd(), FS_IOC_GETFLAGS, &mut flags);
                flags |= FS_IMMUTABLE_FL;
                ioctl(file.as_raw_fd(), FS_IOC_SETFLAGS, &flags);
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            Command::new("chflags")
                .arg("schg")
                .arg(path)
                .status()?;
        }
        
        Ok(())
    }
}

pub enum GuardianAction {
    Allow,                              // Invisible - just do it
    RequestApproval {                   // Brief pause for user input
        file: String,
        operation: String,
        reason: String,
    },
}
```

---

## Critical Rust-Specific Considerations

### 1. Tokio Runtime Configuration (IMPORTANT)

```rust
// ❌ BAD: Single-threaded can bottleneck with concurrent API calls
#[tokio::main]
async fn main() { ... }

// ✅ GOOD: Multi-threaded for concurrent terminals
#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() { ... }
```

### 2. HTTP Connection Pooling (IMPORTANT)

```rust
// ❌ BAD: New connection per API call
let client = reqwest::Client::new();

// ✅ GOOD: Reuse connections (like Node.js agent keeps open)
let client = reqwest::Client::builder()
    .pool_max_idle_per_host(10)  // Reuse up to 10 idle connections
    .pool_idle_timeout(Duration::from_secs(90))
    .timeout(Duration::from_secs(120))
    .build()?;
```

### 3. Rate Limiting (Prevent API Throttling)

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

pub struct RateLimiter {
    semaphore: Arc<Semaphore>,
}

impl RateLimiter {
    pub fn new(requests_per_minute: usize) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(requests_per_minute)),
        }
    }
    
    pub async fn acquire(&self) {
        let _permit = self.semaphore.acquire().await.unwrap();
        // Token consumed, request allowed
    }
}
```

### 4. Error Handling (Explicit, Not Silent)

```rust
// ❌ BAD: Silent failures
async fn make_api_call(&self) {
    let response = client.get(url).send().await;
    // What if it fails?
}

// ✅ GOOD: Explicit error handling
async fn make_api_call(&self) -> anyhow::Result<ApiResponse> {
    let response = client.get(url)
        .send()
        .await
        .context("Failed to send API request")?;
    
    let json = response.json()
        .await
        .context("Failed to parse API response")?;
    
    Ok(json)
}
```

---

## Build Phases

### Phase 1: Core CLI (Day 1-2)
- [ ] `cargo init shark-cli`
- [ ] Add dependencies to Cargo.toml
- [ ] CLI argument parsing (clap)
- [ ] Basic REPL loop
- [ ] Config loading (~/.shark/config.json)

### Phase 2: Guardian (Day 3-4)
- [ ] chattr +i implementation (Linux)
- [ ] chflags schg implementation (macOS)
- [ ] Protected file list
- [ ] Approval workflow (y/n prompt)
- [ ] Test: `shark` cannot delete protected files

### Phase 3: Dual-Brain (Day 5-7)
- [ ] DeepSeek client (streaming API)
- [ ] GLM client (streaming API)
- [ ] Tool call parsing
- [ ] Orchestration layer (planner → executor → reviewer)
- [ ] Test: Both APIs respond correctly

### Phase 4: Tools (Day 8-10)
- [ ] write_file tool
- [ ] read_file tool
- [ ] edit_file tool (diff-based)
- [ ] run_command tool (with sandbox)
- [ ] search tool (grep wrapper)
- [ ] Test: All tools execute correctly

### Phase 5: Polish (Day 11-14)
- [ ] Progress spinners (indicatif)
- [ ] Error messages (user-friendly)
- [ ] Documentation (README.md)
- [ ] Integration tests
- [ ] Binary stripping (reduce size)

---

## Success Criteria (MUST PASS)

### Functional Tests

```bash
# 1. Basic one-shot (same as qwen --yolo)
$ shark "create a hello.txt file"
✅ Should create hello.txt

# 2. Interactive mode
$ shark
You: build a Flask API
[Agent thinking...]
[Writing files...]
✅ Done!

# 3. Guardian protection
$ shark "delete ~/.shark/config.json"
🔐 GUARDIAN: Protected file detected
   Approve? [y/n]: n
✅ File not deleted

# 4. Concurrent terminals (CRITICAL - Node.js failed here)
# Open 10 terminals, run simultaneously:
$ shark "do something"
# ALL 10 should complete without API timeouts
# NO listener limit warnings (because Rust has no such limit)
```

### Performance Tests

```bash
# 1. Binary size (should be < 15MB stripped)
$ ls -lh target/release/shark
-rwxrwxr-x 1 user user 8.5M ... shark

# 2. Startup time (should be < 100ms)
$ time shark --version
shark 1.0.0
real    0m0.050s

# 3. Memory usage (should be < 50MB idle)
$ ps aux | grep shark
user  12345  0.0  0.1  45678  3456 ?  Ss   0.0s

# 4. Concurrent API calls (10+ terminals)
# Monitor with: htop, netstat
# Should see: No connection exhaustion, no timeouts
```

---

## Known Limitations (Document These)

| Limitation | Why | Mitigation |
|------------|-----|------------|
| Guardian bypassed by `/bin/rm` | Bash hooks only intercept shell functions | Document: "accident prevention, not security" |
| Python can write to protected files | Hooks don't intercept syscalls | `chattr +i` blocks at kernel level |
| Different shells (zsh, sh) not hooked | Hooks are bash-specific | Document: set agent shell to bash |
| Physical/root access bypasses all | Out of scope for threat model | Document explicitly |

---

## What NOT to Include

- ❌ **No Node.js references** - This is pure Rust
- ❌ **No AbortSignal patterns** - Doesn't exist in Rust
- ❌ **No event emitter patterns** - Tokio futures instead
- ❌ **No NODE_OPTIONS configuration** - No runtime
- ❌ **No garbage collection concerns** - Rust has no GC
- ❌ **No FFI for Guardian syscalls** - Direct libc calls

---

## Final Deliverables

```
✅ Single binary: `target/release/shark` (~8-10MB)
✅ Same UX as: `qwen --yolo` (indistinguishable to user)
✅ Dual-brain: Invisible orchestration (DeepSeek + GLM)
✅ Guardian: Silent unless protected file touched
✅ Setup: `shark setup` (API keys config)
✅ Concurrent terminals: 10+ with NO issues (Rust has no listener limits)
✅ No runtime dependencies: Static binary, works anywhere
```

---

## Start Building Now

Begin with:
1. `cargo init shark-cli`
2. Add dependencies to Cargo.toml
3. Create basic CLI entry point (main.rs)
4. Implement REPL loop
5. Add first tool (write_file)

I'll review after Phase 1 (Core CLI) is complete.

---

**REMEMBER:** The goal is to give users the **exact same experience as `qwen --yolo`**, but with:
- ✅ No Node.js listener limit issues
- ✅ 10+ concurrent terminals supported
- ✅ Guardian protection built-in
- ✅ Dual-brain intelligence (invisible to user)
- ✅ Single static binary (no dependencies)

Start building!
```

---

## Follow-Up Questions (After GLM Responds)

Once GLM provides initial structure, ask these:

```
Thanks for the initial structure. A few clarifications:

1. **Tokio Runtime**: Confirm you're using `#[tokio::main(flavor = "multi_thread", worker_threads = 4)]` - this is critical for concurrent API calls.

2. **Connection Pooling**: Show me the reqwest Client builder code - I need to see `pool_max_idle_per_host(10)` for connection reuse.

3. **Guardian Syscalls**: For Linux chattr, are you using direct `ioctl` calls via libc crate? Show me the code.

4. **Error Handling**: All API calls should return `anyhow::Result<T>` - confirm this pattern is used throughout.

5. **Testing**: How will you test the 10+ concurrent terminals scenario? I want to see a load test script.

Please provide code snippets for each.
```

---

**Ready to send?** Copy this entire prompt and paste into GLM web chat. This is the agent that will build your Shark CLI.
