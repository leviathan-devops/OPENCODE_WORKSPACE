# Vocalinux Real-Time Dictation - Final Build Plan

## **Status Summary**

### **✅ Completed Improvements**
1. **Performance**: Switched from whisper.cpp (RTF 5.31x) to VOSK (RTF ~0.04x) - **130x faster**
2. **Responsiveness**: Reduced silence_timeout from 2.0 to 0.5 seconds
3. **Text Injection**: Fixed to use xdotool (actual typing) instead of IBus/clipboard
4. **Configuration**: Optimized for real-time dictation
5. **Environment**: Created wrapper script to bypass IBus environment variables

### **🔄 In Progress**
1. **Streaming partial results**: VOSK supports partial results but needs implementation
2. **End-to-end testing**: Need to verify full functionality

### **⚠️ Known Issues**
1. **IBus daemon still running**: May interfere with xdotool injection
2. **No word-by-word display**: Need to implement streaming for real-time feel

## **Immediate Actions Required**

### **1. Stop IBus Daemon**
```bash
# Stop IBus daemon to ensure xdotool injection
pkill -f ibus-daemon

# Verify it's stopped
pgrep -x ibus-daemon || echo "IBus daemon stopped"
```

### **2. Test Current Setup**
1. Open text editor (gedit, browser, etc.)
2. Double-press Ctrl
3. Speak clearly: "This is a test of real-time dictation"
4. Verify:
   - Tray icon changes color
   - Text appears in editor (typed, not pasted)
   - No clipboard interference

### **3. Check Logs for Success**
```bash
# Check for xdotool injection
grep -i "xdotool" /tmp/vl-vosk-xdotool.log

# Check for transcription results
grep -i "transcrib\|result\|text" /tmp/vl-vosk-xdotool.log
```

## **Build Plan for Real-Time Experience**

### **Phase 1: Immediate Fixes (Today)**
1. **Stop IBus daemon** to ensure xdotool injection
2. **Test end-to-end functionality**
3. **Verify text appears as typed input**

### **Phase 2: Streaming Implementation (This Week)**
1. **Modify VOSK processing** to use `PartialResult()` for word-by-word updates
2. **Add partial result callback** to update UI as speech is recognized
3. **Implement incremental text injection** for smoother typing

### **Phase 3: Optimization (Next Week)**
1. **Tune VAD parameters** for different environments
2. **Test different VOSK models** for better accuracy
3. **Add custom vocabulary** for specialized terms

## **Error Handling & Rollback**

### **Backup Locations**
- Config: `/home/leviathan/.config/vocalinux/config.json.*.bak`
- Code: `recognition_manager.py.backup`
- Wrapper: `/home/leviathan/.local/bin/vocalinux-nobus`

### **Rollback Procedure**
```bash
# Restore config
cp ~/.config/vocalinux/config.json.*.bak ~/.config/vocalinux/config.json

# Restore code
cp ~/.local/share/vocalinux/venv/lib/python3.12/site-packages/vocalinux/speech_recognition/recognition_manager.py.backup \
   ~/.local/share/vocalinux/venv/lib/python3.12/site-packages/vocalinux/speech_recognition/recognition_manager.py

# Restart
pkill -f vocalinux
nohup /home/leviathan/.local/bin/vocalinux-nobus --debug &>/tmp/vocalinux.log &
```

## **Success Criteria**
- [ ] Double-Ctrl activates recording (tray icon changes)
- [ ] Speech is transcribed in real-time (word-by-word)
- [ ] Text appears as typed input (not clipboard paste)
- [ ] RTF < 0.1x (10x faster than real-time)
- [ ] Accuracy > 95% for clear speech
- [ ] System survives reboot with autostart

## **Current Configuration**
```json
{
    "speech_recognition": {
        "engine": "vosk",
        "language": "en-us",
        "model_size": "small",
        "vad_sensitivity": 5,
        "silence_timeout": 0.5
    },
    "text_injection": {
        "copy_to_clipboard": false
    },
    "advanced": {
        "wayland_mode": true
    }
}
```

## **Testing Commands**
```bash
# Check Vocalinux status
ps aux | grep vocalinux

# Monitor logs
tail -f /tmp/vl-vosk-xdotool.log

# Test injection method
grep -i "xdotool\|injection" /tmp/vl-vosk-xdotool.log

# Check performance
grep -i "rtf\|time\|processing" /tmp/vl-vosk-xdotool.log
```

## **Next Steps**
1. **Stop IBus daemon**: `pkill -f ibus-daemon`
2. **Test functionality**: Double-Ctrl + speak + verify typing
3. **Report results**: What works, what doesn't
4. **Implement streaming**: For real-time word-by-word display

## **Expected Outcome**
After stopping IBus daemon, Vocalinux should:
- Use xdotool for text injection (actual typing)
- Process speech with VOSK (fast, accurate)
- Respond within 0.5 seconds of silence
- Type text into active window (not clipboard)

**Ready for testing!**
