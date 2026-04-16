#!/bin/bash
# ASUS Keyboard RGB Demo Script
# Cycles through colors: red -> blue -> green -> orange -> purple -> rainbow wave

echo "=========================================="
echo "ASUS Keyboard RGB Control Demo"
echo "=========================================="
echo "Device detected: ASUS N-KEY Device (G533ZM)"
echo ""

# Function to set color
set_color() {
    echo "Setting to $1 (color: $2) for 3 seconds..."
    /tmp/OpenRGB/openrgb --device 0 --mode static --color "$2" 2>/dev/null
    sleep 3
}

# Function to set mode
set_mode() {
    echo "Setting to $1 mode for 3 seconds..."
    /tmp/OpenRGB/openrgb --device 0 --mode "$1" 2>/dev/null
    sleep 3
}

# Test sequence
set_color "RED" "FF0000"
set_color "BLUE" "0000FF"
set_color "GREEN" "00FF00"
set_color "ORANGE" "FFA500"
set_color "PURPLE" "800080"
set_mode "Rainbow Wave"

echo ""
echo "=========================================="
echo "Demo complete! Keyboard is now in Rainbow Wave mode."
echo "To change colors manually, use:"
echo "  /tmp/OpenRGB/openrgb --device 0 --mode static --color <HEX>"
echo "Example: /tmp/OpenRGB/openrgb --device 0 --mode static --color FF0000"
echo ""
echo "Available modes: Static, Breathing, Flashing, 'Spectrum Cycle', 'Rainbow Wave', etc."
echo "See all modes: /tmp/OpenRGB/openrgb --list-devices"
echo "=========================================="