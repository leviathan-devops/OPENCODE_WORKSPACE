#!/usr/bin/env python3
"""
opencode_agent.py — Spawn OpenCode containers as sub-agents

Usage:
    python3 opencode_agent.py --task "Review this code: $(cat file.py)"
    python3 opencode_agent.py --task "Create a test file" --model minimax/MiniMax-M2.7
    python3 opencode_agent.py --task "Build the plugin" --timeout 120

Output: JSON with {success, text, session_id, tokens, cost, error}
"""

import argparse
import json
import subprocess
import time
import os
import sys
import re
import tempfile
from pathlib import Path
from datetime import datetime

# ── Container Management ──────────────────────────────────────────────────────

CONTAINER_NAME_PREFIX = "hermes-oc-agent-"
IMAGE = "ghcr.io/anomalyco/opencode"
DEFAULT_PORT = 18081
CONFIG_PATH = Path.home() / ".config/opencode"
PORTS = list(range(18081, 18095))  # Port pool


def get_api_key(name: str) -> str | None:
    """Get API key from environment variable."""
    return os.environ.get(name)


def find_free_port() -> int:
    """Find an available port from the pool."""
    import socket

    for port in PORTS:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("127.0.0.1", port))
            sock.close()
            return port
        except OSError:
            continue
    raise RuntimeError(f"No free ports in {PORTS}")


def container_exists(name: str) -> bool:
    result = subprocess.run(
        ["docker", "ps", "-a", "-q", "-f", f"name={name}"],
        capture_output=True,
        text=True,
    )
    return bool(result.stdout.strip())


def kill_container(name: str) -> None:
    subprocess.run(["docker", "kill", name], capture_output=True)
    time.sleep(1)


def ensure_container(
    name: str,
    port: int,
    workspace: str | None = None,
    network_mode: str = "bridge",
) -> str:
    """Start an opencode container if it doesn't exist. Returns container name.

    Args:
        name: Container name
        port: Port for the container (used when network_mode is 'bridge')
        workspace: Optional workspace directory to mount
        network_mode: Docker network mode - 'bridge' (default) or 'host' (for host network access)
    """
    if container_exists(name):
        # Already running — just return
        return name

    # Build docker run command
    cmd = [
        "docker",
        "run",
        "-d",
        "--rm",
        "--name",
        name,
    ]

    # Network configuration
    if network_mode == "host":
        # Host network mode - shares network namespace with host
        # No port mapping needed, container uses host's localhost directly
        cmd += ["--network=host"]
    else:
        # Bridge mode (default) - isolated network, port mapping needed
        cmd += ["-p", f"{port}:8080"]

    # Mount config read-only
    if CONFIG_PATH.exists():
        cmd += ["-v", f"{CONFIG_PATH}:/root/.config/opencode:ro"]

    # MECHANICAL: Mount entire home directory to ensure all plugins are available
    # This makes the container an exact duplicate of the local environment
    cmd += ["-v", f"/home/leviathan:/home/leviathan:ro"]

    # Mount workspace directory (for persistent file access)
    if workspace:
        # Mount the workspace at /workspace inside container
        cmd += ["-v", f"{os.path.abspath(workspace)}:/workspace:rw"]
    else:
        # Default: mount a temp workspace
        tmp_dir = tempfile.mkdtemp(prefix="hermes-oc-")
        cmd += ["-v", f"{tmp_dir}:/workspace:rw"]

    # Pass through API keys
    for key in [
        "MINIMAX_API_KEY",
        "DEEPSEEK_API_KEY",
        "GOOGLE_API_KEY",
        "OPENAI_API_KEY",
        "GLM_API_KEY",
        "ZHIPU_API_KEY",
        "SHARK_GEMINI_PROXY",
        "OPENCODE_API_KEY",
    ]:
        val = get_api_key(key)
        if val:
            cmd += ["-e", f"{key}={val}"]

    # When using host network, serve directly on a port accessible from host
    # When using bridge, map port 8080 to host port
    serve_port = port if network_mode == "host" else 8080
    cmd += [IMAGE, "serve", "--port", str(serve_port), "--hostname", "0.0.0.0"]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Failed to start container: {result.stderr}")

    # Wait for health - use appropriate host address based on network mode
    health_port = port if network_mode == "host" else port
    for _ in range(15):
        time.sleep(1)
        try:
            import urllib.request

            with urllib.request.urlopen(
                f"http://localhost:{health_port}/global/health", timeout=2
            ) as r:
                if b"healthy" in r.read():
                    return name
        except:
            continue

    raise RuntimeError(f"Container {name} failed to become healthy")


def wait_healthy(port: int, timeout: int = 15) -> bool:
    """Wait for container health check."""
    import urllib.request

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(
                f"http://localhost:{port}/global/health", timeout=2
            ) as r:
                if b"healthy" in r.read():
                    return True
        except:
            pass
        time.sleep(1)
    return False


