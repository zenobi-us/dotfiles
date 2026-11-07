// Exercises stable identities, terminal cancellation, and immutable consent without hardware mocks.
package main

import (
	"context"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

const docA = "11111111-1111-1111-1111-111111111111"
const docB = "22222222-2222-2222-2222-222222222222"

func pairedFixture(t *testing.T, handler http.Handler) (*Client, Config) {
	t.Helper()
	server := httptest.NewTLSServer(handler)
	t.Cleanup(server.Close)
	directory := t.TempDir()
	ca := filepath.Join(directory, "ca.pem")
	if err := os.WriteFile(ca, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw}), 0600); err != nil {
		t.Fatal(err)
	}
	config := Config{DeviceID: "tablet-synthetic", UIAddress: uiAddress, StatePath: filepath.Join(directory, "state.json"), Servers: []ServerConfig{{ServerID: "server-a", Name: "same display name", Origin: server.URL, CA: ca, Token: strings.Repeat("a", 32)}, {ServerID: "server-b", Name: "same display name", Origin: server.URL, CA: ca, Token: strings.Repeat("b", 32)}}}
	c, err := newClient(config)
	if err != nil {
		t.Fatal(err)
	}
	for id, r := range c.servers {
		document := docA
		if id == "server-b" {
			document = docB
		}
		b := Binding{ServerID: id, JobID: "same-job", RequestID: "same-request", SourceDigest: strings.Repeat("a", 64), DocumentUUID: document, ImportName: "pi-ink-" + strings.Repeat("a", 32), Status: "pending"}
		c.disk.Bindings[document] = b
		r.online = true
		r.jobs[b.JobID] = Job{JobID: b.JobID, RequestID: b.RequestID, SourceDigest: b.SourceDigest, DocumentUUID: document, State: "pending"}
	}
	c.current = docA
	c.status = "pending"
	return c, config
}
func TestLocalUIAcceptsQtJSONCharset(t *testing.T) {
	c, _ := pairedFixture(t, http.NotFoundHandler())
	request := httptest.NewRequest(http.MethodPost, "http://"+uiAddress+"/current", strings.NewReader(`{"documentUUID":""}`))
	request.RemoteAddr = "127.0.0.1:12345"
	request.Header.Set("Content-Type", "application/json;charset=UTF-8")
	response := httptest.NewRecorder()
	c.handler().ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("Qt current-document request: status %d, body %s", response.Code, response.Body.String())
	}

	request = httptest.NewRequest(http.MethodGet, "http://"+uiAddress+"/state", nil)
	request.RemoteAddr = "127.0.0.1:12345"
	response = httptest.NewRecorder()
	c.handler().ServeHTTP(response, request)
	var state struct {
		DocumentUUID *string `json:"documentUUID"`
	}
	if err := json.NewDecoder(response.Body).Decode(&state); err != nil {
		t.Fatal(err)
	}
	if response.Code != http.StatusOK || state.DocumentUUID == nil || *state.DocumentUUID != "" {
		t.Fatalf("Qt Library request did not clear the previous document: status %d, state %+v", response.Code, state)
	}
}

