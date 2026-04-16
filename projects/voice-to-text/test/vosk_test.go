package test

import (
	"testing"
)

// This test would require loading the Vosk model and recognizer.
// Since that's a heavy operation, we'll skip it in unit tests and rely on integration tests.
func TestVoskRecognizerCreation(t *testing.T) {
	t.Skip("Skipping Vosk recognizer creation test - requires full integration test environment")
}

func TestSpeechRecognition(t *testing.T) {
	t.Skip("Skipping speech recognition test - requires audio hardware and model")
}
