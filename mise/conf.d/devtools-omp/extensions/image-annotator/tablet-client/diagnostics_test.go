// Checks diagnostic routing, native input privacy, and loss reporting on the actual TLS WSS transport.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestNativeDiagnosticsUseOnlyActiveAttemptAndDeduplicate(t *testing.T) {
	c, _ := pairedFixture(t, http.NotFoundHandler())
	binding := c.disk.Bindings[docA]
	c.importing = &importFlight{binding: binding}
	post := func(body string) int {
		t.Helper()
		request := httptest.NewRequest(http.MethodPost, "http://"+uiAddress+"/diagnostic", strings.NewReader(body))
		request.RemoteAddr = "127.0.0.1:12345"
		request.Header.Set("Content-Type", "application/json;charset=UTF-8")
		response := httptest.NewRecorder()
		c.handler().ServeHTTP(response, request)
		return response.Code
	}
	valid := `{"importName":"` + binding.ImportName + `","code":"import.receipt_filename_mismatch"}`
	for _, body := range []string{
		`{"importName":"private notebook.pdf","code":"import.receipt_filename_mismatch"}`,
		`{"importName":"` + binding.ImportName + `.pdf","code":"import.receipt_filename_mismatch"}`,
		`{"importName":"` + binding.ImportName + `","code":"import.started"}`,
	} {
		if status := post(body); status != http.StatusConflict {
			t.Fatalf("untrusted diagnostic accepted: HTTP %d", status)
		}
	}
	for _, field := range []string{`"serverId":"server-b"`, `"jobId":"private-job"`, `"message":"private content"`, `"filename":"private.pdf"`, `"documentUUID":"` + docB + `"`} {
		body := strings.TrimSuffix(valid, "}") + "," + field + "}"
		if status := post(body); status != http.StatusBadRequest {
			t.Fatalf("caller supplied diagnostic context accepted: HTTP %d", status)
		}
	}
	for range 2 {
		if status := post(valid); status != http.StatusOK {
			t.Fatalf("active native diagnostic rejected: HTTP %d", status)
		}
	}
	q := c.servers[binding.ServerID].diagnostics.events
	select {
	case event := <-q:
		if event.ServerID != binding.ServerID || event.JobID != binding.JobID || event.RequestID != binding.RequestID || event.ImportName != binding.ImportName || event.DeviceID != c.config.DeviceID || event.Code != importReceiptFilenameMismatch || event.Level != "warn" {
			t.Fatalf("diagnostic crossed immutable identity: %+v", event)
		}
		if _, err := time.Parse(time.RFC3339Nano, event.Timestamp); err != nil || !strings.HasSuffix(event.Timestamp, "Z") {
			t.Fatal("diagnostic timestamp is not UTC RFC3339Nano")
		}
	default:
		t.Fatal("active diagnostic was not queued")
	}
	select {
	case <-q:
		t.Fatal("duplicate or rejected native diagnostic was queued")
	default:
	}
	select {
	case <-c.servers["server-b"].diagnostics.events:
		t.Fatal("diagnostic leaked to another paired server")
	default:
	}
	c.importing = nil
	if status := post(valid); status != http.StatusConflict {
		t.Fatal("late diagnostic accepted after import ended")
	}
	binding.ImportName = "pi-ink-" + strings.Repeat("c", 32)
	c.importing = &importFlight{binding: binding}
	if err := c.nativeDiagnostic(binding.ImportName, importReceiptFilenameMismatch); err != nil {
		t.Fatal(err)
	}
	select {
	case event := <-q:
		if event.ImportName != binding.ImportName {
			t.Fatal("new attempt inherited the old diagnostic identity")
		}
	default:
		t.Fatal("new attempt inherited the old deduplication state")
	}
}

func TestDiagnosticQueueReportsOverflowOnNextWSSDelivery(t *testing.T) {
	packets := make(chan json.RawMessage, 3)
	c, _ := pairedFixture(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/tablet/v1/events" || r.Header.Get("Authorization") != "Bearer "+strings.Repeat("a", 32) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		conn, err := (&websocket.Upgrader{}).Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()
		conn.SetReadDeadline(time.Now().Add(5 * time.Second))
		for range 3 {
			_, packet, err := conn.ReadMessage()
			if err != nil {
				return
			}
			packets <- packet
		}
	}))
	binding := c.disk.Bindings[docA]
	for range diagnosticQueueSize + 2 {
		c.diagnostic(binding, importStarted)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	done := make(chan struct{})
	go func() {
		defer close(done)
		c.connect(ctx, c.servers[binding.ServerID])
	}()
	for i := range 3 {
		select {
		case packet := <-packets:
			var event diagnosticEvent
			if err := json.Unmarshal(packet, &event); err != nil {
				t.Fatal(err)
			}
			if i == 0 {
				if event.Type != "status" {
					t.Fatal("initial hardware status changed")
				}
				continue
			}
			wantDrops := uint64(0)
			if i == 1 {
				wantDrops = 2
			}
			if event.Type != "diagnostic" || event.DroppedBefore != wantDrops || event.ServerID != binding.ServerID || event.RequestID != binding.RequestID || event.SchemaVersion != 1 {
				t.Fatalf("wrong loss report or routing on WSS: %+v", event)
			}
		case <-ctx.Done():
			t.Fatal("authenticated diagnostic WSS delivery timed out")
		}
	}
	select {
	case <-done:
	case <-ctx.Done():
		t.Fatal("WSS writer did not stop after peer close")
	}
}

func TestImportFailureRetainsAttemptAndSafeError(t *testing.T) {
	c, _ := pairedFixture(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte("private upstream response body"))
	}))
	delete(c.disk.Bindings, docA)
	r := c.servers["server-a"]
	job := r.jobs["same-job"]
	job.DocumentUUID = ""
	r.jobs[job.JobID] = job
	if err := c.beginImport("server-a", job.JobID); err == nil {
		t.Fatal("rejected source request succeeded")
	}
	var started, failed diagnosticEvent
	select {
	case started = <-r.diagnostics.events:
	default:
		t.Fatal("import start was not queued")
	}
	select {
	case failed = <-r.diagnostics.events:
	default:
		t.Fatal("synchronous import error was lost")
	}
	if started.Code != importStarted || failed.Code != importFailed || started.ImportName != failed.ImportName || !importNamePattern.MatchString(failed.ImportName) || failed.JobID != job.JobID || failed.RequestID != job.RequestID || failed.ServerID != "server-a" || failed.Level != "error" || failed.Message != "paired server rejected request" {
		t.Fatalf("import failure lost its attempt or safe cause: %+v / %+v", started, failed)
	}
	private := "/private/notebook/state.json: secret credential"
	if got := importFailureMessage(errors.New(private)); strings.Contains(got, private) || len(got) > 512 {
		t.Fatal("unknown dependency error leaked into diagnostics")
	}
	if err := c.setCurrent(docB); err != nil {
		t.Fatal(err)
	}
	if err := c.beginImport("server-a", job.JobID); err == nil {
		t.Fatal("rejected source request succeeded on retry")
	}
	if state := c.view(); state["documentUUID"] != docB || state["status"] != "pending" || state["message"] != "" {
		t.Fatal("failed import overwrote another server's active document state")
	}
}
