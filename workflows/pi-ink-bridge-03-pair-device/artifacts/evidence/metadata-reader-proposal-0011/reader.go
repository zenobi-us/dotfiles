// Reads only the production client's fixed private files; emits hashes and policy results, never values.
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"syscall"
)

const productionBase = "/home/root/.local/share/pi-ink-bridge"
const trustedServer = "256377c7f22604161e086b332a63e19b"
const trustedOrigin = "https://192.168.86.35:58841"
const productionConfigHash = "83a3766298e1e0f5344d5d18bb95b43f38fe38349427191a845bc4fa30bba8c9"
const productionCAHash = "8e5b94fe2995e86baf3ee80a788caeb740efee2983942e4499b026ebaec1f7d9"

type fileMetadata struct {
	Exists bool   `json:"exists"`
	SHA256 string `json:"sha256,omitempty"`
	Mode   string `json:"mode,omitempty"`
	UID    uint32 `json:"uid"`
	GID    uint32 `json:"gid"`
	Size   int64  `json:"size"`
	Device uint64 `json:"device"`
	Inode  uint64 `json:"inode"`
}

type report struct {
	Schema         string       `json:"schema"`
	Config         fileMetadata `json:"config"`
	CA             fileMetadata `json:"ca"`
	State          fileMetadata `json:"state"`
	DeviceIDHash   string       `json:"device_id_sha256"`
	FixedPaths     bool         `json:"fixed_paths_verified"`
	ServerVerified bool         `json:"server_identity_verified"`
}

func main() {
	if len(os.Args) != 1 || os.Geteuid() != 0 {
		fmt.Fprintln(os.Stderr, "STOP=reader_invocation")
		os.Exit(41)
	}
	value, err := inspect(productionBase, 0, 0, productionConfigHash, productionCAHash)
	if err != nil {
		// Every error below is a fixed code; no parsed data or filesystem error is printed.
		fmt.Fprintln(os.Stderr, "STOP=reader_"+err.Error())
		os.Exit(41)
	}
	if json.NewEncoder(os.Stdout).Encode(value) != nil {
		os.Exit(42)
	}
}

func inspect(base string, uid, gid uint32, configHash, caHash string) (report, error) {
	out := report{Schema: "pi-ink-private-metadata/v1"}
	for path := base; ; path = filepath.Dir(path) {
		info, err := os.Lstat(path)
		if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return out, errors.New("parent_type")
		}
		if path == base {
			st, ok := info.Sys().(*syscall.Stat_t)
			if !ok || st.Uid != uid || st.Gid != gid || info.Mode().Perm() != 0700 {
				return out, errors.New("base_permissions")
			}
		}
		if path == "/" {
			break
		}
	}
	config, meta, err := readPrivate(filepath.Join(base, "config.json"), uid, gid, 64*1024)
	if err != nil {
		return out, err
	}
	out.Config = meta
	if meta.SHA256 != configHash {
		return out, errors.New("config_identity_changed")
	}
	var parsed struct {
		DeviceID string `json:"deviceId"`
		StatePath string `json:"statePath"`
		Servers []struct {
			ServerID string `json:"serverId"`
			Origin string `json:"origin"`
			CA string `json:"ca"`
		} `json:"servers"`
	}
	if json.Unmarshal(config, &parsed) != nil || len(parsed.DeviceID) == 0 || len(parsed.DeviceID) > 128 || len(parsed.Servers) != 1 {
		return out, errors.New("config_shape")
	}
	if parsed.StatePath != filepath.Join(base, "state.json") || parsed.Servers[0].CA != filepath.Join(base, "server-ca.pem") {
		return out, errors.New("foreign_data_path")
	}
	if parsed.Servers[0].ServerID != trustedServer || parsed.Servers[0].Origin != trustedOrigin {
		return out, errors.New("server_identity_changed")
	}
	out.FixedPaths, out.ServerVerified = true, true
	identity := sha256.Sum256([]byte(parsed.DeviceID))
	out.DeviceIDHash = hex.EncodeToString(identity[:])
	_, out.CA, err = readPrivate(filepath.Join(base, "server-ca.pem"), uid, gid, 64*1024)
	if err != nil {
		return out, err
	}
	if out.CA.SHA256 != caHash {
		return out, errors.New("certificate_identity_changed")
	}
	_, out.State, err = readPrivate(filepath.Join(base, "state.json"), uid, gid, 2*1024*1024)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return out, err
	}
	return out, nil
}

func readPrivate(path string, uid, gid uint32, limit int64) ([]byte, fileMetadata, error) {
	var meta fileMetadata
	fd, err := syscall.Open(path, syscall.O_RDONLY|syscall.O_NOFOLLOW|syscall.O_NONBLOCK|syscall.O_CLOEXEC, 0)
	if err != nil {
		if errors.Is(err, syscall.ENOENT) {
			return nil, meta, os.ErrNotExist
		}
		return nil, meta, errors.New("file_open")
	}
	file := os.NewFile(uintptr(fd), path)
	defer file.Close()
	before, err := file.Stat()
	if err != nil || !before.Mode().IsRegular() || before.Mode().Perm() != 0600 || before.Size() < 0 || before.Size() > limit {
		return nil, meta, errors.New("file_type_mode_size")
	}
	st, ok := before.Sys().(*syscall.Stat_t)
	if !ok || st.Uid != uid || st.Gid != gid {
		return nil, meta, errors.New("file_owner")
	}
	data, err := io.ReadAll(io.LimitReader(file, limit+1))
	if err != nil || int64(len(data)) != before.Size() {
		return nil, meta, errors.New("file_read_changed")
	}
	after, err := file.Stat()
	if err != nil {
		return nil, meta, errors.New("file_stat")
	}
	end, ok := after.Sys().(*syscall.Stat_t)
	if !ok || st.Dev != end.Dev || st.Ino != end.Ino || st.Mode != end.Mode || st.Uid != end.Uid || st.Gid != end.Gid || st.Size != end.Size || st.Mtim != end.Mtim || st.Ctim != end.Ctim {
		return nil, meta, errors.New("file_identity_changed")
	}
	digest := sha256.Sum256(data)
	meta = fileMetadata{Exists: true, SHA256: hex.EncodeToString(digest[:]), Mode: fmt.Sprintf("%04o", before.Mode().Perm()), UID: st.Uid, GID: st.Gid, Size: st.Size, Device: uint64(st.Dev), Inode: st.Ino}
	return data, meta, nil
}
