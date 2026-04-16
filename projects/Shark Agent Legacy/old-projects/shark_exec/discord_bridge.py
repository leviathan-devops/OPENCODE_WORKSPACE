#!/usr/bin/env python3
"""
DISCORD BRIDGE for SHARK
Hermes-controlled Discord interface.

This runs in background, forwarding messages to/from Hermes.
I (Hermes) control the actual processing.
"""

import os
import sys
import asyncio
import aiohttp
import json
from typing import Dict, Any
import discord
from discord.ext import commands

# Import my controller
sys.path.insert(0, '/home/leviathan/shark')
from shark_controller import SHARK

class DiscordBridge:
    """Hermes-controlled Discord interface."""
    
    def __init__(self, token: str):
        self.token = token
        self.bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())
        self.setup_handlers()
        
    def setup_handlers(self):
        """Setup Discord event handlers."""
        
        @self.bot.event
        async def on_ready():
            print(f"Discord bridge ready: {self.bot.user}")
            print(f"Connected to {len(self.bot.guilds)} guilds")
            
        @self.bot.event
        async def on_message(message):
            # Don't respond to ourselves
            if message.author == self.bot.user:
                return
                
            # Forward to Hermes (in real implementation, this would be a queue)
            print(f"[DISCORD] {message.author}: {message.content[:100]}...")
            
            # Simple echo for now - Hermes will process in real implementation
            if message.content.startswith("!shark"):
                query = message.content[7:].strip()
                if query:
                    # Use Ollama for quick responses
                    response = await SHARK.query_model(
                        SHARK.models["fast"],
                        f"User asks: {query}\nProvide helpful response:"
                    )
                    await message.channel.send(f"🦈 {response[:1900]}")
                else:
                    await message.channel.send("🦈 SHARK ready. Command me through Hermes.")
            
            # Process commands
            await self.bot.process_commands(message)
    
    async def start(self):
        """Start the Discord bridge."""
        await self.bot.start(self.token)
    
    async def send_message(self, channel_id: int, message: str):
        """Send message to Discord channel."""
        channel = self.bot.get_channel(channel_id)
        if channel:
            await channel.send(message)
            return True
        return False
    
    async def get_recent_messages(self, channel_id: int, limit: int = 10):
        """Get recent messages from channel."""
        channel = self.bot.get_channel(channel_id)
        if channel:
            messages = []
            async for msg in channel.history(limit=limit):
                messages.append({
                    "author": str(msg.author),
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat()
                })
            return messages
        return []

async def main():
    """Main entry point - run by systemd."""
    # Get token from environment or file
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        try:
            with open("/home/leviathan/shark/discord_token.txt", "r") as f:
                token = f.read().strip()
        except:
            print("ERROR: No Discord token found")
            print("Set DISCORD_BOT_TOKEN env var or create /home/leviathan/shark/discord_token.txt")
            return
    
    bridge = DiscordBridge(token)
    
    print("Starting Discord bridge for SHARK...")
    print("Hermes is in control. Bridge only forwards messages.")
    
    try:
        await bridge.start()
    except KeyboardInterrupt:
        print("\nShutting down Discord bridge...")
    except Exception as e:
        print(f"Bridge error: {e}")

if __name__ == "__main__":
    asyncio.run(main())