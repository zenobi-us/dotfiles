// Exercises cancellation at the real HTTPS preflight boundary, before remote consent.
package main

import (
	"net/http"
	"sync/atomic"
	"testing"
	"time"
)

func TestSwitchDuringRemotePreflightCannotConfirm(t *testing.T) {
	entered := make(chan struct{})
	var confirms atomic.Int32
	var invalidations atomic.Int32
	c, _ := pairedFixture(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/tablet/v1/jobs/same-job":
			close(entered)
			<-r.Context().Done()
		case "/tablet/v1/jobs/same-job/invalidate":
			invalidations.Add(1)
			w.Write([]byte(`{}`))
		case "/tablet/v1/jobs/same-job/confirm":
			confirms.Add(1)
			w.Write([]byte(`{"status":"completed"}`))
		default:
			w.WriteHeader(404)
		}
	}))
	c.pending = &consent{DocumentUUID: docA, ConfirmationID: "displayed-result", Consent: "remote-nonce"}
	c.status = "confirmation-required"
	done := make(chan error, 1)
	go func() { done <- c.submit(docA, true, "displayed-result") }()
	select {
	case <-entered:
	case <-time.After(5 * time.Second):
		t.Fatal("HTTPS preflight did not start")
	}
	if err := c.setCurrent(docB); err != nil {
		t.Fatal(err)
	}
	select {
	case err := <-done:
		if err == nil {
			t.Fatal("switched confirmation succeeded")
		}
	case <-time.After(5 * time.Second):
		t.Fatal("switch did not cancel HTTPS preflight")
	}
	if confirms.Load() != 0 || invalidations.Load() != 1 {
		t.Fatalf("remote actions: confirms=%d invalidations=%d", confirms.Load(), invalidations.Load())
	}
	if c.pending != nil || c.view()["documentUUID"] != docB || c.view()["canSend"] != true {
		t.Fatal("switch retained consent or failed to release next document")
	}
}
