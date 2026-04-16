#!/usr/bin/env python3
"""
SHARK Agent Daemon
Runs as a systemd service, logs to journal
"""

import subprocess
import os
import sys
import json
import time
import signal
from datetime import datetime

class SharkDaemon:
    """SHARK daemon that runs commands from a queue"""
    
    def __init__(self):
        self.running = True
        self.command_queue = []
        self.log_file = "/var/log/shark.log"
        
        # Signal handling
        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)
        
        # Setup log
        self.setup_logging()
    
    def handle_signal(self, signum, frame):
        """Handle termination signals"""
        self.log(f"Received signal {signum}, shutting down...")
        self.running = False
    
    def setup_logging(self):
        """Setup logging"""
        try:
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        except:
            # If we can't create /var/log/shark.log, use /tmp
            self.log_file = "/tmp/shark.log"
        
        self.log("=" * 60)
        self.log("🦈 SHARK Agent Daemon starting...")
        self.log(f"Time: {datetime.now().isoformat()}")
        self.log(f"PID: {os.getpid()}")
        self.log(f"User: {os.getenv('USER', 'unknown')}")
        self.log("=" * 60)
    
    def log(self, message: str):
        """Log message to file and stdout"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] {message}"
        
        # Write to log file (if possible)
        try:
            with open(self.log_file, "a") as f:
                f.write(log_line + "\n")
        except:
            # If we can't write to file, just print
            pass
        
        # Also print to stdout (captured by systemd journal)
        print(log_line)
    
    def execute_safe(self, command: str) -> dict:
        """Execute a command safely"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
                cwd="/home/leviathan"
            )
            
            return {
                "success": result.returncode == 0,
                "command": command,
                "stdout": result.stdout[:1000],  # Limit output
                "stderr": result.stderr[:1000],
                "exit_code": result.returncode,
                "timestamp": time.time()
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Command timed out",
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": command,
                "stdout": "",
                "stderr": "",
                "exit_code": -1
            }
    
    def run_health_checks(self):
        """Run periodic health checks"""
        checks = [
            ("System uptime", "uptime"),
            ("Disk space", "df -h /"),
            ("Memory", "free -h"),
            ("Network", "ping -c 1 8.8.8.8"),
            ("Process count", "ps aux | wc -l")
        ]
        
        self.log("🔍 Running health checks...")
        
        for name, cmd in checks:
            result = self.execute_safe(cmd)
            status = "✅" if result["success"] else "❌"
            self.log(f"  {status} {name}: {cmd}")
            
            if not result["success"]:
                self.log(f"    Error: {result.get('error', 'Unknown')}")
    
    def process_command_file(self):
        """Process commands from command file"""
        cmd_file = "/home/leviathan/shark/commands.txt"
        
        if not os.path.exists(cmd_file):
            return
        
        try:
            with open(cmd_file, "r") as f:
                commands = [line.strip() for line in f if line.strip()]
            
            if not commands:
                return
            
            self.log(f"Processing {len(commands)} commands from {cmd_file}")
            
            for cmd in commands:
                self.log(f"Executing: {cmd}")
                result = self.execute_safe(cmd)
                
                if result["success"]:
                    self.log(f"  ✅ Success")
                    if result["stdout"]:
                        self.log(f"    Output: {result['stdout'][:200]}...")
                else:
                    self.log(f"  ❌ Failed: {result.get('error', 'Unknown error')}")
            
            # Clear the command file after processing
            open(cmd_file, "w").close()
            
        except Exception as e:
            self.log(f"Error processing command file: {e}")
    
    def run(self):
        """Main daemon loop"""
        self.log("🦈 SHARK Daemon running...")
        
        check_interval = 60  # Run checks every 60 seconds
        last_check = 0
        
        while self.running:
            current_time = time.time()
            
            # Run health checks periodically
            if current_time - last_check > check_interval:
                self.run_health_checks()
                last_check = current_time
            
            # Process any pending commands
            self.process_command_file()
            
            # Sleep to avoid busy loop
            time.sleep(5)
        
        self.log("🦈 SHARK Daemon shutting down...")

def main():
    """Main entry point"""
    daemon = SharkDaemon()
    daemon.run()

if __name__ == "__main__":
    main()