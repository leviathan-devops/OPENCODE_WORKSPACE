package main

import (
	"encoding/binary"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"

	vosk "github.com/alphacep/vosk-api/go"
	"github.com/gordonklaus/portaudio"
)

// AudioCapture handles audio recording
type AudioCapture struct {
	mu           sync.Mutex
	recording    bool
	model        *vosk.VoskModel
	rec          *vosk.VoskRecognizer
	hardwareRate float64
	resamplePos  float64
	lastSample   int16
	audioBuffer  [][]int16
}

// NewAudioCapture creates audio capture
func NewAudioCapture() (*AudioCapture, error) {
	if err := portaudio.Initialize(); err != nil {
		return nil, fmt.Errorf("PortAudio init error: %v", err)
	}

	hardwareRate, err := detectSampleRate()
	if err != nil {
		portaudio.Terminate()
		return nil, fmt.Errorf("failed to detect sample rate: %v", err)
	}
	log.Printf("Using hardware sample rate: %.0f Hz", hardwareRate)

	modelPath := "/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15"
	model, err := vosk.NewModel(modelPath)
	if err != nil {
		portaudio.Terminate()
		return nil, fmt.Errorf("Failed to load Vosk model: %v", err)
	}

	rec, err := vosk.NewRecognizer(model, 16000.0)
	if err != nil {
		model.Free()
		portaudio.Terminate()
		return nil, fmt.Errorf("Failed to create recognizer: %v", err)
	}
	rec.SetMaxAlternatives(1)
	rec.SetWords(1)

	ac := &AudioCapture{
		model:        model,
		rec:          rec,
		hardwareRate: hardwareRate,
		audioBuffer:  make([][]int16, 0),
	}
	return ac, nil
}

// StartRecording begins audio capture
func (ac *AudioCapture) StartRecording() error {
	ac.mu.Lock()
	defer ac.mu.Unlock()

	if ac.recording {
		return fmt.Errorf("already recording")
	}
	ac.recording = true
	ac.audioBuffer = make([][]int16, 0) // Clear buffer

	go ac.captureAudio()
	return nil
}

// StopRecording stops audio capture
func (ac *AudioCapture) StopRecording() error {
	ac.mu.Lock()
	defer ac.mu.Unlock()

	if !ac.recording {
		return fmt.Errorf("not recording")
	}
	ac.recording = false
	return nil
}

// captureAudio runs in a goroutine
func (ac *AudioCapture) captureAudio() {
	defer func() {
		ac.mu.Lock()
		ac.recording = false
		ac.mu.Unlock()
		log.Println("Audio capture stopped")
		notify("Voice-to-Text", "Recording stopped")
	}()

	notify("Voice-to-Text", "Recording started... Speak now")

	in := make([]int16, 1024)
	stream, err := portaudio.OpenDefaultStream(1, 0, ac.hardwareRate, len(in), in)
	if err != nil {
		log.Printf("Audio stream error: %v", err)
		return
	}
	defer stream.Close()

	if err := stream.Start(); err != nil {
		log.Printf("Audio start error: %v", err)
		return
	}

	ac.mu.Lock()
	recording := ac.recording
	ac.mu.Unlock()

	log.Printf("Audio capture started at %.0f Hz", ac.hardwareRate)

	for recording {
		if err := stream.Read(); err != nil {
			log.Printf("Audio read error: %v", err)
			break
		}

		// Resample and store
		resampled := ac.resampleBuffer(in)
		if len(resampled) > 0 {
			ac.mu.Lock()
			ac.audioBuffer = append(ac.audioBuffer, resampled)
			// Keep only last 10 seconds
			if len(ac.audioBuffer) > 100 {
				ac.audioBuffer = ac.audioBuffer[len(ac.audioBuffer)-100:]
			}
			ac.mu.Unlock()
		}

		ac.mu.Lock()
		recording = ac.recording
		ac.mu.Unlock()
	}

	stream.Stop()

	// Transcribe after recording stops
	ac.transcribeRecordedAudio()
}

// transcribeRecordedAudio transcribes the buffered audio
func (ac *AudioCapture) transcribeRecordedAudio() {
	ac.mu.Lock()
	defer ac.mu.Unlock()

	if len(ac.audioBuffer) == 0 {
		log.Println("No audio recorded")
		return
	}

	// Combine audio
	var allAudio []int16
	for _, buf := range ac.audioBuffer {
		allAudio = append(allAudio, buf...)
	}

	if len(allAudio) == 0 {
		log.Println("Empty audio buffer")
		return
	}

	log.Printf("Transcribing %d samples (%.1f seconds)", len(allAudio), float64(len(allAudio))/16000.0)

	// Save to file
	audioFile := "/tmp/voice-recorded.wav"
	if err := saveWavFile(audioFile, allAudio, 16000); err != nil {
		log.Printf("Failed to save WAV file: %v", err)
		return
	}
	defer os.Remove(audioFile)

	// Transcribe using Python
	text := transcribeWithPython(audioFile)
	if text == "" {
		log.Println("No transcription result")
		return
	}

	log.Printf("Transcription: %s", text)
	notify("Voice-to-Text", "Transcription: "+text)
	typeText(text + " ")
}

