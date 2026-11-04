//go:build hostfixture && amd64

// A separate host-only synthetic smoke executable. Never stage this binary.
package main

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

func main() {
	root, err := os.MkdirTemp("", "pi-ink-offline-synthetic-")
	check(err)
	defer os.RemoveAll(root)
	for _, dir := range []string{"home", "home/root", "home/root/pi-ink-sidebar-stage-0020", "home/root/pi-ink-sidebar-backup-0020"} {
		check(os.Mkdir(filepath.Join(root, dir), 0700))
	}
	marker := []byte("host-smoke-synthetic-owner\n")
	for i, dir := range []string{"pi-ink-sidebar-stage-0020", "pi-ink-sidebar-backup-0020"} {
		mode := os.FileMode(0600)
		if i == 0 {
			mode = 0644
		}
		check(os.WriteFile(filepath.Join(root, "home/root", dir, "owner.txt"), marker, mode))
		check(os.WriteFile(filepath.Join(root, "home/root", dir, "config.json"), []byte("HOST_SMOKE_PRIVATE_SYNTHETIC_ONLY"), 0600))
	}
	fd, err := syscall.Open(root, directoryFlags, 0)
	check(err)
	var output bytes.Buffer
	r := reader{uid: uint32(os.Getuid()), gid: uint32(os.Getgid()), anchor: root, expected: fmt.Sprintf("%x", sha256.Sum256(marker)), out: &output}
	code := r.run(fd)
	expected := fmt.Sprintf("%x", sha256.Sum256([]byte("HOST_SMOKE_PRIVATE_SYNTHETIC_ONLY")))
	if code != 0 || strings.Count(output.String(), "SHA256="+expected+"\n") != 2 || strings.Contains(output.String(), "HOST_SMOKE_PRIVATE_SYNTHETIC_ONLY") {
		panic("synthetic smoke refused or leaked")
	}
	fmt.Print(output.String())
	fmt.Println("HOST_SYNTHETIC_SMOKE_PASS_NOT_DEVICE_EVIDENCE")
}
func check(err error) {
	if err != nil {
		panic("HOST_FIXTURE_SETUP_REFUSED")
	}
}
