// All mutations in these tests stay under testing.T temporary roots.
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
)

type fixture struct {
	root    string
	targets []target
	out     bytes.Buffer
}

func setupFixture(t *testing.T) *fixture {
	t.Helper()
	f := &fixture{root: t.TempDir()}
	for _, p := range []string{"tmp", "tmp/owned", "tmp/owned/nested"} {
		if err := os.Mkdir(filepath.Join(f.root, p), 0700); err != nil {
			t.Fatal(err)
		}
	}
	f.add(t, "/tmp/owned/key.pem", "synthetic-private-key", 0600, "unlink_regular_file")
	f.add(t, "/tmp/owned/nested/code", "synthetic-code", 0600, "unlink_regular_file")
	f.add(t, "/tmp/owned/owner.txt", "synthetic-owner", 0600, "unlink_marker_last_if_no_retained_children")
	f.targets = append(f.targets, target{Path: "/tmp/owned/nested", Action: "rmdir_if_empty", Mode: 0700, UID: uint32(os.Getuid()), GID: uint32(os.Getgid())}, target{Path: "/tmp/owned", Action: "rmdir_if_empty_after_marker_disposition", Mode: 0700, UID: uint32(os.Getuid()), GID: uint32(os.Getgid())})
	return f
}
func (f *fixture) add(t *testing.T, p, body string, mode uint32, action string) {
	t.Helper()
	if err := os.WriteFile(f.root+p, []byte(body), os.FileMode(mode)); err != nil {
		t.Fatal(err)
	}
	h := sha256.Sum256([]byte(body))
	f.targets = append(f.targets, target{Path: p, Action: action, Mode: mode, UID: uint32(os.Getuid()), GID: uint32(os.Getgid()), Size: int64(len(body)), SHA: hex.EncodeToString(h[:]), Cap: 65536})
}
func (f *fixture) run(t *testing.T, apply bool, guard func() error, hook func(string)) error {
	t.Helper()
	fd, err := syscall.Open(f.root, nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		t.Fatal(err)
	}
	c, err := newCleanup(fd, f.targets, &f.out, guard, uint32(os.Getuid()))
	if err != nil {
		t.Fatal(err)
	}
	c.mutationHook = hook
	return c.run(apply)
}
func noActor() error       { return nil }
func exists(p string) bool { _, err := os.Lstat(p); return err == nil }