func TestAssociationSurvivesRestartAndDisplayNameCollision(t *testing.T) {
	c, config := pairedFixture(t, http.NotFoundHandler())
	c.mu.Lock()
	err := c.persistLocked()
	c.mu.Unlock()
	if err != nil {
		t.Fatal(err)
	}
	config.Servers[0].Name = "renamed"
	restored, err := newClient(config)
	if err != nil {
		t.Fatal(err)
	}
	for _, document := range []string{docA, docB} {
		if err = restored.setCurrent(document); err != nil {
			t.Fatal(err)
		}
		state := restored.view()
		expected := "server-a"
		if document == docB {
			expected = "server-b"
		}
		if state["serverId"] != expected || state["connection"] != "offline" {
			t.Fatalf("wrong persisted identity: %v", state)
		}
	}
	if err = restored.setCurrent("33333333-3333-3333-3333-333333333333"); err != nil {
		t.Fatal(err)
	}
	if state := restored.view(); state["status"] != "unassociated" || state["canSend"] != false || state["serverId"] != nil {
		t.Fatalf("guessed association: %v", state)
	}
}
func TestCancellationCannotReviveOrAffectOtherServer(t *testing.T) {
	c, config := pairedFixture(t, http.NotFoundHandler())
	r := c.servers["server-a"]
	job := r.jobs["same-job"]
	job.State = "cancelled"
	if err := c.applyJobs(r, []Job{job}); err != nil {
		t.Fatal(err)
	}
	job.State = "pending"
	if err := c.applyJobs(r, []Job{job}); err != nil {
		t.Fatal(err)
	}
	if c.view()["status"] != "cancelled" {
		t.Fatal("cancelled job revived")
	}
	if err := c.submit(docA, false, ""); err == nil {
		t.Fatal("cancelled job accepted Send")
	}
	if err := c.setCurrent(docB); err != nil {
		t.Fatal(err)
	}
	if c.view()["canSend"] != true {
		t.Fatal("one server cancellation leaked into another server")
	}
	restored, err := newClient(config)
	if err != nil {
		t.Fatal(err)
	}
	if restored.disk.Terminal[key("server-a", "same-job")] != "cancelled" {
		t.Fatal("terminal cancellation was not persisted")
	}
}
func TestConfirmRejectsReplacedDisplayedResult(t *testing.T) {
	c, _ := pairedFixture(t, http.NotFoundHandler())
	pending := &consent{DocumentUUID: docA, RequestID: "same-request", SourceDigest: strings.Repeat("a", 64), ExportDigest: strings.Repeat("b", 64), Consent: "immutable-remote-nonce", ConfirmationID: "new-result"}
	c.pending = pending
	c.status = "confirmation-required"
	for _, id := range []string{"", "old-result"} {
		if err := c.submit(docA, true, id); err == nil {
			t.Fatal("stale displayed result accepted")
		}
	}
	if c.pending != pending || c.view()["status"] != "confirmation-required" {
		t.Fatal("rejected confirmation changed the currently displayed consent")
	}
}
func TestSwitchCancelsBeforeInvalidationAndBlocksNewSend(t *testing.T) {
	entered := make(chan struct{})
	release := make(chan struct{})
	released := false
	defer func() {
		if !released {
			close(release)
		}
	}()
	var cancelled atomic.Bool
	c, _ := pairedFixture(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/tablet/v1/jobs/same-job/invalidate" {
			w.WriteHeader(404)
			return
		}
		if !cancelled.Load() {
			t.Error("switch invalidated before cancelling in-flight operation")
		}
		close(entered)
		select {
		case <-release:
		case <-r.Context().Done():
		}
		w.Write([]byte(`{}`))
	}))
	c.cancel = func() { cancelled.Store(true) }
	c.pending = &consent{DocumentUUID: docA, ConfirmationID: "old"}
	done := make(chan error, 1)
	go func() { done <- c.setCurrent(docB) }()
	select {
	case <-entered:
	case <-time.After(5 * time.Second):
		t.Fatal("switch did not invalidate remote result")
	}
	if c.view()["canSend"] != false {
		t.Fatal("new document could send before invalidation completed")
	}
	if err := c.submit(docB, true, "old"); err == nil {
		t.Fatal("old confirmation crossed document switch")
	}
	select {
	case err := <-done:
		t.Fatalf("invalidation completed before release: %v", err)
	default:
	}
	close(release)
	released = true
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("invalidation did not release the next document")
	}
	if c.view()["canSend"] != true {
		t.Fatal("successful invalidation did not enable the next document")
	}
}
func TestImportReceiptRejectsUnrelatedLateAndDuplicateSignals(t *testing.T) {
	c, _ := pairedFixture(t, http.NotFoundHandler())
	name := "pi-ink-" + strings.Repeat("c", 32)
	c.importing = &importFlight{binding: Binding{ImportName: name}, receipt: make(chan importReceipt, 1), ready: make(chan struct{}, 1), acceptingReceipt: true}
	if err := c.imported("private notebook", docA, ""); err == nil {
		t.Fatal("arbitrary library event accepted")
	}
	if err := c.imported(name, "../private", ""); err == nil {
		t.Fatal("unsafe UUID accepted")
	}
	if err := c.imported(name, docB, docA); err != nil {
		t.Fatal(err)
	}
	receipt := <-c.importing.receipt
	if receipt.Document != docB || receipt.Folder != docA {
		t.Fatal("actual Library identity was not retained")
	}
	if err := c.imported(name, docA, ""); err == nil {
		t.Fatal("duplicate receipt could replace original UUID")
	}
	if err := c.imported(name, docB, docA); err != nil {
		t.Fatal("lost receipt acknowledgement could not be recovered:", err)
	}
	c.importing = nil
	if err := c.imported(name, docB, docA); err == nil {
		t.Fatal("late receipt accepted after import ended")
	}
}
func TestFailedSwitchInvalidationKeepsConsentStale(t *testing.T) {
	c, _ := pairedFixture(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(503) }))
	c.pending = &consent{DocumentUUID: docA, ConfirmationID: "old"}
	if err := c.setCurrent(docB); err == nil {
		t.Fatal("failed remote invalidation reported success")
	}
	if c.pending != nil || c.view()["canSend"] != false {
		t.Fatal("failed invalidation left reusable consent or allowed another send")
	}
	if err := c.submit(docB, true, "old"); err == nil {
		t.Fatal("stale confirmation crossed failed invalidation")
	}
}
func TestImportRejectsExplicitHTTPContradictionsBeforeNativeBinding(t *testing.T) {
	for name, response := range map[string]string{
		"conflicting fields":           `{"id":"` + docA + `","uuid":"` + docB + `"}`,
		"invalid explicit identity":    `{"id":"../../private"}`,
		"normalized identity mismatch": `{"id":"{ABCDEFAB-CDEF-ABCD-EFAB-CDEFABCDEFAB}"}`,
	} {
		t.Run(name, func(t *testing.T) {
			receipts := make(chan importReceipt, 1)
			receipts <- importReceipt{Document: docA, Folder: docB}
			if _, err := resolveImportIdentity(context.Background(), []byte(response), receipts); err == nil {
				t.Fatal("explicit HTTP identity failure was treated as absent and accepted a native binding")
			}
		})
	}
}
func TestRemoteCancellationCancelsOutstandingOperation(t *testing.T) {
	c, _ := pairedFixture(t, http.NotFoundHandler())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c.cancel = cancel
	j := c.servers["server-a"].jobs["same-job"]
	j.State = "cancelled"
	if err := c.applyJobs(c.servers["server-a"], []Job{j}); err != nil {
		t.Fatal(err)
	}
	select {
	case <-ctx.Done():
	default:
		t.Fatal("remote cancellation did not abort outstanding operation")
	}
}

func TestImportNeverGuessesAParentFromHTTPIdentity(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if receipt, err := resolveImportIdentity(ctx, []byte(`{"id":"`+docA+`"}`), make(chan importReceipt)); err == nil || receipt.Document != "" {
		t.Fatal("bare HTTP UUID was treated as a native document/parent receipt")
	}
	receipts := make(chan importReceipt, 1)
	receipts <- importReceipt{Document: docB, Folder: docA}
	if _, err := resolveImportIdentity(context.Background(), []byte(`{"id":"`+docA+`"}`), receipts); err == nil {
		t.Fatal("conflicting HTTP and native document UUIDs were accepted")
	}
}
