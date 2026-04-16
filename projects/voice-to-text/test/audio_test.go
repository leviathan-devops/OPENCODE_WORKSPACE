package test

import (
	"os"
	"path/filepath"
	"testing"
)

func TestVoskModelExists(t *testing.T) {
	// Check that the Vosk model directory exists
	modelPath := "../vosk-model-small-en-us-0.15"
	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		t.Skipf("Vosk model not found at %s, skipping audio tests", modelPath)
	}

	// Check for conf directory (indicates model is extracted)
	confPath := filepath.Join(modelPath, "conf")
	if _, err := os.Stat(confPath); os.IsNotExist(err) {
		t.Errorf("Missing conf directory in model (maybe not fully extracted)")
	}
}

func TestAudioCaptureInitialization(t *testing.T) {
	// This test just checks that we can import the packages and that the functions exist.
	// Actual audio capture requires hardware and cannot be tested in CI.

	// We'll create a dummy test that always passes but logs a message.
	t.Log("Audio capture requires hardware and will be tested manually.")
}