# ── JSON Stream Parser ────────────────────────────────────────────────────────


def parse_run_output(stdout: str) -> dict:
    """Parse opencode run --format json output into structured result."""
    text_parts = []
    tokens = 0
    cost = 0.0
    reason = ""
    session_id = ""
    error = None

    for line in stdout.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue

        t = d.get("type", "")

        if t == "session":
            session_id = d.get("sessionID", "")

        elif t == "text":
            txt = d.get("part", {}).get("text", "")
            if txt.strip():
                text_parts.append(txt.strip())

        elif t == "step_finish":
            p = d.get("part", {})
            reason = p.get("reason", reason)
            tk = p.get("tokens", {})
            if isinstance(tk, dict):
                tokens = tk.get("total", tokens)
                cost = tk.get("cost", cost)

    # Detect error conditions
    full_text = " ".join(text_parts)
    if "error" in full_text.lower() and "no python" not in full_text.lower():
        # Heuristic: if text mentions error prominently
        pass  # not conclusive

    return {
        "success": reason == "stop" or bool(text_parts),
        "text": "\n".join(text_parts),
        "session_id": session_id,
        "tokens": tokens,
        "cost": cost,
        "reason": reason,
        "error": error,
    }


# ── Main Agent Interface ──────────────────────────────────────────────────────


def run_task(
    task: str,
    model: str = "minimax/MiniMax-M2.7",
    timeout: int = 60,
    container_name: str | None = None,
    port: int | None = None,
    workspace: str | None = None,
    network_mode: str = "bridge",
) -> dict:
    """
    Spawn an opencode container and run a task.
    Returns structured result dict.

    Args:
        task: Task prompt to execute
        model: Model to use (default: minimax/MiniMax-M2.7)
        timeout: Timeout in seconds (default: 60)
        container_name: Optional container name to reuse
        port: Optional port (auto-allocated if not specified)
        workspace: Optional workspace directory to mount at /workspace
        network_mode: Docker network mode - 'bridge' (default, isolated network)
                     or 'host' (shares host network namespace for localhost access)
    """
    # Allocate container identity
    if container_name is None:
        container_name = f"{CONTAINER_NAME_PREFIX}{os.getpid()}"

    if port is None:
        port = find_free_port()

    tmp = None

    try:
        # Ensure container is running with specified network mode
        ensure_container(
            container_name, port, workspace=workspace, network_mode=network_mode
        )
        wait_healthy(port)

        # Build the opencode run command
        cmd = [
            "docker",
            "exec",
            container_name,
            "opencode",
            "run",
            "--format",
            "json",
            task,
            "--model",
            model,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        stdout = result.stdout
        stderr = result.stderr

        # Check for docker/exec errors
        if result.returncode != 0 and not stdout:
            return {
                "success": False,
                "text": "",
                "error": f"Exit {result.returncode}: {stderr[:500]}",
                "tokens": 0,
                "cost": 0.0,
            }

        parsed = parse_run_output(stdout)
        parsed["container"] = container_name
        parsed["port"] = port
        return parsed

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "text": "",
            "error": f"Timeout after {timeout}s",
            "tokens": 0,
            "cost": 0.0,
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "error": str(e),
            "tokens": 0,
            "cost": 0.0,
        }


def cleanup_container(container_name: str) -> None:
    """Kill a container by name."""
    try:
        kill_container(container_name)
    except:
        pass


# ── CLI Entry Point ───────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="OpenCode container sub-agent")
    parser.add_argument("--task", "-t", required=True, help="Task prompt")
    parser.add_argument(
        "--model",
        "-m",
        default="minimax/MiniMax-M2.7",
        help="Model (provider/name), default: minimax/MiniMax-M2.7",
    )
    parser.add_argument(
        "--timeout", type=int, default=60, help="Timeout in seconds, default: 60"
    )
    parser.add_argument("--container", help="Reuse existing container name")
    parser.add_argument("--port", type=int, help="Port for existing container")
    parser.add_argument(
        "--cleanup", action="store_true", help="Kill container after task"
    )
    parser.add_argument(
        "--json-only",
        action="store_true",
        help="Only output the text response, as raw text",
    )
    parser.add_argument(
        "--workspace",
        "-w",
        help="Workspace directory to mount at /workspace in container",
    )
    parser.add_argument(
        "--network",
        default="bridge",
        choices=["bridge", "host"],
        help="Docker network mode: 'bridge' (default, isolated) or 'host' (shares host network for localhost access)",
    )
    args = parser.parse_args()

    result = run_task(
        task=args.task,
        model=args.model,
        timeout=args.timeout,
        container_name=args.container,
        port=args.port,
        workspace=args.workspace,
        network_mode=args.network,
    )

    if args.cleanup and args.container:
        cleanup_container(args.container)

    if args.json_only:
        print(result["text"])
    else:
        print(json.dumps(result, indent=2))

    # Exit code
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
