# DEBUG LOG: LG Display 200% Zoom / Aspect Ratio Broken

**Date:** 2026-04-14  
**Symptom:** 2nd display (LG Electronics 24" via HDMI) appeared 200% zoomed into top-left corner, unusable in extended mode. Mirroring worked fine. Disabling fractional scaling fixed main display but not the LG.

**Root Cause:** GNOME monitors.xml misconfigured after Win+P shortcut
- HDMI-1-0 was positioned at x=0 (wrong)
- eDP-1 (laptop) was positioned at x=1920 (backwards/inverted)
- Leftover scale=1.25 in secondary configuration
- This caused the LG display to render from wrong origin with incompatible scaling

**Diagnosis Commands:**
```bash
xrandr --listmonitors
xrandr | grep HDMI
cat ~/.config/monitors.xml
```

**Fix Applied:**
1. Backed up ~/.config/monitors.xml
2. Rewrote monitors.xml with correct layout:
   - eDP-1 (laptop) at x=0, primary=yes, scale=1
   - HDMI-1-0 (LG) at x=1920, primary=no, scale=1
3. Reset display state via xrandr

**Files Modified:**
- /home/leviathan/.config/monitors.xml (rewritten)

**Resolution:** LG display now renders correctly at 1920x1080 in extended mode to the right of the laptop display.