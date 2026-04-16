# Case: Web UI Integration with Real Hermes Agent

## The Problem

Hermes Agent is a CLI tool with no built-in web server. To deploy on Railway with web UI, we need to:

1. Run Hermes Agent as a subprocess inside the container
2. Build a FastAPI web server that routes requests to Hermes
3. Ensure AI responses come from Hermes (with full context), not a separate chatbot

## Architecture

```
Web Browser
    │
    ▼
FastAPI Web Server (port 8080)
    │
    ├── /chat POST ──────────────────► Hermes Agent subprocess
    │                                        │
    │                                        ▼
    │                                  AI Processing
    │                                  (with memories, skills)
    │                                        │
    ◄───────────────────────────────────────┘
    │
    ▼
JSON Response to Browser
```

## NOT This (The Wrong Architecture)

```
Web Browser
    │
    ▼
FastAPI Server ──────────────────────► MiniMax API
    │                                        │
    │                                        ▼
    ◄───────────────────────────────── AI Response
    │
    ▼
"Chatbot wrapper" - NOT Hermes
```

## Implementation: web_server.py

The web server must:

1. **Start Hermes subprocess on container boot**
   ```python
   hermes_process = subprocess.Popen(
       ["hermes", "chat", "--session", session_id],
       stdout=subprocess.PIPE,
       stderr=subprocess.PIPE
   )
   ```

2. **Route chat requests to Hermes**
   ```python
   @app.post("/api/chat")
   async def chat(message: str):
       hermes_process.stdin.write(f"{message}\n".encode())
       response = hermes_process.stdout.readline()
       return {"response": response.decode()}
   ```

3. **Maintain session state**
   - Hermes sessions persist by session ID
   - Sessions stored in `/opt/data/sessions/`

## Key Requirement

The web UI must route ALL AI requests through Hermes Agent. The responses must come from Hermes, not from a separate API call. This means:

- Hermes Agent must be running as a subprocess
- Web server sends messages to Hermes stdin
- Web server receives responses from Hermes stdout
- Session context maintained by Hermes

## Testing

To verify real Hermes is running:

1. Check logs for "Hermes Agent v0.6.0" initialization
2. Ask a question that requires context from memories
3. Verify response includes information from past conversations
4. Check `/opt/data/sessions/` for session files

## Anti-Pattern

If responses are generic and don't include context from memories, then the web server is NOT connected to real Hermes - it's just using an AI API directly.
