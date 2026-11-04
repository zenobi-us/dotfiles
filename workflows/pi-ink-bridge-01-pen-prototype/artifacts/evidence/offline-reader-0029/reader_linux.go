// Offline cleanup identity reader. It never parses or persists config bytes.
// Production has no fixture mode, pathname argument, environment override or repair action.
package main

import (
	"crypto/sha256"
	"fmt"
	"io"
	"syscall"
)

const markerDigest = "a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d"
const pathOnly = 0x200000 // Linux O_PATH; stdlib syscall does not export it on every architecture.
const directoryFlags = syscall.O_RDONLY | syscall.O_DIRECTORY | syscall.O_NOFOLLOW | syscall.O_NONBLOCK | syscall.O_CLOEXEC
const leafFlags = syscall.O_RDONLY | syscall.O_NOFOLLOW | syscall.O_NONBLOCK | syscall.O_CLOEXEC

type pinned struct {
	fd     int
	parent int
	name   string
	stat   syscall.Stat_t
}

type result struct {
	role   string
	stat   syscall.Stat_t
	digest string
}
type reader struct {
	uid, gid uint32
	expected string
	anchor   string
	out      io.Writer
	nodes    []pinned
}

// run owns root and every descriptor opened below it. Tests supply synthetic roots
// directly; only main selects the production root and ownership policy.
func (r *reader) run(root int) int {
	defer r.close()
	if !r.pin(root, -1, "", syscall.S_IFDIR, 0, false) {
		return r.refuse("ROOT_METADATA")
	}
	home, ok := r.directory(0, "home", false)
	if !ok {
		return r.refuse("HOME")
	}
	user, ok := r.directory(home, "root", false)
	if !ok {
		return r.refuse("ROOT_HOME")
	}
	stage, ok := r.directory(user, "pi-ink-sidebar-stage-0020", true)
	if !ok {
		return r.refuse("STAGE_DIRECTORY")
	}
	backup, ok := r.directory(user, "pi-ink-sidebar-backup-0020", true)
	if !ok {
		return r.refuse("BACKUP_DIRECTORY")
	}
	for _, item := range []struct {
		parent int
		role   string
		mode   uint32
	}{
		{stage, "public-stage-marker", 0644}, {backup, "public-backup-marker", 0600},
	} {
		value, ok := r.hash(item.parent, "owner.txt", item.role, item.mode, 4096)
		if !ok {
			return r.refuse("MARKER_READ")
		}
		if value.digest != r.expected {
			return r.refuse("MARKER_DIGEST")
		}
	}
	// Do not emit any config result until the entire operation passes its final guards.
	var values [2]result
	for i, item := range []struct {
		parent int
		role   string
	}{
		{stage, "private-stage-config"}, {backup, "private-backup-config"},
	} {
		if !r.stable() {
			return r.refuse("IDENTITY_CHANGED")
		}
		value, ok := r.hash(item.parent, "config.json", item.role, 0600, 65536)
		if !ok {
			return r.refuse("CONFIG_READ")
		}
		values[i] = value
	}
	if !r.stable() {
		return r.refuse("IDENTITY_CHANGED")
	}
	for _, value := range values {
		s := value.stat
		fmt.Fprintf(r.out, "CONFIG_METADATA ROLE=%s MODE=%o UID=%d GID=%d SIZE=%d DEV=%d INODE=%d MTIME=%d.%09d CTIME=%d.%09d\n", value.role, s.Mode&07777, s.Uid, s.Gid, s.Size, s.Dev, s.Ino, s.Mtim.Sec, s.Mtim.Nsec, s.Ctim.Sec, s.Ctim.Nsec)
		fmt.Fprintf(r.out, "CONFIG_SHA256 ROLE=%s SHA256=%s\n", value.role, value.digest)
	}
	fmt.Fprintln(r.out, "TWO_FIXED_CONFIG_DIGESTS_COMPLETE_NO_DELETION_AUTHORITY")
	return 0
}

