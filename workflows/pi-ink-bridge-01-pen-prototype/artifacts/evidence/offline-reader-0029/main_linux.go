//go:build !hostfixture

// Fixed production entry. Fixture support is a different host-only executable.
package main

import (
	"fmt"
	"os"
	"syscall"
)

func main() {
	if len(os.Args) != 1 {
		fmt.Println("REFUSAL ARGUMENTS")
		os.Exit(1)
	}
	root, err := syscall.Open("/", directoryFlags, 0)
	if err != nil {
		fmt.Println("REFUSAL ROOT_OPEN")
		os.Exit(1)
	}
	reader := reader{uid: 0, gid: 0, anchor: "/", expected: markerDigest, out: os.Stdout}
	os.Exit(reader.run(root))
}
