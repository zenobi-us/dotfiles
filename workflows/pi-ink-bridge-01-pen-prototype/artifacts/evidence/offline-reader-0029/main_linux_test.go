// Host-only synthetic fixtures. No device paths are opened by these tests.
package main

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
)

func fixture(t *testing.T) (string, *reader, int) {
	t.Helper()
	root := t.TempDir()
	for _, dir := range []string{"home", "home/root", "home/root/pi-ink-sidebar-stage-0020", "home/root/pi-ink-sidebar-backup-0020"} {
		if err := os.Mkdir(filepath.Join(root, dir), 0700); err != nil {
			t.Fatal(err)
		}
	}
	for i, dir := range []string{"pi-ink-sidebar-stage-0020", "pi-ink-sidebar-backup-0020"} {
		mode := os.FileMode(0600)
		if i == 0 {
			mode = 0644
		}
		if err := os.WriteFile(filepath.Join(root, "home/root", dir, "owner.txt"), []byte("synthetic-owner\n"), mode); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(root, "home/root", dir, "config.json"), []byte("PRIVATE_SYNTHETIC_SENTINEL"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	fd, err := syscall.Open(root, directoryFlags, 0)
	if err != nil {
		t.Fatal(err)
	}
	return root, &reader{uid: uint32(os.Getuid()), gid: uint32(os.Getgid()), anchor: root, expected: fmt.Sprintf("%x", sha256.Sum256([]byte("synthetic-owner\n"))), out: io.Discard}, fd
}
func stage(root, leaf string) string {
	return filepath.Join(root, "home/root/pi-ink-sidebar-stage-0020", leaf)
}
func backup(root, leaf string) string {
	return filepath.Join(root, "home/root/pi-ink-sidebar-backup-0020", leaf)
}
func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

func TestSuccessAndExactBounds(t *testing.T) {
	for _, size := range []int{0, 1, 4096, 65536} {
		t.Run(fmt.Sprint(size), func(t *testing.T) {
			root, r, fd := fixture(t)
			must(t, os.WriteFile(stage(root, "config.json"), bytes.Repeat([]byte{'z'}, size), 0600))
			var output bytes.Buffer
			r.out = &output
			if r.run(fd) != 0 {
				t.Fatal(output.String())
			}
			digest := fmt.Sprintf("%x", sha256.Sum256(bytes.Repeat([]byte{'z'}, size)))
			if !strings.Contains(output.String(), "CONFIG_SHA256 ROLE=private-stage-config SHA256="+digest+"\n") || strings.Contains(output.String(), "PRIVATE_SYNTHETIC_SENTINEL") {
				t.Fatal("wrong digest or leaked bytes")
			}
		})
	}
}

func TestRefusalBoundaries(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*testing.T, string, *reader)
	}{
		{"home-symlink", func(t *testing.T, p string, r *reader) {
			must(t, os.Rename(filepath.Join(p, "home"), filepath.Join(p, "elsewhere")))
			must(t, os.Symlink("elsewhere", filepath.Join(p, "home")))
		}},
		{"root-home-symlink", func(t *testing.T, p string, r *reader) {
			must(t, os.Rename(filepath.Join(p, "home/root"), filepath.Join(p, "home/elsewhere")))
			must(t, os.Symlink("elsewhere", filepath.Join(p, "home/root")))
		}},
		{"stage-symlink", func(t *testing.T, p string, r *reader) {
			must(t, os.Rename(stage(p, ""), stage(p, "")+"-elsewhere"))
			must(t, os.Symlink("pi-ink-sidebar-stage-0020-elsewhere", stage(p, "")))
		}},
		{"backup-symlink", func(t *testing.T, p string, r *reader) {
			must(t, os.Rename(backup(p, ""), backup(p, "")+"-elsewhere"))
			must(t, os.Symlink("pi-ink-sidebar-backup-0020-elsewhere", backup(p, "")))
		}},
		{"wrong-owner", func(t *testing.T, p string, r *reader) { r.uid++ }},
		{"wrong-group", func(t *testing.T, p string, r *reader) { r.gid++ }},
		{"directory-mode", func(t *testing.T, p string, r *reader) { must(t, os.Chmod(stage(p, ""), 0755)) }},
	}
	for _, leaf := range []string{"owner.txt", "config.json"} {
		for _, which := range []string{"stage", "backup"} {
			for _, kind := range []string{"symlink", "mode", "oversize", "fifo", "directory", "socket", "missing"} {
				leaf, which, kind := leaf, which, kind
				cases = append(cases, struct {
					name   string
					mutate func(*testing.T, string, *reader)
				}{which + "-" + leaf + "-" + kind, func(t *testing.T, p string, r *reader) {
					path := stage(p, leaf)
					if which == "backup" {
						path = backup(p, leaf)
					}
					switch kind {
					case "mode":
						must(t, os.Chmod(path, 0666))
					case "oversize":
						size := 65537
						if leaf == "owner.txt" {
							size = 4097
						}
						must(t, os.WriteFile(path, bytes.Repeat([]byte{'x'}, size), 0600))
					default:
						must(t, os.Remove(path))
						switch kind {
						case "symlink":
							must(t, os.Symlink("/dev/null", path))
						case "fifo":
							must(t, syscall.Mkfifo(path, 0600))
						case "directory":
							must(t, os.Mkdir(path, 0600))
						case "socket":
							must(t, syscall.Mknod(path, syscall.S_IFSOCK|0600, 0))
						}
					}
				}})
			}
		}
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			root, r, fd := fixture(t)
			test.mutate(t, root, r)
			var output bytes.Buffer
			r.out = &output
			if r.run(fd) != 1 {
				t.Fatal("unsafe fixture accepted")
			}
			if strings.Contains(output.String(), "CONFIG_SHA256") || strings.Contains(output.String(), "PRIVATE_SYNTHETIC_SENTINEL") {
				t.Fatal("result leaked on refusal")
			}
		})
	}
}

