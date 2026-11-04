// Cleanup engine for manifest0035. All paths come from frozen embedded data.
// Kept descriptors and before-unlink identity checks protect accidental replacement.
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path"
	"sort"
	"strings"
	"syscall"
	"unsafe"
)

type target struct {
	Path    string `json:"path"`
	Action  string `json:"action"`
	Mode    uint32 `json:"mode"`
	UID     uint32 `json:"uid"`
	GID     uint32 `json:"gid"`
	Size    int64  `json:"size"`
	Device  uint64 `json:"device"`
	Inode   uint64 `json:"inode"`
	MtimeNS int64  `json:"mtime_ns"`
	SHA     string `json:"sha256"`
	Cap     int64  `json:"cap"`
}
type directory struct {
	fd       int
	parent   *directory
	name     string
	stat     syscall.Stat_t
	retained bool
}
type filePin struct {
	target target
	parent *directory
	name   string
	fd     int
	stat   syscall.Stat_t
}
type cleanup struct {
	root         *directory
	dirs         map[string]*directory
	files        []*filePin
	targets      []target
	output       io.Writer
	runtimeGuard func() error
	rootUID      uint32
	mutationHook func(string)
}

const nofollowFlags = syscall.O_RDONLY | syscall.O_NOFOLLOW | syscall.O_NONBLOCK | syscall.O_CLOEXEC
const pathFlags = 0x200000 | syscall.O_NOFOLLOW | syscall.O_CLOEXEC

func (c *cleanup) run(apply bool) error {
	defer c.close()
	if err := c.runtimeGuard(); err != nil {
		return err
	}
	for _, t := range c.targets {
		if strings.HasPrefix(t.Action, "rmdir") || (t.Action == "preserve" && t.SHA == "") {
			if strings.HasPrefix(t.Action, "rmdir") || strings.HasSuffix(t.Path, "0020") {
				d, err := c.openDirectory(t.Path, t.UID)
				if err != nil {
					return err
				}
				if !directoryMetadata(d.stat, t) {
					return fmt.Errorf("DIRECTORY_METADATA")
				}
			}
			continue
		}
		p, err := c.openDirectory(path.Dir(t.Path), t.UID)
		if err != nil {
			return err
		}
		fd, err := syscall.Openat(p.fd, path.Base(t.Path), nofollowFlags, 0)
		if err != nil {
			return fmt.Errorf("FILE_OPEN")
		}
		f := &filePin{target: t, parent: p, name: path.Base(t.Path), fd: fd}
		c.files = append(c.files, f)
		if syscall.Fstat(fd, &f.stat) != nil || !fileMetadata(f.stat, t) {
			return fmt.Errorf("FILE_METADATA")
		}
		if err = c.hash(f); err != nil {
			return err
		}
	}
	// No unlink occurs until every planned file and directory has passed.
	fmt.Fprintln(c.output, "ALL_TARGETS_PREFLIGHT_PASSED")
	if !apply {
		return nil
	}
	if err := c.runtimeGuard(); err != nil {
		return err
	}
	for _, f := range c.files {
		if f.target.Action != "unlink_regular_file" {
			continue
		}
		if c.mutationHook != nil {
			c.mutationHook(f.target.Path)
		}
		if err := c.unlink(f); err != nil {
			return err
		}
	}
	// Inner directories first. Roots containing ownership markers wait for those markers.
	type directoryOrder struct{ index, depth int }
	directories := make([]directoryOrder, 0, len(c.targets))
	for i := range c.targets {
		if strings.HasPrefix(c.targets[i].Action, "rmdir") {
			directories = append(directories, directoryOrder{i, strings.Count(c.targets[i].Path, "/")})
		}
	}
	sort.SliceStable(directories, func(i, j int) bool {
		return directories[i].depth > directories[j].depth
	})
	markerParents := map[string]bool{}
	for _, f := range c.files {
		if strings.HasPrefix(f.target.Action, "unlink_marker") {
			markerParents[path.Dir(f.target.Path)] = true
		}
	}
	for _, directory := range directories {
		t := &c.targets[directory.index]
		if !markerParents[t.Path] {
			if err := c.removeDirectory(t); err != nil {
				return err
			}
		}
	}
	for _, f := range c.files {
		if !strings.HasPrefix(f.target.Action, "unlink_marker") {
			continue
		}
		names, err := directoryNames(f.parent)
		if err != nil {
			return err
		}
		if len(names) != 1 || names[0] != f.name {
			f.parent.retained = true
			fmt.Fprintln(c.output, "RETAINED_MARKER", f.target.Path)
			continue
		}
		if c.mutationHook != nil {
			c.mutationHook(f.target.Path)
		}
		if err = c.unlink(f); err != nil {
			return err
		}
	}
	for _, directory := range directories {
		t := &c.targets[directory.index]
		if markerParents[t.Path] {
			if err := c.removeDirectory(t); err != nil {
				return err
			}
		}
	}
	if err := c.runtimeGuard(); err != nil {
		return err
	}
	fmt.Fprintln(c.output, "FIXED_MANIFEST_SIDE_COMPLETE")
	return nil
}

