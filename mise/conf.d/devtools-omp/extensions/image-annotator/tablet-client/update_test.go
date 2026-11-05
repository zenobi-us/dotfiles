// Updates must preserve the working client on failure and keep UI preferences across replacement.
package main

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type updateArchiveMember struct {
	name     string
	body     string
	file     string
	typeflag byte
}

type rejectedUpdateCase struct {
	name        string
	members     []updateArchiveMember
	badChecksum bool
}

func TestUpdateReplacesTheInodeAndPreservesCoordinatorPreference(t *testing.T) {
	executable := updateTestInstallation(t)
	old, err := os.Open(executable)
	if err != nil {
		t.Fatal(err)
	}
	defer old.Close()
	bundle := updateTestBundle(t, standardUpdateMembers(t))
	server := updateTestServer(t, bundle, false, nil, nil)
	_, err = updateClient(server.Client(), server.URL, executable)
	if err != nil {
		t.Fatal(err)
	}
	oldBytes, err := io.ReadAll(old)
	if err != nil || string(oldBytes) != "old executable" {
		t.Fatal("replacement changed the running client's inode")
	}
	oldInfo, _ := old.Stat()
	newInfo, err := os.Stat(executable)
	if err != nil || os.SameFile(oldInfo, newInfo) {
		t.Fatal("client was not replaced atomically")
	}
	if newInfo.Mode().Perm() != 0700 {
		t.Fatal("replacement is not private and executable")
	}
	assertCoordinatorPreference(t, executable)
}

func TestRejectedUpdatePreservesTheInstalledClient(t *testing.T) {
	cases := []rejectedUpdateCase{
		{name: "checksum", members: standardUpdateMembers(t), badChecksum: true},
		{name: "invalid executable", members: []updateArchiveMember{{name: "pi-ink-client", body: "not an executable"}, {name: "VERSION", body: "0.2.0\n"}, {name: "install.sh", body: "exit 99\n"}}},
		{name: "symlink", members: []updateArchiveMember{{name: "pi-ink-client", typeflag: tar.TypeSymlink}, {name: "VERSION", body: "0.2.0\n"}, {name: "install.sh", body: "exit 99\n"}}},
		{name: "outside path", members: []updateArchiveMember{{name: "../pi-ink-client", body: "bad"}, {name: "VERSION", body: "0.2.0\n"}, {name: "install.sh", body: "exit 99\n"}}},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			executable := updateTestInstallation(t)
			bundle := updateTestBundle(t, test.members)
			server := updateTestServer(t, bundle, test.badChecksum, nil, nil)
			if _, err := updateClient(server.Client(), server.URL, executable); err == nil {
				t.Fatal("accepted an invalid update")
			}
			body, err := os.ReadFile(executable)
			if err != nil || string(body) != "old executable" {
				t.Fatal("failed preparation replaced the working client")
			}
			assertCoordinatorPreference(t, executable)
		})
	}
}

func TestConcurrentUpdateRefusesASecondReplacement(t *testing.T) {
	executable := updateTestInstallation(t)
	entered := make(chan struct{}, 1)
	release := make(chan struct{})
	bundle := updateTestBundle(t, standardUpdateMembers(t))
	server := updateTestServer(t, bundle, false, entered, release)
	finished := make(chan error, 1)
	go func() { _, err := updateClient(server.Client(), server.URL, executable); finished <- err }()
	select {
	case <-entered:
	case <-time.After(5 * time.Second):
		close(release)
		t.Fatal("first update did not reach the bundle endpoint")
	}
	_, secondErr := updateClient(server.Client(), server.URL, executable)
	close(release)
	if !errors.Is(secondErr, errUpdateInProgress) {
		t.Fatalf("second update did not refuse the active replacement: %v", secondErr)
	}
	if err := <-finished; err != nil {
		t.Fatal(err)
	}
}

func updateTestInstallation(t *testing.T) string {
	t.Helper()
	directory := t.TempDir()
	executable := filepath.Join(directory, "pi-ink-client")
	if err := os.WriteFile(executable, []byte("old executable"), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(directory, "coordinator-id"), []byte("0123456789abcdef0123456789abcdef\n"), 0600); err != nil {
		t.Fatal(err)
	}
	return executable
}

func standardUpdateMembers(t *testing.T) []updateArchiveMember {
	t.Helper()
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	return []updateArchiveMember{{name: "pi-ink-client", file: executable}, {name: "VERSION", body: "0.2.0\n"}, {name: "install.sh", body: "#!/bin/sh\nexit 99\n"}}
}

func updateTestBundle(t *testing.T, members []updateArchiveMember) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "bundle.tar.gz")
	file, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	compressed := gzip.NewWriter(file)
	archive := tar.NewWriter(compressed)
	for _, member := range members {
		var body io.Reader = strings.NewReader(member.body)
		size := int64(len(member.body))
		var source *os.File
		if member.file != "" {
			source, err = os.Open(member.file)
			if err != nil {
				t.Fatal(err)
			}
			info, err := source.Stat()
			if err != nil {
				source.Close()
				t.Fatal(err)
			}
			size, body = info.Size(), source
		}
		kind := member.typeflag
		if kind == 0 {
			kind = tar.TypeReg
		}
		if err := archive.WriteHeader(&tar.Header{Name: member.name, Size: size, Mode: 0700, Typeflag: kind, Linkname: "outside"}); err != nil {
			t.Fatal(err)
		}
		if _, err := io.Copy(archive, body); err != nil {
			t.Fatal(err)
		}
		if source != nil {
			source.Close()
		}
	}
	if err := archive.Close(); err != nil {
		t.Fatal(err)
	}
	if err := compressed.Close(); err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func updateTestServer(t *testing.T, bundle string, badChecksum bool, entered chan<- struct{}, release <-chan struct{}) *httptest.Server {
	t.Helper()
	file, err := os.Open(bundle)
	if err != nil {
		t.Fatal(err)
	}
	digest := sha256.New()
	if _, err := io.Copy(digest, file); err != nil {
		file.Close()
		t.Fatal(err)
	}
	file.Close()
	checksum := fmt.Sprintf("%x  bundle.tar.gz\n", digest.Sum(nil))
	if badChecksum {
		checksum = strings.Repeat("0", 64) + "  bundle.tar.gz\n"
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/tablet/bundle.sha256":
			io.WriteString(w, checksum)
		case "/tablet/bundle.tar.gz":
			if entered != nil {
				select {
				case entered <- struct{}{}:
				default:
				}
				<-release
			}
			http.ServeFile(w, r, bundle)
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(server.Close)
	server.Client().Timeout = 5 * time.Second
	return server
}

func assertCoordinatorPreference(t *testing.T, executable string) {
	t.Helper()
	body, err := os.ReadFile(filepath.Join(filepath.Dir(executable), "coordinator-id"))
	if err != nil || string(body) != "0123456789abcdef0123456789abcdef\n" {
		t.Fatal("update changed the saved coordinator ID")
	}
}
