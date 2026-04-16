package main

import (
	"fmt"
	hook "github.com/robotn/gohook"
)

func main() {
	fmt.Printf("hook.KeyDown = %v\n", hook.KeyDown)
	fmt.Printf("hook.KeyUp = %v\n", hook.KeyUp)
	fmt.Printf("hook.KeyHold = %v\n", hook.KeyHold)
}
