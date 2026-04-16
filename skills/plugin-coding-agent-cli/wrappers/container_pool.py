#!/usr/bin/env python3
"""
container_pool.py — Manage a pool of persistent OpenCode containers for parallel sub-agents

Usage:
    python3 container_pool.py --create 3        # Start 3 containers
    python3 container_pool.py --list            # Show running containers
    python3 container_pool.py --kill-all        # Destroy all containers

    # In Python code:
    from container_pool import ContainerPool
    pool = ContainerPool(size=3)
    results = pool.run_all([
        {"task": "Review file A", "model": "minimax/MiniMax-M2.7"},
        {"task": "Review file B", "model": "minimax/MiniMax-M2.7"},
        {"task": "Review file C", "model": "minimax/MiniMax-M2.7"},
    ])
"""

import argparse
import json
import subprocess
import time
import os
import sys
import tempfile
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime

IMAGE = "ghcr.io/anomalyco/opencode"
POOL_PREFIX = "hermes-oc-pool-"
CONFIG_PATH = Path.home() / ".config/opencode"
PORTS = list(range(18081, 18095))
WORKSPACE_BASE = Path(tempfile.mkdtemp(prefix="hermes-pool-ws-"))

# ── Container Lifecycle ────────────────────────────────────────────────────────

def get_api_key(name: str) -> str | None:
    return os.environ.get(name)

def port_available(port: int) -> bool:
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('127.0.0.1', port))
        sock.close()
        return True
    except OSError:
        return False

def find_free_ports(n: int) -> list[int]:
    """Find n available ports."""
    free = []
    for port in PORTS:
        if port_available(port):
            free.append(port)
            if len(free) == n:
                break
    if len(free) < n:
        raise RuntimeError(f"Only {len(free)} free ports available, need {n}")
    return free

def docker_kill(name: str) -> None:
    subprocess.run(["docker", "kill", name], capture_output=True)
    time.sleep(0.5)

def docker_rm(name: str) -> None:
    subprocess.run(["docker", "rm", "-f", name], capture_output=True)

def container_health(port: int, timeout: int = 15) -> bool:
    import urllib.request
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://localhost:{port}/global/health", timeout=2) as r:
                if b"healthy" in r.read():
                    return True
        except:
            pass
        time.sleep(1)
    return False

def start_container(name: str, port: int, workspace: Path) -> bool:
    """Start an opencode container. Returns True if healthy."""
    # Kill any existing container with this name first
    docker_kill(name)
    time.sleep(0.5)

    cmd = [
        "docker", "run", "-d", "--rm",
        "--name", name,
        "-p", f"{port}:8080",
        "-v", f"{CONFIG_PATH}:/root/.config/opencode:ro",
        "-v", f"{workspace}:/workspace:rw",
    ]

    for key in ["MINIMAX_API_KEY", "DEEPSEEK_API_KEY", "GOOGLE_API_KEY",
                "OPENAI_API_KEY", "GLM_API_KEY", "ZHIPU_API_KEY",
                "SHARK_GEMINI_PROXY", "OPENCODE_API_KEY"]:
        val = get_api_key(key)
        if val:
            cmd += ["-e", f"{key}={val}"]

    cmd += [IMAGE, "serve", "--port", "8080", "--hostname", "0.0.0.0"]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"ERROR starting {name}: {r.stderr[:200]}", file=sys.stderr)
        return False

    return container_health(port)

def list_pool_containers() -> list[dict]:
    """List all hermes-oc-pool-* containers."""
    r = subprocess.run(
        ["docker", "ps", "-a", "--format", "{{.Names}}|{{.Ports}}|{{.Status}}"],
        capture_output=True, text=True
    )
    containers = []
    for line in r.stdout.strip().split("\n"):
        if not line:
            continue
        parts = line.split("|")
        name = parts[0]
        if name.startswith(POOL_PREFIX):
            port_str = parts[1] if len(parts) > 1 else ""
            port = int(port_str.split("->")[0].split(":")[-1]) if "->" in port_str else 0
            status = parts[2] if len(parts) > 2 else ""
            containers.append({"name": name, "port": port, "status": status})
    return containers

def kill_all_pool_containers() -> int:
    """Kill all pool containers. Returns count killed."""
    killed = 0
    for c in list_pool_containers():
        docker_kill(c["name"])
        killed += 1
    return killed

# ── Individual Task Runner ────────────────────────────────────────────────────

