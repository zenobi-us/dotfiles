//go:build hostfixture

// Separate synthetic executable. Never included in either production binary.
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

func main() {
	root, err := os.MkdirTemp("", "pi-ink-cleanup-synthetic-")
	if err != nil {
		panic("fixture creation failed")
	}
	defer os.RemoveAll(root)
	for _, p := range []string{"tmp", "tmp/owned"} {
		if os.Mkdir(filepath.Join(root, p), 0700) != nil {
			panic("fixture directory failed")
		}
	}
	var targets []target
	for _, item := range []struct{ name, body, action string }{{"key.pem", "synthetic-key", "unlink_regular_file"}, {"owner.txt", "synthetic-owner", "unlink_marker_last_if_no_retained_children"}} {
		p := "/tmp/owned/" + item.name
		if os.WriteFile(root+p, []byte(item.body), 0600) != nil {
			panic("fixture write failed")
		}
		hash := sha256.Sum256([]byte(item.body))
		targets = append(targets, target{Path: p, Action: item.action, Mode: 0600, UID: uint32(os.Getuid()), GID: uint32(os.Getgid()), Size: int64(len(item.body)), SHA: hex.EncodeToString(hash[:]), Cap: 65536})
	}
	targets = append(targets, target{Path: "/tmp/owned", Action: "rmdir_if_empty_after_marker_disposition", Mode: 0700, UID: uint32(os.Getuid()), GID: uint32(os.Getgid())})
	if os.WriteFile(root+"/tmp/owned/state.json", []byte("opaque-retained"), 0600) != nil {
		panic("fixture state failed")
	}
	fd, err := syscall.Open(root, nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		panic("fixture root failed")
	}
	c, err := newCleanup(fd, targets, os.Stdout, func() error { return nil }, uint32(os.Getuid()))
	if err != nil {
		panic("fixture setup failed")
	}
	if c.run(true) != nil {
		panic("fixture apply failed")
	}
	if _, err = os.Lstat(root + "/tmp/owned/key.pem"); !os.IsNotExist(err) {
		panic("eligible file retained")
	}
	if _, err = os.Lstat(root + "/tmp/owned/owner.txt"); err != nil {
		panic("supporting marker removed")
	}
	state, err := os.ReadFile(root + "/tmp/owned/state.json")
	if err != nil || string(state) != "opaque-retained" {
		panic("opaque state changed")
	}
	fmt.Println("HOST_SYNTHETIC_APPLY_PASS_NO_REAL_TARGET_ACCESS")
}
