// Runtime guards reuse the recovered service fingerprints and owned actor boundary.
// Kernel and systemctl data stay in process memory; raw values never reach output.
package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

func deviceRuntimeGuard() error {
	fingerprints := []struct {
		path, sha string
		cap       int64
	}{
		{"/usr/lib/systemd/system/xochitl.service", "23f537cf59d527bfbf4823f372385d613e1ade0961c98831c935a372018f9566", 65536},
		{"/etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf", "84a2d95c2284a2f2fdb5ae70b4f25eb4a5ef2fbf6f94391fc03e4c54643314ef", 65536},
		{"/usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf", "a9432caffacb29d6fcb35136dcc3cb43d8737eb6c2efcb35ea335725f42082d1", 65536},
		{"/usr/bin/xochitl", "b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021", 33554432},
		{"/home/root/xovi/extensions.d/webserver-remote.so", "24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f", 10485760},
	}
	for _, f := range fingerprints {
		if err := publicFingerprint(f.path, f.sha, f.cap); err != nil {
			return err
		}
	}
	for _, p := range []string{"/etc/systemd/system/xochitl.service.d/00-xovi.conf", "/etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf", "/proc/125204"} {
		if _, err := os.Lstat(p); !os.IsNotExist(err) {
			return fmt.Errorf("EXPECTED_ABSENCE_CHANGED")
		}
	}
	values := map[string]string{"FragmentPath": "/usr/lib/systemd/system/xochitl.service", "DropInPaths": "/etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf", "Environment": "MALLOC_ARENA_MAX=8", "MainPID": "230912", "ActiveState": "active"}
	for key, expected := range values {
		value, _, err := serviceValue("xochitl", key)
		if err != nil || value != expected {
			return fmt.Errorf("CURRENT_SERVICE_CHANGED")
		}
	}
	value, _, err := serviceValue("xochitl", "Job")
	if err != nil || (value != "" && value != "0") {
		return fmt.Errorf("PENDING_SERVICE_JOB")
	}
	value, _, err = serviceValue("xochitl", "ExecStart")
	prefix := "{ path=/usr/bin/xochitl ; argv[]=/usr/bin/xochitl --system ; "
	if err != nil || !strings.HasPrefix(value, prefix) || strings.Contains(strings.TrimPrefix(value, prefix), "path=") || strings.Contains(strings.TrimPrefix(value, prefix), "argv[]=") {
		return fmt.Errorf("SERVICE_COMMAND_CHANGED")
	}
	for _, unit := range []string{"pi-ink-bridge-sidebar-0020.service", "pi-ink-bridge-0020.service"} {
		load, code, e := serviceValue(unit, "LoadState")
		if load == "not-found" && (code == 0 || code == 4) {
			continue
		}
		if e != nil || load != "loaded" {
			return fmt.Errorf("OWNED_UNIT_UNKNOWN")
		}
		active, _, e := serviceValue(unit, "ActiveState")
		pid, _, e2 := serviceValue(unit, "MainPID")
		if e != nil || e2 != nil || active != "inactive" || pid != "0" {
			return fmt.Errorf("OWNED_CLIENT_NOT_INACTIVE")
		}
	}
	var actorRoot, actorFile syscall.Stat_t
	if syscall.Lstat("/home/root/pi-ink-operation-0020", &actorRoot) != nil || actorRoot.Mode != (syscall.S_IFDIR|0700) || actorRoot.Uid != 0 || actorRoot.Gid != 0 {
		return fmt.Errorf("ACTOR_ROOT_METADATA")
	}
	if syscall.Lstat("/home/root/pi-ink-operation-0020/actor.txt", &actorFile) != nil || actorFile.Mode != (syscall.S_IFREG|0600) || actorFile.Size != 81 {
		return fmt.Errorf("ACTOR_FILE_METADATA")
	}
	if err := publicFingerprint("/home/root/pi-ink-operation-0020/actor.txt", "309ebeb14591df3eaab90c49f9fd784430726e1391f0be2d14976a2afc96c9f5", 256); err != nil {
		return fmt.Errorf("TERMINAL_ACTOR_CHANGED")
	}
	statBefore, err := readBounded("/proc/230912/stat", 8192)
	if err != nil {
		return fmt.Errorf("XOCHITL_IDENTITY_UNKNOWN")
	}
	executable, err := os.Readlink("/proc/230912/exe")
	if err != nil || executable != "/usr/bin/xochitl" {
		return fmt.Errorf("XOCHITL_EXECUTABLE_CHANGED")
	}
	maps, err := readBounded("/proc/230912/maps", 4194304)
	if err != nil {
		return fmt.Errorf("MODULE_MAP_VISIBILITY")
	}
	for _, module := range []string{"pi-ink-loopback-0020.so", "webserver-remote.so", "xovi.so", "qt-resource-rebuilder.so", "appload.so"} {
		if bytes.Contains(maps, []byte(module)) {
			return fmt.Errorf("KNOWN_MODULE_MAPPED")
		}
	}
	for _, p := range []string{"/proc/net/tcp", "/proc/net/tcp6"} {
		data, e := readBounded(p, 1048576)
		if e != nil {
			return fmt.Errorf("LISTENER_VISIBILITY")
		}
		for _, line := range strings.Split(string(data), "\n")[1:] {
			fields := strings.Fields(line)
			if len(fields) == 0 {
				continue
			}
			if len(fields) < 4 {
				return fmt.Errorf("LISTENER_PARSE")
			}
			address := strings.Split(fields[1], ":")
			if len(address) != 2 {
				return fmt.Errorf("LISTENER_PARSE")
			}
			port, e := strconv.ParseUint(address[1], 16, 16)
			if e != nil {
				return fmt.Errorf("LISTENER_PARSE")
			}
			if port == 9821 && fields[3] == "0A" {
				return fmt.Errorf("OWNED_UI_LISTENER_PRESENT")
			}
		}
	}
	statAfter, err := readBounded("/proc/230912/stat", 8192)
	if err != nil {
		return fmt.Errorf("XOCHITL_IDENTITY_UNKNOWN")
	}
	if processStart(statBefore) == "" || processStart(statBefore) != processStart(statAfter) {
		return fmt.Errorf("XOCHITL_PROCESS_CHANGED")
	}
	return nil
}

