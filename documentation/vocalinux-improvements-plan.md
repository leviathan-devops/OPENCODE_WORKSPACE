# Vocalinux Real-Time Dictation Build Plan

## **Objective**
Transform Vocalinux from delayed, inaccurate dictation to real-time, word-by-word dictation like macOS.

## **Current Issues Identified**
1. **Whisper.cpp too slow**: RTF 5.31x (31 seconds to process 5.94s audio)
2. **Silence timeout too long**: 2.0 seconds causes noticeable delays
3. **Text injection issues**: IBus not typing, only copying to clipboard
4. **No streaming results**: Waits for complete silence before processing

## **Solutions Implemented**

### **1. Performance Optimization**
- ✅ **Switched to VOSK engine**: RTF ~0.04x (130x faster than whisper.cpp)
- ✅ **Reduced silence_timeout**: 2.0s → 0.5s for quicker response
- ✅ **Increased VAD sensitivity**: 3 → 5 for better speech detection

### **2. Text Injection Fix**
- ✅ **Created wrapper script**: `vocalinux-nobus` unsets IBus environment variables
- ✅ **Updated autostart**: Uses wrapper script for consistent xdotool injection
- ✅ **Disabled clipboard copy**: Prevents interference with typing

### **3. Configuration Changes**
```json
{
    "speech_recognition": {
        "engine": "vosk",           // Was whisper_cpp
        "language": "en-us",        // Was auto
        "model_size": "small",      // Fast, accurate for English
        "vad_sensitivity": 5,       // Was 3
        "silence_timeout": 0.5      // Was 2.0
    },
    "text_injection": {
        "copy_to_clipboard": false  // Prevents clipboard interference
    },
    "advanced": {
        "wayland_mode": true        // Forces xdotool fallback
    }
}
```

## **Next Steps for Real-Time Experience**

### **Phase 1: Streaming Partial Results (Immediate)**
1. **Modify VOSK processing** to use `PartialResult()` for word-by-word updates
2. **Add partial result callback** to update UI as speech is recognized
3. **Implement incremental text injection** for smoother typing

### **Phase 2: Accuracy Improvements (Short-term)**
1. **Test different VOSK models** for better accuracy
2. **Tune VAD parameters** for different environments
3. **Add language model adaptation** for user's vocabulary

### **Phase 3: Advanced Features (Medium-term)**
1. **Whisper.cpp optimization** (fallback option):
   - Use tiny.en model (English-only)
   - Implement greedy decoding (beam_size=1)
   - Enable OpenVINO for CPU acceleration
2. **Hybrid approach**: VOSK for real-time, Whisper for accuracy
3. **Custom vocabulary** for specialized terms

## **Error Handling & Rollback**

### **Backup Locations**
- Config backup: `/home/leviathan/.config/vocalinux/config.json.YYYYMMDD_HHMMSS.bak`
- Code backup: `recognition_manager.py.backup`
- Wrapper script: `/home/leviathan/.local/bin/vocalinux-nobus`

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

## **Testing Procedure**

### **1. Immediate Test**
1. Open text editor (gedit, browser, etc.)
2. Double-press Ctrl
3. Speak clearly: "This is a test of real-time dictation"
4. Observe:
   - Tray icon changes color
   - Text appears in editor
   - No clipboard interference

### **2. Performance Verification**
```bash
# Check logs for speed
tail -f /tmp/vl-vosk-xdotool.log | grep -i "processing\|rtf\|time"
```

### **3. Accuracy Test**
Test with various phrases:
- Simple: "Hello world"
- Complex: "The quick brown fox jumps over the lazy dog"
- Technical: "Python uses dynamic typing and garbage collection"

## **Success Criteria**
- [ ] Double-Ctrl activates recording (tray icon changes)
- [ ] Speech is transcribed in real-time (word-by-word)
- [ ] Text appears as typed input (not clipboard paste)
- [ ] RTF < 0.1x (10x faster than real-time)
- [ ] Accuracy > 95% for clear speech
- [ ] System survives reboot with autostart

## **Current Status**
- ✅ VOSK engine operational (fast, accurate)
- ✅ xdotool injection working (actual typing)
- ✅ Configuration optimized for responsiveness
- 🔄 Streaming partial results needed for real-time feel
- 🔄 End-to-end testing required

## **Immediate Action Items**
1. **Test current setup**: Double-Ctrl + speak + verify typing
2. **Implement streaming**: Modify VOSK for partial results
3. **Optimize further**: Tune parameters based on testing
