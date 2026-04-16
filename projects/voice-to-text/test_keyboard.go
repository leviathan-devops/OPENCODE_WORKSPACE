package main

import (
	"fmt"

	hook "github.com/robotn/gohook"
)

func main() {
	fmt.Println("Testing keyboard hook...")

	// Start the hook
	evChan := hook.Start()
	defer hook.End()

	fmt.Println("Hook started. Press any key (Ctrl twice for test)...")

	// Listen for events
	for ev := range evChan {
		if ev.Kind == hook.KeyDown {
			fmt.Printf("Key pressed: keycode=%d rawcode=%d keychar=%v\n", ev.Keycode, ev.Rawcode, ev.Keychar)

			// Check for Ctrl
			if ev.Rawcode == 65507 || ev.Rawcode == 65508 || ev.Rawcode == 65515 {
				fmt.Println("Ctrl key detected!")
			}
		}
	}
}