func newCleanup(root int, targets []target, out io.Writer, guard func() error, rootUID uint32) (*cleanup, error) {
	var s syscall.Stat_t
	if syscall.Fstat(root, &s) != nil || s.Mode&syscall.S_IFMT != syscall.S_IFDIR || s.Uid != rootUID || s.Gid != rootUID || s.Mode&0022 != 0 {
		return nil, fmt.Errorf("ROOT_IDENTITY")
	}
	d := &directory{fd: root, stat: s}
	return &cleanup{root: d, dirs: map[string]*directory{"/": d}, targets: targets, output: out, runtimeGuard: guard, rootUID: rootUID}, nil
}
func (c *cleanup) close() {
	for _, f := range c.files {
		syscall.Close(f.fd)
	}
	for _, d := range c.dirs {
		syscall.Close(d.fd)
	}
}
func directoryMetadata(s syscall.Stat_t, t target) bool {
	return s.Mode&07777 == t.Mode && s.Uid == t.UID && s.Gid == t.GID && (t.Device == 0 || uint64(s.Dev) == t.Device) && (t.Inode == 0 || s.Ino == t.Inode)
}
func fileMetadata(s syscall.Stat_t, t target) bool {
	return s.Mode&syscall.S_IFMT == syscall.S_IFREG && directoryMetadata(s, t) && s.Size == t.Size && (t.MtimeNS == 0 || s.Mtim.Sec*1000000000+s.Mtim.Nsec == t.MtimeNS)
}
func sameDirectory(a, b syscall.Stat_t) bool {
	return a.Dev == b.Dev && a.Ino == b.Ino && a.Mode == b.Mode && a.Uid == b.Uid && a.Gid == b.Gid
}
func sameFile(a, b syscall.Stat_t) bool {
	return sameDirectory(a, b) && a.Nlink == b.Nlink && a.Size == b.Size && a.Mtim == b.Mtim && a.Ctim == b.Ctim
}
func (c *cleanup) openDirectory(p string, owner uint32) (*directory, error) {
	if d, ok := c.dirs[p]; ok {
		if err := stableDirectory(d); err != nil {
			return nil, err
		}
		return d, nil
	}
	parent, err := c.openDirectory(path.Dir(p), owner)
	if err != nil {
		return nil, err
	}
	fd, err := syscall.Openat(parent.fd, path.Base(p), nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		return nil, fmt.Errorf("PARENT_OPEN")
	}
	var s syscall.Stat_t
	if syscall.Fstat(fd, &s) != nil {
		syscall.Close(fd)
		return nil, fmt.Errorf("PARENT_STAT")
	}
	expected := owner
	if p == "/tmp" || p == "/home" || p == "/home/root" {
		expected = c.rootUID
	}
	if s.Uid != expected || s.Gid != expected || (s.Mode&0022 != 0 && (p != "/tmp" || s.Mode&syscall.S_ISVTX == 0)) {
		syscall.Close(fd)
		return nil, fmt.Errorf("PARENT_OWNER_OR_WRITE_MODE")
	}
	d := &directory{fd: fd, parent: parent, name: path.Base(p), stat: s}
	c.dirs[p] = d
	if err = stableDirectory(d); err != nil {
		return nil, err
	}
	return d, nil
}
func stableDirectory(d *directory) error {
	if d.parent != nil {
		if err := stableDirectory(d.parent); err != nil {
			return err
		}
	}
	var s syscall.Stat_t
	if syscall.Fstat(d.fd, &s) != nil || !sameDirectory(d.stat, s) {
		return fmt.Errorf("DIRECTORY_CHANGED")
	}
	if d.parent == nil {
		return nil
	}
	fd, err := syscall.Openat(d.parent.fd, d.name, pathFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		return fmt.Errorf("DIRECTORY_PATH_CHANGED")
	}
	defer syscall.Close(fd)
	if syscall.Fstat(fd, &s) != nil || !sameDirectory(d.stat, s) {
		return fmt.Errorf("DIRECTORY_PATH_CHANGED")
	}
	return nil
}
func (c *cleanup) fileStable(f *filePin) error {
	if err := stableDirectory(f.parent); err != nil {
		return err
	}
	var s syscall.Stat_t
	if syscall.Fstat(f.fd, &s) != nil || !sameFile(f.stat, s) {
		return fmt.Errorf("FILE_CHANGED")
	}
	fd, err := syscall.Openat(f.parent.fd, f.name, pathFlags, 0)
	if err != nil {
		return fmt.Errorf("FILE_PATH_CHANGED")
	}
	defer syscall.Close(fd)
	if syscall.Fstat(fd, &s) != nil || !sameFile(f.stat, s) {
		return fmt.Errorf("FILE_PATH_CHANGED")
	}
	return nil
}
func (c *cleanup) hash(f *filePin) error {
	if f.target.Cap <= 0 || f.stat.Size > f.target.Cap {
		return fmt.Errorf("HASH_CAP")
	}
	if err := c.fileStable(f); err != nil {
		return err
	}
	h := sha256.New()
	var buffer [16384]byte
	var total int64
	for {
		remaining := f.target.Cap + 1 - total
		if remaining <= 0 {
			return fmt.Errorf("HASH_CAP")
		}
		count := int64(len(buffer))
		if remaining < count {
			count = remaining
		}
		n, err := syscall.Read(f.fd, buffer[:int(count)])
		if err != nil {
			return fmt.Errorf("HASH_READ")
		}
		total += int64(n)
		if total > f.target.Cap {
			return fmt.Errorf("HASH_CAP")
		}
		if n == 0 {
			break
		}
		h.Write(buffer[:n])
	}
	if total != f.stat.Size || hex.EncodeToString(h.Sum(nil)) != f.target.SHA {
		return fmt.Errorf("HASH_MISMATCH")
	}
	return c.fileStable(f)
}
func (c *cleanup) unlink(f *filePin) error {
	if err := c.fileStable(f); err != nil {
		return err
	}
	if err := syscall.Unlinkat(f.parent.fd, f.name); err != nil {
		return fmt.Errorf("UNLINK_FAILED")
	}
	fmt.Fprintln(c.output, "REMOVED_FILE", f.target.Path)
	return nil
}
func directoryNames(d *directory) ([]string, error) {
	if err := stableDirectory(d); err != nil {
		return nil, err
	}
	fd, err := syscall.Openat(d.fd, ".", nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		return nil, fmt.Errorf("DIRECTORY_NAMES_OPEN")
	}
	f := os.NewFile(uintptr(fd), "fixed-owned-directory")
	defer f.Close()
	names, err := f.Readdirnames(257)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("DIRECTORY_NAMES_READ")
	}
	bytes := 0
	for _, name := range names {
		bytes += len(name)
	}
	if len(names) > 256 || bytes > 16384 {
		return nil, fmt.Errorf("DIRECTORY_NAMES_CAP")
	}
	return names, nil
}
func (c *cleanup) removeDirectory(t *target) error {
	d := c.dirs[t.Path]
	if d == nil {
		return fmt.Errorf("DIRECTORY_NOT_PINNED")
	}
	if d.retained {
		fmt.Fprintln(c.output, "RETAINED_DIRECTORY", t.Path)
		return nil
	}
	names, err := directoryNames(d)
	if err != nil {
		return err
	}
	if len(names) > 0 {
		d.retained = true
		fmt.Fprintln(c.output, "RETAINED_DIRECTORY", t.Path)
		return nil
	}
	if c.mutationHook != nil {
		c.mutationHook(t.Path)
	}
	if err = stableDirectory(d); err != nil {
		return err
	}
	name, err := syscall.BytePtrFromString(d.name)
	if err != nil {
		return fmt.Errorf("DIRECTORY_NAME")
	}
	_, _, errno := syscall.Syscall(syscall.SYS_UNLINKAT, uintptr(d.parent.fd), uintptr(unsafe.Pointer(name)), uintptr(0x200))
	if errno != 0 {
		return fmt.Errorf("RMDIR_FAILED")
	}
	fmt.Fprintln(c.output, "REMOVED_DIRECTORY", t.Path)
	return nil
}
