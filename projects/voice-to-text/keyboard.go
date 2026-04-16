package main

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	hook "github.com/robotn/gohook"
)

const (
	doublePressMaxGap = 500 * time.Millisecond // Increased from 300ms
	cooldownPeriod    = 300 * time.Millisecond // Reduced from 500ms
)

var (
	// Possible rawcodes for Ctrl keys (left and right might differ)
	ctrlRawcodes = map[int]bool{
		65507: true, // Left Ctrl (from xdotool and physical)
		65508: true, // Possible right Ctrl variant
		65515: true, // Right Ctrl (observed rawcode)
	}

	// Keycodes for Ctrl keys (left and right)
	ctrlKeycodes = map[int]bool{
		29:  true, // Left Ctrl keycode (from xdotool and physical)
		125: true, // Right Ctrl keycode (observed)
	}
)

// KeyboardHook handles global keyboard events for double Ctrl detection
type KeyboardHook struct {
	mu              sync.Mutex
	lastCtrlPress   time.Time
	lastDoublePress time.Time
	doublePress     chan struct{}
	done            chan struct{}
}

// NewKeyboardHook creates a new keyboard hook
func NewKeyboardHook() (*KeyboardHook, error) {
	kb := &KeyboardHook{
		doublePress: make(chan struct{}, 10), // Buffered channel to avoid missing events
		done:        make(chan struct{}),
	}
	return kb, nil
}

// Listen starts listening for keyboard events
func (kb *KeyboardHook) Listen() {
	log.Println("Keyboard hook: Starting...")

	s := hook.Start()
	defer hook.End()

	// Process keyboard events
	for ev := range s {
		if ev.Kind == hook.KeyDown {
			kb.handleKeyDown(ev)
		}
	}
}

func (kb *KeyboardHook) handleKeyDown(ev hook.Event) {
	// Log all key events for debugging
	log.Printf("Key pressed: keycode=%d rawcode=%d keychar=%v kind=%v", ev.Keycode, ev.Rawcode, ev.Keychar, ev.Kind)

	// Write simple status to file for easy debugging (append mode)
	statusMsg := fmt.Sprintf("[%s] keycode=%d rawcode=%d keychar=%d kind=%d\n",
		time.Now().Format("15:04:05"), ev.Keycode, ev.Rawcode, ev.Keychar, ev.Kind)
	f, err := os.OpenFile("/tmp/voice-to-text-keypress.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Failed to open keypress log: %v", err)
	} else {
		f.WriteString(statusMsg)
		f.Close()
	}

	// Also write to a separate debug file with all details
	debugMsg := fmt.Sprintf("[%s] Key: code=%d raw=%d char=%d kind=%d\n",
		time.Now().Format("15:04:05.000"), ev.Keycode, ev.Rawcode, ev.Keychar, ev.Kind)
	f2, err := os.OpenFile("/tmp/voice-to-text-keydebug.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		f2.WriteString(debugMsg)
		f2.Close()
	}

	// Check if this is a Ctrl key press using aggressive detection methods
	isCtrl := false
	reason := ""

	// Method 1: Check rawcode against known Ctrl rawcodes
	if ctrlRawcodes[int(ev.Rawcode)] {
		isCtrl = true
		reason = fmt.Sprintf("rawcode=%d in ctrlRawcodes", ev.Rawcode)
	}

	// Method 2: Check keycode against known Ctrl keycodes
	if ctrlKeycodes[int(ev.Keycode)] {
		isCtrl = true
		reason = fmt.Sprintf("keycode=%d in ctrlKeycodes", ev.Keycode)
	}

	// Method 3: Skip keychar detection (causes false positives for regular keys)
	// if ev.Keychar == 65535 {
	//	isCtrl = true
	//	reason = fmt.Sprintf("keychar=65535 indicates modifier key")
	// }

	if isCtrl {
		log.Printf("Keyboard hook: Ctrl key detected (%s)", reason)
		kb.handleCtrlPress()
	} else {
		// Log non-Ctrl keys for debugging
		log.Printf("Keyboard hook: Non-Ctrl key (rawcode=%d, keycode=%d)", ev.Rawcode, ev.Keycode)
	}
}

func (kb *KeyboardHook) handleCtrlPress() {
	kb.mu.Lock()
	defer kb.mu.Unlock()

	now := time.Now()

	// Cooldown after a double press
	if !kb.lastDoublePress.IsZero() && now.Sub(kb.lastDoublePress) < cooldownPeriod {
		log.Printf("Keyboard hook: Ignoring Ctrl press during cooldown")
		return
	}

	if !kb.lastCtrlPress.IsZero() {
		gap := now.Sub(kb.lastCtrlPress)
		log.Printf("Keyboard hook: Time since last Ctrl press: %v (max gap: %v)", gap, doublePressMaxGap)
		if gap < doublePressMaxGap {
			// Double press detected!
			log.Printf("Keyboard hook: Double Ctrl press detected!")
			kb.lastDoublePress = now
			kb.lastCtrlPress = time.Time{} // Reset

			select {
			case kb.doublePress <- struct{}{}:
				log.Printf("Keyboard hook: Sent double press event")
			default:
				log.Printf("Keyboard hook: Channel busy, skipping event")
			}
		} else {
			// Too slow, treat as new first press
			log.Printf("Keyboard hook: First Ctrl press (previous was too slow: %v)", gap)
			kb.lastCtrlPress = now
		}
	} else {
		// First press
		log.Printf("Keyboard hook: First Ctrl press")
		kb.lastCtrlPress = now
	}
}

// DoublePress returns a channel that receives events on double Ctrl press
func (kb *KeyboardHook) DoublePress() <-chan struct{} {
	return kb.doublePress
}

// Close stops the keyboard hook
func (kb *KeyboardHook) Close() {
	close(kb.done)
}
