package test

import (
	"testing"
)

func TestBasic(t *testing.T) {
	// Basic sanity test
	if 1+1 != 2 {
		t.Error("Math is broken")
	}
}