func TestBothMarkersBeforeConfigs(t *testing.T) {
	for _, which := range []string{"stage", "backup"} {
		t.Run(which, func(t *testing.T) {
			root, r, fd := fixture(t)
			path := stage(root, "owner.txt")
			if which == "backup" {
				path = backup(root, "owner.txt")
			}
			must(t, os.WriteFile(path, []byte("wrong marker"), 0600))
			if which == "stage" {
				must(t, os.Chmod(path, 0644))
			}
			var out bytes.Buffer
			r.out = &out
			if r.run(fd) != 1 || !strings.Contains(out.String(), "REFUSAL MARKER_DIGEST") || strings.Contains(out.String(), "ROLE=private-") {
				t.Fatal(out.String())
			}
		})
	}
}

func TestObservedIdentityChanges(t *testing.T) {
	for _, kind := range []string{"replacement", "symlink", "size", "mode", "directory-replacement", "marker-after-verification"} {
		t.Run(kind, func(t *testing.T) {
			root, r, fd := fixture(t)
			defer r.close()
			if !r.pin(fd, -1, "", syscall.S_IFDIR, 0, false) {
				t.Fatal("root")
			}
			home, ok := r.directory(0, "home", false)
			if !ok {
				t.Fatal("home")
			}
			user, ok := r.directory(home, "root", false)
			if !ok {
				t.Fatal("user")
			}
			dir, ok := r.directory(user, "pi-ink-sidebar-stage-0020", true)
			if !ok {
				t.Fatal("stage")
			}
			if _, ok = r.hash(dir, "owner.txt", "public-stage-marker", 0644, 4096); !ok {
				t.Fatal("marker")
			}
			path := stage(root, "owner.txt")
			switch kind {
			case "replacement":
				must(t, os.Rename(path, path+".old"))
				must(t, os.WriteFile(path, []byte("synthetic-owner\n"), 0644))
			case "symlink":
				must(t, os.Remove(path))
				must(t, os.Symlink("/dev/null", path))
			case "size":
				must(t, os.WriteFile(path, []byte("different-size"), 0644))
			case "mode":
				must(t, os.Chmod(path, 0600))
			case "directory-replacement":
				must(t, os.Rename(stage(root, ""), stage(root, "")+".old"))
				must(t, os.Mkdir(stage(root, ""), 0700))
			case "marker-after-verification":
				must(t, os.WriteFile(path, []byte("changed--owner!\n"), 0644))
			}
			if r.stable() {
				t.Fatal("change accepted")
			}
			if _, ok = r.hash(dir, "config.json", "private-stage-config", 0600, 65536); ok {
				t.Fatal("config read accepted after marker changed")
			}
		})
	}
}

func TestLeafOwnership(t *testing.T) {
	for _, leaf := range []string{"owner.txt", "config.json"} {
		for _, group := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s-group-%v", leaf, group), func(t *testing.T) {
				_, r, fd := fixture(t)
				defer r.close()
				if !r.pin(fd, -1, "", syscall.S_IFDIR, 0, false) {
					t.Fatal("root")
				}
				home, ok := r.directory(0, "home", false)
				if !ok {
					t.Fatal("home")
				}
				user, ok := r.directory(home, "root", false)
				if !ok {
					t.Fatal("user")
				}
				dir, ok := r.directory(user, "pi-ink-sidebar-stage-0020", true)
				if !ok {
					t.Fatal("dir")
				}
				// No privileged chown is needed: the actual fstat owner must differ from
				// the required policy. Directory snapshots remain unchanged.
				if group {
					r.gid++
				} else {
					r.uid++
				}
				mode := uint32(0600)
				if leaf == "owner.txt" {
					mode = 0644
				}
				if _, ok = r.hash(dir, leaf, "fixed-test-role", mode, 65536); ok {
					t.Fatal("wrong leaf owner accepted")
				}
			})
		}
	}
}

func TestMarkerAtCap(t *testing.T) {
	root, r, fd := fixture(t)
	marker := bytes.Repeat([]byte{'m'}, 4096)
	must(t, os.WriteFile(stage(root, "owner.txt"), marker, 0644))
	must(t, os.WriteFile(backup(root, "owner.txt"), marker, 0600))
	r.expected = fmt.Sprintf("%x", sha256.Sum256(marker))
	if r.run(fd) != 0 {
		t.Fatal("exact marker cap refused")
	}
}