def parse_run_json(stdout: str) -> dict:
    """Parse opencode run --format json output."""
    text_parts = []
    tokens = 0
    cost = 0.0
    reason = ""
    session_id = ""

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

    return {
        "success": reason == "stop" or bool(text_parts),
        "text": "\n".join(text_parts),
        "session_id": session_id,
        "tokens": tokens,
        "cost": cost,
        "reason": reason,
    }

def run_single_task(
    container_name: str,
    port: int,
    task: str,
    model: str,
    timeout: int,
) -> dict:
    """Run a task in an existing container. Returns result dict."""
    cmd = [
        "docker", "exec", container_name,
        "opencode", "run", "--format", "json",
        task,
        "--model", model,
    ]

    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0 and not r.stdout:
            return {
                "success": False,
                "text": "",
                "error": f"Exit {r.returncode}: {r.stderr[:300]}",
                "tokens": 0,
                "cost": 0.0,
            }
        result = parse_run_json(r.stdout)
        result["container"] = container_name
        result["port"] = port
        return result
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "text": "",
            "error": f"Timeout after {timeout}s",
            "tokens": 0,
            "cost": 0.0,
        }

# ── ContainerPool ──────────────────────────────────────────────────────────────

class ContainerPool:
    """A pool of persistent OpenCode containers for parallel task execution."""

    def __init__(self, size: int = 2, workspace_base: Path | None = None):
        self.size = size
        self.workspace_base = workspace_base or WORKSPACE_BASE
        self.containers: list[dict] = []
        self._started = False

    def start(self) -> None:
        """Start all containers in the pool."""
        if self._started:
            return
        ports = find_free_ports(self.size)
        for i in range(self.size):
            name = f"{POOL_PREFIX}{i}"
            ws = self.workspace_base / f"ws_{i}"
            ws.mkdir(parents=True, exist_ok=True)
            port = ports[i]
            healthy = start_container(name, port, ws)
            self.containers.append({
                "name": name,
                "port": port,
                "workspace": ws,
                "healthy": healthy,
                "busy": False,
            })
            print(f"Started {name} on port {port} (healthy={healthy})", file=sys.stderr)
        self._started = True

    def run_all(self, tasks: list[dict], timeout: int = 120) -> list[dict]:
        """
        Run multiple tasks in parallel across the pool.
        Each task dict: {"task": str, "model": str, "timeout": int}
        Returns list of result dicts in same order as tasks.
        """
        if not self._started:
            self.start()

        # Assign tasks to containers round-robin
        assignments = []
        for i, t in enumerate(tasks):
            container = self.containers[i % len(self.containers)]
            assignments.append({
                "container": container,
                "task": t["task"],
                "model": t.get("model", "minimax/MiniMax-M2.7"),
                "timeout": t.get("timeout", 60),
            })

        results = [None] * len(tasks)

        def run_assignment(j, a):
            return j, run_single_task(
                container_name=a["container"]["name"],
                port=a["container"]["port"],
                task=a["task"],
                model=a["model"],
                timeout=a["timeout"],
            )

        with ThreadPoolExecutor(max_workers=len(assignments)) as ex:
            futures = {ex.submit(run_assignment, i, a): i for i, a in enumerate(assignments)}
            for future in as_completed(futures):
                j, result = future.result()
                results[j] = result

        return results

    def list(self) -> list[dict]:
        return list(self.containers)

    def kill_all(self) -> None:
        for c in self.containers:
            docker_kill(c["name"])
        self.containers.clear()
        self._started = False

    def cleanup(self) -> None:
        """Kill all containers and remove workspaces."""
        self.kill_all()
        shutil.rmtree(self.workspace_base, ignore_errors=True)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="OpenCode Container Pool Manager")
    parser.add_argument("--create", "-c", type=int, metavar="N",
                        help="Start N containers in the pool")
    parser.add_argument("--list", "-l", action="store_true",
                        help="List running pool containers")
    parser.add_argument("--kill-all", action="store_true",
                        help="Kill all pool containers")
    parser.add_argument("--pool-size", type=int, default=3,
                        help="Pool size for --create (default: 3)")
    args = parser.parse_args()

    if args.kill_all:
        n = kill_all_pool_containers()
        print(f"Killed {n} container(s)")
        return

    if args.list:
        for c in list_pool_containers():
            print(f"{c['name']} | port={c['port']} | {c['status']}")
        return

    if args.create:
        pool = ContainerPool(size=args.create)
        pool.start()
        print(f"Pool of {args.create} containers started")
        for c in pool.containers:
            print(f"  {c['name']} on port {c['port']} (healthy={c['healthy']})")
        # Keep alive for inspection
        input("Press Enter to kill pool...")
        pool.cleanup()
        return

    parser.print_help()


if __name__ == "__main__":
    main()
