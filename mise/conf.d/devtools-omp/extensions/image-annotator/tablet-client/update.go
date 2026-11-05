// The tablet UI can run one update command without a shell installer or SSH.
// Only the executable changes. Preferences stay in place; VERSION remains the initial install manifest.
package main

import (
	"archive/tar"
	"compress/gzip"
	"debug/elf"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"golang.org/x/sys/unix"
)

type updateResult struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

var errUpdateInProgress = errors.New("another client update is active; wait for it to finish")

func updateClient(client *http.Client, base, executable string) (updateResult, error) {
	executable, err := filepath.EvalSymlinks(executable)
	if err != nil {
		return updateResult{}, errors.New("cannot resolve installed client for update")
	}
	installed, err := os.Lstat(executable)
	if err != nil || !installed.Mode().IsRegular() {
		return updateResult{}, errors.New("update requires an existing regular client executable")
	}
	directory := filepath.Dir(executable)
	lock, err := os.OpenFile(filepath.Join(directory, ".update.lock"), os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return updateResult{}, errors.New("cannot open client update lock")
	}
	defer lock.Close()
	if err := unix.Flock(int(lock.Fd()), unix.LOCK_EX|unix.LOCK_NB); err != nil {
		if errors.Is(err, unix.EWOULDBLOCK) {
			return updateResult{}, errUpdateInProgress
		}
		return updateResult{}, errors.New("cannot lock installed client for update")
	}
	defer unix.Flock(int(lock.Fd()), unix.LOCK_UN)
	stage, err := os.MkdirTemp(directory, ".update-*")
	if err != nil {
		return updateResult{}, errors.New("cannot create update stage beside installed client")
	}
	defer os.RemoveAll(stage)
	archive := filepath.Join(stage, "bundle.tar.gz")
	if err := downloadBundle(client, base, archive); err != nil {
		return updateResult{}, fmt.Errorf("download update: %w", err)
	}
	bundleVersion, err := unpackUpdate(archive, stage)
	if err != nil {
		return updateResult{}, err
	}
	replacement := filepath.Join(stage, "pi-ink-client")
	if err := validateUpdateExecutable(replacement); err != nil {
		return updateResult{}, err
	}
	// A same-filesystem rename leaves running callers on the old inode and future launches on the new one.
	if err := os.Rename(replacement, executable); err != nil {
		return updateResult{}, errors.New("cannot replace installed client; previous executable is unchanged")
	}
	return updateResult{Status: "updated", Version: bundleVersion}, nil
}

func unpackUpdate(archive, stage string) (string, error) {
	file, err := os.Open(archive)
	if err != nil {
		return "", err
	}
	defer file.Close()
	compressed, err := gzip.NewReader(file)
	if err != nil {
		return "", errors.New("update bundle is not a gzip archive")
	}
	defer compressed.Close()
	reader := tar.NewReader(io.LimitReader(compressed, maximumBundleSize+(1<<20)))
	seen := make(map[string]bool, 3)
	var bundleVersion string
	for {
		header, err := reader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return "", errors.New("cannot read update archive")
		}
		if seen[header.Name] || header.Typeflag != tar.TypeReg && header.Typeflag != tar.TypeRegA || header.Size < 0 || header.Size > maximumBundleSize {
			return "", errors.New("update bundle requires three unique regular files")
		}
		seen[header.Name] = true
		switch header.Name {
		case "pi-ink-client":
			if err := stageUpdateExecutable(reader, filepath.Join(stage, "pi-ink-client")); err != nil {
				return "", err
			}
		case "VERSION":
			if header.Size > 64 {
				return "", errors.New("update VERSION exceeds 64 bytes")
			}
			body, err := io.ReadAll(reader)
			if err != nil {
				return "", errors.New("cannot read update VERSION")
			}
			bundleVersion = strings.TrimSpace(string(body))
		case "install.sh":
			if header.Size > 1<<20 {
				return "", errors.New("update installer exceeds 1 MiB")
			}
			// The archive has the normal provisioning layout, but updates never execute its installer.
		default:
			return "", errors.New("update bundle contains an unexpected path")
		}
	}
	if len(seen) != 3 || !seen["pi-ink-client"] || !seen["VERSION"] || !seen["install.sh"] || bundleVersion == "" {
		return "", errors.New("update bundle requires pi-ink-client, VERSION, and install.sh")
	}
	return bundleVersion, nil
}

func stageUpdateExecutable(reader io.Reader, path string) error {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return errors.New("cannot create staged client executable")
	}
	defer file.Close()
	if _, err := io.Copy(file, reader); err != nil {
		return errors.New("cannot write staged client executable")
	}
	if err := file.Chmod(0700); err != nil {
		return errors.New("cannot set staged client executable permissions")
	}
	if err := file.Sync(); err != nil {
		return errors.New("cannot sync staged client executable")
	}
	return file.Close()
}

func validateUpdateExecutable(path string) error {
	file, err := elf.Open(path)
	if err != nil {
		return errors.New("update client is not an ELF executable")
	}
	defer file.Close()
	var machine elf.Machine
	switch runtime.GOARCH {
	case "arm64":
		machine = elf.EM_AARCH64
	case "amd64":
		machine = elf.EM_X86_64
	default:
		return errors.New("client updates support Linux ARM64 and AMD64 only")
	}
	if file.Class != elf.ELFCLASS64 || file.Data != elf.ELFDATA2LSB || file.Machine != machine || file.Type != elf.ET_EXEC && file.Type != elf.ET_DYN {
		return errors.New("update client does not match this device architecture")
	}
	for _, program := range file.Progs {
		if program.Type == elf.PT_LOAD && program.Flags&elf.PF_X != 0 && program.Filesz > 0 {
			return nil
		}
	}
	return errors.New("update client has no executable load segment")
}