func hostRuntimeGuard(targets []target) error {
	// Exact legacy roots identify owned origin/client arguments, cwd and executable.
	roots := map[string]bool{}
	for _, t := range targets {
		parts := strings.Split(strings.TrimPrefix(t.Path, "/"), "/")
		if len(parts) < 2 || parts[0] != "tmp" {
			return fmt.Errorf("HOST_SCOPE")
		}
		roots["/tmp/"+parts[1]] = true
	}
	proc, err := os.Open("/proc")
	if err != nil {
		return fmt.Errorf("PROCESS_VISIBILITY")
	}
	defer proc.Close()
	names, err := proc.Readdirnames(4097)
	if err != nil && err != io.EOF {
		return fmt.Errorf("PROCESS_VISIBILITY")
	}
	if len(names) > 4096 {
		return fmt.Errorf("PROCESS_BOUND")
	}
	uid := os.Getuid()
	for _, name := range names {
		pid, e := strconv.Atoi(name)
		if e != nil || pid <= 1 || pid == os.Getpid() {
			continue
		}
		info, e := os.Stat("/proc/" + name)
		if os.IsNotExist(e) {
			continue
		}
		if e != nil {
			return fmt.Errorf("PROCESS_METADATA_VISIBILITY")
		}
		s, ok := info.Sys().(*syscall.Stat_t)
		if !ok {
			return fmt.Errorf("PROCESS_METADATA_VISIBILITY")
		}
		if int(s.Uid) != uid {
			continue
		}
		args, e := readBounded("/proc/"+name+"/cmdline", 65536)
		if os.IsNotExist(e) {
			continue
		}
		if e != nil {
			return fmt.Errorf("OWNED_PROCESS_VISIBILITY")
		}
		for root := range roots {
			if bytes.Contains(args, []byte(root+"/")) || bytes.Contains(args, []byte(root+"\x00")) {
				return fmt.Errorf("OWNED_ACTOR_STILL_ACTIVE")
			}
		}
		for _, leaf := range []string{"cwd", "exe"} {
			value, e := os.Readlink("/proc/" + name + "/" + leaf)
			if os.IsNotExist(e) {
				continue
			}
			if e != nil {
				return fmt.Errorf("OWNED_PROCESS_VISIBILITY")
			}
			for root := range roots {
				if value == root || strings.HasPrefix(value, root+"/") {
					return fmt.Errorf("OWNED_ACTOR_STILL_ACTIVE")
				}
			}
		}
	}
	return nil
}

func processStart(data []byte) string {
	value := string(data)
	end := strings.LastIndex(value, ") ")
	if end < 0 {
		return ""
	}
	fields := strings.Fields(value[end+2:])
	if len(fields) < 20 {
		return ""
	}
	return fields[19]
}
func readBounded(p string, limit int64) ([]byte, error) {
	fd, err := syscall.Open(p, nofollowFlags, 0)
	if err != nil {
		return nil, err
	}
	f := os.NewFile(uintptr(fd), "bounded-runtime-input")
	defer f.Close()
	data, err := io.ReadAll(io.LimitReader(f, limit+1))
	if err != nil || int64(len(data)) > limit {
		return nil, fmt.Errorf("RUNTIME_INPUT_BOUND")
	}
	return data, nil
}
func publicFingerprint(p, expected string, limit int64) error {
	root, err := syscall.Open("/", nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		return fmt.Errorf("GUARD_ROOT")
	}
	c, err := newCleanup(root, nil, io.Discard, func() error { return nil }, 0)
	if err != nil {
		syscall.Close(root)
		return err
	}
	defer c.close()
	parent, err := c.openDirectory(filepath.Dir(p), 0)
	if err != nil {
		return err
	}
	fd, err := syscall.Openat(parent.fd, filepath.Base(p), nofollowFlags, 0)
	if err != nil {
		return fmt.Errorf("GUARD_FILE_OPEN")
	}
	var s syscall.Stat_t
	if syscall.Fstat(fd, &s) != nil || s.Mode&syscall.S_IFMT != syscall.S_IFREG || s.Uid != 0 || s.Gid != 0 || s.Size > limit {
		syscall.Close(fd)
		return fmt.Errorf("GUARD_FILE_METADATA")
	}
	f := &filePin{target: target{Path: p, SHA: expected, Cap: limit}, parent: parent, name: filepath.Base(p), fd: fd, stat: s}
	c.files = append(c.files, f)
	return c.hash(f)
}

type limitedOutput struct{ data []byte }

func (b *limitedOutput) Write(p []byte) (int, error) {
	if len(b.data)+len(p) > 65536 {
		return 0, io.ErrShortWrite
	}
	b.data = append(b.data, p...)
	return len(p), nil
}
func serviceValue(unit, key string) (string, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "systemctl", "show", unit, "-p", key, "--value")
	var out limitedOutput
	cmd.Stdout = &out
	cmd.Stderr = io.Discard
	err := cmd.Run()
	code := 0
	if err != nil {
		code = -1
		if e, ok := err.(*exec.ExitError); ok {
			code = e.ExitCode()
		}
	}
	return strings.TrimSpace(string(out.data)), code, err
}