func TestRealApplyRemovesFilesThenMarkersAndDirectories(t *testing.T) {
	f := setupFixture(t)
	if err := f.run(t, true, noActor, nil); err != nil {
		t.Fatal(err)
	}
	if exists(f.root + "/tmp/owned") {
		t.Fatal("owned directory retained despite empty eligible disposition")
	}
	log := f.out.String()
	if strings.Index(log, "REMOVED_FILE /tmp/owned/key.pem") > strings.Index(log, "REMOVED_FILE /tmp/owned/owner.txt") {
		t.Fatal("marker removed first")
	}
	if !strings.Contains(log, "FIXED_MANIFEST_SIDE_COMPLETE") {
		t.Fatal(log)
	}
}
func TestCheckDoesNotUnlink(t *testing.T) {
	f := setupFixture(t)
	if err := f.run(t, false, noActor, nil); err != nil {
		t.Fatal(err)
	}
	if !exists(f.root+"/tmp/owned/key.pem") || strings.Contains(f.out.String(), "REMOVED_") {
		t.Fatal("check mutated fixture")
	}
}
func TestEntirePreflightPrecedesFirstUnlink(t *testing.T) {
	f := setupFixture(t)
	f.targets[1].SHA = strings.Repeat("0", 64)
	if f.run(t, true, noActor, nil) == nil {
		t.Fatal("bad hash accepted")
	}
	if !exists(f.root+"/tmp/owned/key.pem") || strings.Contains(f.out.String(), "REMOVED_") {
		t.Fatal("partial mutation before preflight")
	}
}
func TestBoundaryRefusalsPreserveEveryFile(t *testing.T) {
	for _, scenario := range []string{"leaf-symlink", "parent-symlink", "wrong-mode", "wrong-owner", "wrong-group", "fifo", "missing", "size", "hash-cap"} {
		t.Run(scenario, func(t *testing.T) {
			f := setupFixture(t)
			p := f.root + "/tmp/owned/key.pem"
			switch scenario {
			case "leaf-symlink":
				os.Remove(p)
				os.Symlink("nested/code", p)
			case "parent-symlink":
				os.Rename(f.root+"/tmp/owned/nested", f.root+"/tmp/real")
				os.Symlink("../real", f.root+"/tmp/owned/nested")
			case "wrong-mode":
				os.Chmod(p, 0644)
			case "wrong-owner":
				f.targets[0].UID++
			case "wrong-group":
				f.targets[0].GID++
			case "fifo":
				os.Remove(p)
				if err := syscall.Mkfifo(p, 0600); err != nil {
					t.Fatal(err)
				}
			case "missing":
				os.Remove(p)
			case "size":
				f.targets[0].Size++
			case "hash-cap":
				f.targets[0].Cap = 1
			}
			if f.run(t, true, noActor, nil) == nil {
				t.Fatal("unsafe fixture accepted")
			}
			if !exists(f.root+"/tmp/owned/owner.txt") || strings.Contains(f.out.String(), "REMOVED_") {
				t.Fatal("mutation on refusal")
			}
		})
	}
}
func TestUnknownAndOpaqueContentKeepsMarkerAndRoot(t *testing.T) {
	f := setupFixture(t)
	secret := "preserve-opaque-do-not-hash"
	os.WriteFile(f.root+"/tmp/owned/state.json", []byte(secret), 0600)
	os.Symlink("/unreadable-private-content", f.root+"/tmp/owned/unknown")
	if err := f.run(t, true, noActor, nil); err != nil {
		t.Fatal(err)
	}
	body, err := os.ReadFile(f.root + "/tmp/owned/state.json")
	if err != nil || string(body) != secret {
		t.Fatal("opaque state changed")
	}
	if !exists(f.root+"/tmp/owned/owner.txt") || !exists(f.root+"/tmp/owned/unknown") {
		t.Fatal("ownership or unknown content removed")
	}
	if strings.Contains(f.out.String(), secret) || strings.Contains(f.out.String(), "unknown") {
		t.Fatal("unlisted contents disclosed")
	}
	if exists(f.root + "/tmp/owned/key.pem") {
		t.Fatal("eligible file not removed")
	}
}
func TestExplicitPreserveDoesNotReadOpaqueFIFO(t *testing.T) {
	f := setupFixture(t)
	p := f.root + "/tmp/owned/state.json"
	if err := syscall.Mkfifo(p, 0600); err != nil {
		t.Fatal(err)
	}
	f.targets = append(f.targets, target{Path: "/tmp/owned/state.json", Action: "preserve"})
	if err := f.run(t, true, noActor, nil); err != nil {
		t.Fatal(err)
	}
	if !exists(p) {
		t.Fatal("opaque state removed")
	}
}
func TestActiveActorPreventsMutation(t *testing.T) {
	f := setupFixture(t)
	if f.run(t, true, func() error { return fmt.Errorf("ACTOR_ACTIVE") }, nil) == nil {
		t.Fatal("actor ignored")
	}
	if !exists(f.root + "/tmp/owned/key.pem") {
		t.Fatal("actor guard ran too late")
	}
}
func TestActorBecomingActiveAfterPreflightPreventsMutation(t *testing.T) {
	f := setupFixture(t)
	calls := 0
	guard := func() error {
		calls++
		if calls > 1 {
			return fmt.Errorf("ACTOR_ACTIVE")
		}
		return nil
	}
	if f.run(t, true, guard, nil) == nil {
		t.Fatal("new actor ignored")
	}
	if !exists(f.root + "/tmp/owned/key.pem") {
		t.Fatal("actor checked too late")
	}
}
func TestIdentityReplacementStopsWithoutDeletingReplacement(t *testing.T) {
	f := setupFixture(t)
	hook := func(p string) {
		if p == "/tmp/owned/key.pem" {
			os.Rename(f.root+p, f.root+p+".retained")
			os.WriteFile(f.root+p, []byte("replacement"), 0600)
		}
	}
	if f.run(t, true, noActor, hook) == nil {
		t.Fatal("replacement accepted")
	}
	body, _ := os.ReadFile(f.root + "/tmp/owned/key.pem")
	if string(body) != "replacement" {
		t.Fatal("replacement unlinked")
	}
	if strings.Contains(f.out.String(), "REMOVED_") {
		t.Fatal("mutation preceded identity guard")
	}
}
func TestPartialFailureReportsActualRemovalWithoutRollback(t *testing.T) {
	f := setupFixture(t)
	hook := func(p string) {
		if p == "/tmp/owned/nested/code" {
			os.Chmod(f.root+p, 0644)
		}
	}
	if f.run(t, true, noActor, hook) == nil {
		t.Fatal("mode change accepted")
	}
	if exists(f.root+"/tmp/owned/key.pem") || !exists(f.root+"/tmp/owned/nested/code") || !exists(f.root+"/tmp/owned/owner.txt") {
		t.Fatal("partial outcome incorrect")
	}
	if !strings.Contains(f.out.String(), "REMOVED_FILE /tmp/owned/key.pem") || strings.Contains(f.out.String(), "FIXED_MANIFEST_SIDE_COMPLETE") {
		t.Fatal("partial outcome misreported")
	}
}
func TestLateDirectoryEntryRefusesRmdirAndPreservesEntry(t *testing.T) {
	f := setupFixture(t)
	hook := func(p string) {
		if p == "/tmp/owned/nested" {
			os.WriteFile(f.root+p+"/late", []byte("retained"), 0600)
		}
	}
	if f.run(t, true, noActor, hook) == nil {
		t.Fatal("late directory entry accepted")
	}
	if !exists(f.root+"/tmp/owned/nested/late") || !exists(f.root+"/tmp/owned/owner.txt") {
		t.Fatal("late contents or marker removed")
	}
}
