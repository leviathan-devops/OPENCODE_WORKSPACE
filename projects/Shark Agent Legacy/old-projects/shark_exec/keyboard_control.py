#!/usr/bin/env python3
"""
Direct Asus keyboard RGB control
No model dependencies - pure hardware control
"""

import os
import time
import sys

class AsusKeyboardController:
    def __init__(self):
        self.backlight_path = "/sys/class/leds/asus::kbd_backlight"
        self.check_access()
    
    def check_access(self):
        """Check if we can access the keyboard backlight"""
        if not os.path.exists(self.backlight_path):
            print(f"❌ Keyboard backlight not found at {self.backlight_path}")
            print("Available LEDs:")
            os.system("ls -la /sys/class/leds/")
            sys.exit(1)
        
        # Check brightness control
        self.brightness_file = os.path.join(self.backlight_path, "brightness")
        self.max_brightness_file = os.path.join(self.backlight_path, "max_brightness")
        
        if not os.path.exists(self.brightness_file):
            print(f"❌ Brightness control not found at {self.brightness_file}")
            sys.exit(1)
        
        # Get max brightness
        with open(self.max_brightness_file, 'r') as f:
            self.max_brightness = int(f.read().strip())
        
        print(f"✅ Keyboard detected: {self.backlight_path}")
        print(f"   Max brightness: {self.max_brightness}")
    
    def set_brightness(self, level):
        """Set keyboard brightness (0-255 typically)"""
        level = max(0, min(level, self.max_brightness))
        try:
            with open(self.brightness_file, 'w') as f:
                f.write(str(level))
            return True
        except PermissionError:
            print(f"❌ Permission denied. Try: sudo chmod 666 {self.brightness_file}")
            return False
    
    def turn_off(self):
        """Turn off all backlight"""
        print("🔴 Turning off all keyboard backlight...")
        return self.set_brightness(0)
    
    def turn_on(self, brightness=None):
        """Turn on backlight with specified brightness"""
        if brightness is None:
            brightness = self.max_brightness // 2
        print(f"🟢 Turning on keyboard backlight to {brightness}...")
        return self.set_brightness(brightness)
    
    def flash_sequence(self, sequence, duration=3):
        """
        Flash through a sequence of brightness levels
        sequence: list of brightness values
        duration: seconds for each step
        """
        print(f"🎨 Flashing sequence: {sequence}")
        for i, brightness in enumerate(sequence):
            print(f"  Step {i+1}: brightness {brightness}")
            self.set_brightness(brightness)
            time.sleep(duration)
    
    def spell_word(self, word, base_brightness=50, highlight_brightness=255, duration=0.5):
        """
        Simulate spelling a word by flashing
        This is a visual simulation since we can't control individual keys
        """
        print(f"🔤 Spelling: {word}")
        letters = list(word.upper())
        
        for i, letter in enumerate(letters):
            print(f"  {letter}", end=' ', flush=True)
            # Flash for this letter
            self.set_brightness(highlight_brightness)
            time.sleep(duration * 0.3)
            self.set_brightness(base_brightness)
            time.sleep(duration * 0.1)
        
        print()  # New line after spelling
    
    def color_wave(self, cycles=3, speed=0.1):
        """Create a flowing color wave effect"""
        print(f"🌊 Starting color wave ({cycles} cycles)...")
        
        steps = 20
        for cycle in range(cycles):
            print(f"  Cycle {cycle + 1}/{cycles}")
            # Fade in
            for i in range(steps):
                brightness = int((i / steps) * self.max_brightness)
                self.set_brightness(brightness)
                time.sleep(speed)
            # Fade out
            for i in range(steps, 0, -1):
                brightness = int((i / steps) * self.max_brightness)
                self.set_brightness(brightness)
                time.sleep(speed)

def main():
    """Main test sequence"""
    print("🎮 ASUS KEYBOARD RGB CONTROL TEST")
    print("=" * 50)
    
    # Create controller
    kb = AsusKeyboardController()
    
    # Current state
    print("\n1. 📊 Current keyboard state")
    with open(kb.brightness_file, 'r') as f:
        current = f.read().strip()
        print(f"   Current brightness: {current}")
    
    # Test sequence
    print("\n2. 🧠 QWEN MODEL TEST")
    print("   " + "-" * 40)
    
    # Turn off all backlight
    kb.turn_off()
    time.sleep(1)
    
    # Spell "QWEN" with flashing
    kb.spell_word("QWEN", duration=0.5)
    time.sleep(1)
    
    # Flash through colors (simulated)
    print("\n   Flashing through colors for Qwen...")
    colors = [50, 150, 255, 150, 50]  # Simulated colors as brightness
    kb.flash_sequence(colors, duration=0.6)
    
    print("\n3. 🧠 DEEPSEEK MODEL TEST")
    print("   " + "-" * 40)
    
    # Turn off again
    kb.turn_off()
    time.sleep(1)
    
    # Spell "DEEPSEEK" with flashing
    kb.spell_word("DEEPSEEK", duration=0.4)
    time.sleep(1)
    
    # Flash through colors for DeepSeek
    print("\n   Flashing through colors for DeepSeek...")
    colors = [30, 100, 200, 255, 200, 100, 30]
    kb.flash_sequence(colors, duration=0.4)
    
    print("\n4. 🔄 RETURNING TO NORMAL")
    print("   " + "-" * 40)
    
    # Return to flowing color wave
    kb.color_wave(cycles=2, speed=0.05)
    
    # Set to medium brightness
    kb.turn_on(brightness=kb.max_brightness // 3)
    
    print("\n✅ TEST COMPLETE!")
    print(f"   Keyboard set to normal mode (brightness: {kb.max_brightness // 3})")

if __name__ == "__main__":
    # Check if running as root (needed for hardware access)
    if os.geteuid() != 0:
        print("⚠️  This script needs root permissions for hardware access")
        print("   Running with sudo...")
        os.execvp("sudo", ["sudo", "python3"] + sys.argv)
    else:
        main()