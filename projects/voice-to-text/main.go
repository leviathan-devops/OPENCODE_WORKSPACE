package main

import (
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
)

func main() {
	// Get the directory where this executable is located
	exePath, err := os.Executable()
	if err != nil {
		log.Fatalf("Failed to get executable path: %v", err)
	}
	exeDir := filepath.Dir(exePath)
	scriptPath := filepath.Join(exeDir, "simple_voice_to_text.sh")

	// Notify user that application is ready
	log.Println("Voice-to-Text is ready. Double-press Ctrl to start recording.")
	notify("Voice-to-Text", "Ready! Double-press Ctrl to start recording.")

	// Run the shell script when Ctrl is double-pressed
	// The script handles everything: detection, recording, transcription, typing
	cmd := exec.Command(scriptPath)
	cmd.Env = append(os.Environ(), "DISPLAY=:0")

	if err := cmd.Run(); err != nil {
		log.Printf("Script execution failed: %v", err)
	}

	// Wait for interrupt signal to exit gracefully
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt)
	<-sigChan
	log.Println("Shutting down...")
}