// transcribeWithPython transcribes a WAV file
func transcribeWithPython(audioFile string) string {
	pythonScript := fmt.Sprintf(`
import json
import wave
from vosk import Model, KaldiRecognizer

try:
    wf = wave.open('%s', 'rb')
    model = Model('/usr/local/share/voice-to-text/vosk-model-small-en-us-0.15')
    rec = KaldiRecognizer(model, wf.getframerate())
    
    text_parts = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            if 'text' in result and result['text']:
                text_parts.append(result['text'])
    
    result = json.loads(rec.FinalResult())
    if 'text' in result and result['text']:
        text_parts.append(result['text'])
    
    full_text = ' '.join(text_parts).strip()
    print(full_text)
        
except Exception:
    print("")
`, audioFile)

	cmd := exec.Command("/tmp/voice-venv/bin/python", "-c", pythonScript)
	cmd.Env = append(os.Environ(), "DISPLAY=:0")

	output, err := cmd.Output()
	if err != nil {
		log.Printf("Python transcription failed: %v", err)
		return ""
	}

	return strings.TrimSpace(string(output))
}

// saveWavFile saves audio to WAV file
func saveWavFile(filename string, audio []int16, sampleRate int) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	// WAV header
	dataSize := len(audio) * 2 // 2 bytes per sample
	file.Write([]byte("RIFF"))
	binary.Write(file, binary.LittleEndian, uint32(36+dataSize))
	file.Write([]byte("WAVE"))
	file.Write([]byte("fmt "))
	binary.Write(file, binary.LittleEndian, uint32(16))
	binary.Write(file, binary.LittleEndian, uint16(1)) // PCM
	binary.Write(file, binary.LittleEndian, uint16(1)) // mono
	binary.Write(file, binary.LittleEndian, uint32(sampleRate))
	binary.Write(file, binary.LittleEndian, uint32(sampleRate*2)) // byte rate
	binary.Write(file, binary.LittleEndian, uint16(2))            // block align
	binary.Write(file, binary.LittleEndian, uint16(16))           // bits per sample
	file.Write([]byte("data"))
	binary.Write(file, binary.LittleEndian, uint32(dataSize))

	// Audio data
	for _, sample := range audio {
		binary.Write(file, binary.LittleEndian, sample)
	}

	return nil
}

// Close cleans up
func (ac *AudioCapture) Close() {
	ac.mu.Lock()
	defer ac.mu.Unlock()

	if ac.recording {
		ac.recording = false
	}
	if ac.rec != nil {
		ac.rec.Free()
		ac.rec = nil
	}
	if ac.model != nil {
		ac.model.Free()
		ac.model = nil
	}
	portaudio.Terminate()
}

// Existing functions that need to be kept:
// detectSampleRate, resampleBuffer, applyGain, noiseGate, int16ToBytes, parseVoskResult, notify, typeText

// detectSampleRate tries common sample rates
func detectSampleRate() (float64, error) {
	rates := []float64{44100.0, 48000.0, 96000.0, 88200.0, 32000.0, 22050.0}
	for _, rate := range rates {
		in := make([]int16, 1024)
		stream, err := portaudio.OpenDefaultStream(1, 0, rate, len(in), in)
		if err == nil {
			stream.Close()
			log.Printf("Detected supported sample rate: %.0f Hz", rate)
			return rate, nil
		}
	}
	return 0, fmt.Errorf("no supported sample rate found")
}

// resampleBuffer converts audio to 16000 Hz
func (ac *AudioCapture) resampleBuffer(input []int16) []int16 {
	if len(input) == 0 {
		return nil
	}
	ratio := ac.hardwareRate / 16000.0
	outputEstimate := int(float64(len(input))/ratio) + 2
	output := make([]int16, 0, outputEstimate)

	for ac.resamplePos < float64(len(input)) {
		idx := int(ac.resamplePos)
		frac := ac.resamplePos - float64(idx)

		var current, next int16
		if idx < len(input) {
			current = input[idx]
		} else {
			current = ac.lastSample
		}
		if idx+1 < len(input) {
			next = input[idx+1]
		} else {
			next = current
		}

		interpolated := float64(current)*(1-frac) + float64(next)*frac
		if interpolated > 32767.0 {
			interpolated = 32767.0
		}
		if interpolated < -32768.0 {
			interpolated = -32768.0
		}
		output = append(output, int16(interpolated))
		ac.resamplePos += ratio
	}

	ac.lastSample = input[len(input)-1]
	ac.resamplePos -= float64(len(input))
	return output
}

// int16ToBytes converts int16 slice to bytes
func int16ToBytes(s []int16) []byte {
	buf := make([]byte, len(s)*2)
	for i, v := range s {
		buf[i*2] = byte(v)
		buf[i*2+1] = byte(v >> 8)
	}
	return buf
}

// notify sends desktop notification
func notify(title, message string) {
	log.Printf("Notification: %s - %s", title, message)
	cmd := exec.Command("notify-send", title, message)
	cmd.Env = append(os.Environ(), "DISPLAY=:0")
	if err := cmd.Run(); err != nil {
		log.Printf("Failed to send notification: %v", err)
	}
}

// typeText types text into active window
func typeText(text string) {
	if text == "" {
		return
	}
	cleanText := strings.TrimSpace(text)
	cleanText = strings.ReplaceAll(cleanText, "\n", " ")
	cleanText = strings.Join(strings.Fields(cleanText), " ")

	if cleanText == "" {
		return
	}

	log.Printf("Typing text: %s", cleanText)
	cmd := exec.Command("xdotool", "type", "--clearmodifiers", cleanText)
	cmd.Env = append(os.Environ(), "DISPLAY=:0")
	if err := cmd.Run(); err != nil {
		log.Printf("Failed to type text: %v", err)
	}
}
