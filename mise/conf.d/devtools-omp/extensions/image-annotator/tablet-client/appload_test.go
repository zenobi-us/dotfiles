// Exercise AppLoad framing over real Unix packets, including C++ zero-byte sends.
package main

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"time"
)

func TestAppLoadEmptyPolls(t *testing.T) {
	peer, done := appLoadFixture(t)
	for i := range 3 {
		// Coordinator messages must not consume or corrupt the next poll.
		body := []byte("coordinator state")
		if i == 1 {
			body = make([]byte, 4096)
		}
		sendAppLoadRecord(t, peer, appLoadHeader(0, uint32(len(body))))
		sendAppLoadRecord(t, peer, body)
		sendAppLoadRecord(t, peer, appLoadHeader(1, 0))
		sendAppLoadRecord(t, peer, nil)
		header := make([]byte, 8)
		n, _, flags, _, err := peer.ReadMsgUnix(header, nil)
		if err != nil || n != 8 || flags&syscall.MSG_TRUNC != 0 || binary.LittleEndian.Uint32(header) != 2 {
			t.Fatalf("poll %d reply header: n=%d flags=%d err=%v", i, n, flags, err)
		}
		reply := make([]byte, 4096)
		n, _, flags, _, err = peer.ReadMsgUnix(reply, nil)
		if err != nil || flags&syscall.MSG_TRUNC != 0 || n != int(binary.LittleEndian.Uint32(header[4:])) {
			t.Fatalf("poll %d reply body: n=%d flags=%d err=%v", i, n, flags, err)
		}
		var states []map[string]string
		if err := json.Unmarshal(reply[:n], &states); err != nil {
			t.Fatal(err)
		}
		if len(states) != 1 || states[0]["serverId"] != "server-a" || states[0]["name"] != "same display name" || states[0]["connection"] != "available — not paired" {
			t.Fatalf("poll %d did not verify fixture TLS identity: %v", i, states)
		}
	}
	sendAppLoadRecord(t, peer, appLoadHeader(0xffffffff, 0))
	sendAppLoadRecord(t, peer, nil)
	if err := <-done; err != nil {
		t.Fatalf("explicit terminate: %v", err)
	}
}

func TestAppLoadRejectsInvalidRecords(t *testing.T) {
	for _, test := range []struct {
		name   string
		header []byte
		body   []byte
	}{
		{"short header", []byte{1}, nil},
		{"truncated header", append(appLoadHeader(1, 0), 1), nil},
		{"over limit", appLoadHeader(1, 4097), nil},
		{"short body", appLoadHeader(1, 2), []byte{1}},
		{"empty nonempty body", appLoadHeader(1, 1), []byte{}},
		{"unexpected body", appLoadHeader(1, 0), []byte{1}},
		{"long body", appLoadHeader(1, 1), []byte{1, 2}},
		{"truncated body", appLoadHeader(1, 4096), make([]byte, 4097)},
	} {
		t.Run(test.name, func(t *testing.T) {
			peer, done := appLoadFixture(t)
			sendAppLoadRecord(t, peer, test.header)
			if test.body != nil {
				sendAppLoadRecord(t, peer, test.body)
			}
			if err := <-done; err == nil {
				t.Fatal("backend accepted an invalid frame")
			}
		})
	}
}

func TestAppLoadDisconnect(t *testing.T) {
	for _, partialBody := range []bool{false, true} {
		t.Run(map[bool]string{false: "header", true: "body"}[partialBody], func(t *testing.T) {
			peer, done := appLoadFixture(t)
			if partialBody {
				sendAppLoadRecord(t, peer, appLoadHeader(1, 1))
			}
			peer.Close()
			err := <-done
			if err == nil {
				t.Fatal("backend accepted a disconnected peer")
			}
			if !partialBody && !errors.Is(err, io.EOF) {
				t.Fatalf("disconnected header: %v", err)
			}
		})
	}
}

func appLoadFixture(t *testing.T) (*net.UnixConn, <-chan error) {
	t.Helper()
	_, config := pairedFixture(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			http.NotFound(w, r)
			return
		}
		io.WriteString(w, `{"service":"pi-ink-bridge","id":"server-a","protocol":2,"status":"ready"}`)
	}))
	config.Servers = config.Servers[:1]
	data, err := json.Marshal(config)
	if err != nil {
		t.Fatal(err)
	}
	configPath := filepath.Join(t.TempDir(), "config.json")
	if err := os.WriteFile(configPath, data, 0600); err != nil {
		t.Fatal(err)
	}
	// Keep below the Unix socket path limit even in long worktree paths.
	dir, err := os.MkdirTemp("", "appload-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	listener, err := net.ListenUnix("unixpacket", &net.UnixAddr{Name: filepath.Join(dir, "socket"), Net: "unixpacket"})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { listener.Close() })
	deadline := time.Now().Add(5 * time.Second)
	listener.SetDeadline(deadline)
	done := make(chan error, 1)
	exited := make(chan struct{})
	go func() {
		done <- runAppLoad(listener.Addr().String(), configPath)
		close(exited)
	}()
	peer, err := listener.AcceptUnix()
	if err != nil {
		t.Fatal(err)
	}
	peer.SetDeadline(deadline)
	timer := time.AfterFunc(time.Until(deadline), func() { peer.Close() })
	t.Cleanup(func() { timer.Stop() })
	t.Cleanup(func() {
		peer.Close()
		select {
		case <-exited:
		case <-time.After(5 * time.Second):
			t.Error("AppLoad backend did not exit after peer close")
		}
	})
	return peer, done
}

func appLoadHeader(kind, length uint32) []byte {
	header := make([]byte, 8)
	binary.LittleEndian.PutUint32(header, kind)
	binary.LittleEndian.PutUint32(header[4:], length)
	return header
}

func sendAppLoadRecord(t *testing.T, peer *net.UnixConn, body []byte) {
	t.Helper()
	raw, err := peer.SyscallConn()
	if err != nil {
		t.Fatal(err)
	}
	var sendErr error
	// syscall.SendmsgN emits a real record for len(body)==0, like C++ send.
	if err = raw.Write(func(fd uintptr) bool {
		var n int
		n, sendErr = syscall.SendmsgN(int(fd), body, nil, nil, 0)
		if sendErr == syscall.EAGAIN || sendErr == syscall.EWOULDBLOCK {
			return false
		}
		if sendErr == nil && n != len(body) {
			sendErr = io.ErrShortWrite
		}
		return true
	}); err != nil {
		t.Fatal(err)
	}
	if sendErr != nil {
		t.Fatal(sendErr)
	}
}