func (r *reader) refuse(reason string) int { fmt.Fprintln(r.out, "REFUSAL "+reason); return 1 }
func (r *reader) close() {
	for i := len(r.nodes) - 1; i >= 0; i-- {
		syscall.Close(r.nodes[i].fd)
	}
}

func (r *reader) pin(fd, parent int, name string, kind, mode uint32, exact bool) bool {
	var s syscall.Stat_t
	if syscall.Fstat(fd, &s) != nil || s.Mode&syscall.S_IFMT != kind || s.Uid != r.uid || s.Gid != r.gid || (exact && s.Mode&07777 != mode) {
		syscall.Close(fd)
		return false
	}
	r.nodes = append(r.nodes, pinned{fd, parent, name, s})
	return true
}

func (r *reader) directory(parent int, name string, exact bool) (int, bool) {
	if !r.stable() {
		return 0, false
	}
	fd, err := syscall.Openat(r.nodes[parent].fd, name, directoryFlags, 0)
	if err != nil {
		return 0, false
	}
	if !r.pin(fd, parent, name, syscall.S_IFDIR, 0700, exact) {
		return 0, false
	}
	return len(r.nodes) - 1, r.stable()
}

func same(a, b syscall.Stat_t) bool {
	// Reading can update atime. It must not relax any other identity/metadata guard.
	return a.Dev == b.Dev && a.Ino == b.Ino && a.Mode == b.Mode && a.Nlink == b.Nlink && a.Uid == b.Uid && a.Gid == b.Gid && a.Rdev == b.Rdev && a.Size == b.Size && a.Mtim == b.Mtim && a.Ctim == b.Ctim
}

func (r *reader) stable() bool {
	for _, node := range r.nodes {
		var descriptor, path syscall.Stat_t
		if syscall.Fstat(node.fd, &descriptor) != nil || !same(node.stat, descriptor) {
			return false
		}
		var fd int
		var err error
		if node.parent < 0 {
			fd, err = syscall.Open(r.anchor, pathOnly|syscall.O_NOFOLLOW|syscall.O_NONBLOCK|syscall.O_CLOEXEC, 0)
		} else {
			fd, err = syscall.Openat(r.nodes[node.parent].fd, node.name, pathOnly|syscall.O_NOFOLLOW|syscall.O_NONBLOCK|syscall.O_CLOEXEC, 0)
		}
		if err != nil {
			return false
		}
		err = syscall.Fstat(fd, &path)
		syscall.Close(fd)
		if err != nil || !same(node.stat, path) {
			return false
		}
	}
	return true
}

func (r *reader) hash(parent int, name, role string, mode uint32, limit int64) (result, bool) {
	fmt.Fprintln(r.out, "FIXED_LEAF_PROGRESS ROLE="+role)
	if !r.stable() {
		return result{}, false
	}
	fd, err := syscall.Openat(r.nodes[parent].fd, name, leafFlags, 0)
	if err != nil {
		return result{}, false
	}
	if !r.pin(fd, parent, name, syscall.S_IFREG, mode, true) {
		return result{}, false
	}
	node := r.nodes[len(r.nodes)-1]
	if node.stat.Size < 0 || node.stat.Size > limit || !r.stable() {
		return result{}, false
	}
	hash := sha256.New()
	// One reusable bounded buffer; the extra byte detects growth even if initial
	// fstat size was within the cap. No config-sized allocation or retained bytes.
	var buffer [4096]byte
	var total int64
	for {
		remaining := limit + 1 - total
		if remaining <= 0 {
			return result{}, false
		}
		count := int64(len(buffer))
		if remaining < count {
			count = remaining
		}
		n, err := syscall.Read(fd, buffer[:int(count)])
		if err != nil {
			return result{}, false
		}
		total += int64(n)
		if total > limit {
			return result{}, false
		}
		if n == 0 {
			break
		}
		hash.Write(buffer[:n])
	}
	if total != node.stat.Size || !r.stable() {
		return result{}, false
	}
	return result{role, node.stat, fmt.Sprintf("%x", hash.Sum(nil))}, true
}
