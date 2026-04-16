package test

import (
	"testing"
	"time"
)

// Mock the keyboard hook to test double press logic
type mockKeyboardHook struct {
	lastPress   time.Time
	doublePress chan struct{}
}

func (m *mockKeyboardHook) handleCtrlPress() {
	now := time.Now()
	if !m.lastPress.IsZero() && now.Sub(m.lastPress) < 300*time.Millisecond {
		// Double press detected
		select {
		case m.doublePress <- struct{}{}:
		default:
		}
		m.lastPress = time.Time{}
	} else {
		m.lastPress = now
	}
}

func TestDoublePressDetection(t *testing.T) {
	m := &mockKeyboardHook{
		doublePress: make(chan struct{}, 1),
	}

	// First press
	m.handleCtrlPress()
	// Wait less than 300ms
	time.Sleep(100 * time.Millisecond)
	// Second press - should trigger double press
	m.handleCtrlPress()

	select {
	case <-m.doublePress:
		// Success
	default:
		t.Error("Expected double press event")
	}

	// Test that two presses more than 300ms apart do not trigger
	m.handleCtrlPress()
	time.Sleep(400 * time.Millisecond)
	m.handleCtrlPress()
	select {
	case <-m.doublePress:
		t.Error("Should not trigger double press when >300ms apart")
	default:
		// Expected
	}
}

func TestDoublePressResetAfterTrigger(t *testing.T) {
	m := &mockKeyboardHook{
		doublePress: make(chan struct{}, 1),
	}

	// Trigger double press
	m.handleCtrlPress()
	time.Sleep(100 * time.Millisecond)
	m.handleCtrlPress()

	// After double press, the next press should be considered first press again
	m.handleCtrlPress()
	time.Sleep(100 * time.Millisecond)
	m.handleCtrlPress()
	// Should trigger another double press
	select {
	case <-m.doublePress:
		// Success
	default:
		t.Error("Expected second double press event")
	}
}
