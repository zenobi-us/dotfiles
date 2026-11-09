// A real temporary home proves repeat installation preserves client data and unrelated launchers.
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInstallPreservesDraftsPairingAndRejectsChangedIdentity(t *testing.T) {
	home := t.TempDir()
	source := t.TempDir()
	for _, dir := range []string{"xovi/exthome/appload", "xovi/exthome/qt-resource-rebuilder"} {
		if err := os.MkdirAll(filepath.Join(home, dir), 0700); err != nil {
			t.Fatal(err)
		}
	}
	for _, name := range []string{"pi-ink-client", "VERSION", "sidebar.qmd", "app/manifest.json", "app/resources.rcc", "app/backend/entry"} {
		path := filepath.Join(source, name)
		os.MkdirAll(filepath.Dir(path), 0700)
		os.WriteFile(path, []byte(name), 0600)
	}
	server := httptest.NewTLSServer(http.NotFoundHandler())
	defer server.Close()
	digest := sha256.Sum256(server.Certificate().Raw)
	record := bootstrapServer{ServerID: "server-a", Name: "desktop", Origin: server.URL, Certificate: string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw})), Fingerprint: hex.EncodeToString(digest[:])}
	bytes, _ := json.Marshal(record)
	bootstrap := filepath.Join(t.TempDir(), "server.json")
	os.WriteFile(bootstrap, bytes, 0600)
	release := strings.Repeat("a", 64)
	if err := installRelease(source, bootstrap, home, release); err != nil {
		t.Fatal(err)
	}
	base := filepath.Join(home, ".local/share/pi-ink-bridge")
	configBefore, err := os.ReadFile(filepath.Join(base, "config.json"))
	if err != nil {
		t.Fatal(err)
	}
	var config Config
	json.Unmarshal(configBefore, &config)
	client, err := newClient(config)
	if err != nil {
		t.Fatal(err)
	}
	client.disk.Tokens["server-a"] = strings.Repeat("b", 64)
	client.mu.Lock()
	err = client.persistLocked()
	client.mu.Unlock()
	if err != nil {
		t.Fatal(err)
	}
	stateBefore, _ := os.ReadFile(config.StatePath)
	draft := filepath.Join(base, "draft.pdf")
	os.WriteFile(draft, []byte("retained editable draft"), 0600)
	unrelated := filepath.Join(home, "xovi/exthome/appload/unrelated")
	os.Mkdir(unrelated, 0700)
	if err = installRelease(source, bootstrap, home, release); err != nil {
		t.Fatal(err)
	}
	configAfter, _ := os.ReadFile(filepath.Join(base, "config.json"))
	stateAfter, _ := os.ReadFile(config.StatePath)
	draftAfter, _ := os.ReadFile(draft)
	if string(configAfter) != string(configBefore) || string(stateAfter) != string(stateBefore) || string(draftAfter) != "retained editable draft" {
		t.Fatal("repeat install changed private data")
	}
	if _, err = os.Stat(unrelated); err != nil {
		t.Fatal("unrelated launcher lost")
	}
	restored, err := newClient(config)
	if err != nil || restored.servers["server-a"].credential.Load().(string) != strings.Repeat("b", 64) {
		t.Fatal("pairing did not survive installation")
	}
	record.Fingerprint = strings.Repeat("0", 64)
	bytes, _ = json.Marshal(record)
	os.WriteFile(bootstrap, bytes, 0600)
	if err = installRelease(source, bootstrap, home, release); err == nil {
		t.Fatal("accepted changed server fingerprint")
	}
}

func TestConnectionScreenRejectsWrongServerAndUntrustedTLS(t *testing.T) {
	identity := "server-a"
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{"service": "pi-ink-bridge", "id": identity, "protocol": 2, "status": "ready"})
	}))
	defer server.Close()
	ca := filepath.Join(t.TempDir(), "ca.pem")
	os.WriteFile(ca, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw}), 0600)
	config := Config{DeviceID: "test-device", UIAddress: uiAddress, StatePath: filepath.Join(t.TempDir(), "state.json"), Servers: []ServerConfig{{ServerID: "server-a", Name: "desktop", Origin: server.URL, CA: ca}}}
	client, err := newClient(config)
	if err != nil {
		t.Fatal(err)
	}
	if state := client.connectionView(context.Background()); state[0]["connection"] != "available — not paired" {
		t.Fatalf("verified connection: %v", state)
	}
	identity = "server-b"
	if state := client.connectionView(context.Background()); state[0]["connection"] != "offline" {
		t.Fatal("accepted wrong server identity")
	}
	identity = "server-a"
	transport := client.servers["server-a"].client.Transport.(*http.Transport)
	transport.CloseIdleConnections()
	transport.TLSClientConfig.ServerName = "not-this-server.invalid"
	if state := client.connectionView(context.Background()); state[0]["connection"] != "offline" {
		t.Fatal("accepted certificate hostname mismatch")
	}
}
