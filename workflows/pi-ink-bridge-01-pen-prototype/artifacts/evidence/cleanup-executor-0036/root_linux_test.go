// A writable anchor must fail before the engine can read or unlink targets.
package main

import (
	"io"
	"os"
	"syscall"
	"testing"
)

func TestWritableAnchorIsRefusedBeforeCleanup(t *testing.T) {
	f := setupFixture(t)
	if err := os.Chmod(f.root, 0777); err != nil {
		t.Fatal(err)
	}
	fd, err := syscall.Open(f.root, nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer syscall.Close(fd)
	_, err = newCleanup(fd, f.targets, io.Discard, noActor, uint32(os.Getuid()))
	if err == nil {
		t.Fatal("writable cleanup anchor accepted")
	}
	if !exists(f.root+"/tmp/owned/key.pem") || !exists(f.root+"/tmp/owned/owner.txt") {
		t.Fatal("root refusal mutated fixture")
	}
}

func TestWritableTemporaryParentRequiresStickyBit(t *testing.T) {
	for _, sticky := range []bool{false, true} {
		f := setupFixture(t)
		mode := os.FileMode(0777)
		if sticky {
			mode |= os.ModeSticky
		}
		if err := os.Chmod(f.root+"/tmp", mode); err != nil {
			t.Fatal(err)
		}
		err := f.run(t, true, noActor, nil)
		if sticky {
			if err != nil || exists(f.root+"/tmp/owned") {
				t.Fatal("safe sticky temporary parent refused", err)
			}
		} else if err == nil || !exists(f.root+"/tmp/owned/key.pem") {
			t.Fatal("unsafe temporary parent permitted cleanup")
		}
	}
}
