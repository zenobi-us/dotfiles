// Diagnostics share each paired server's WSS writer; the bounded queue is best effort, not a receipt log.
package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"regexp"
	"sync/atomic"
	"time"
)

const diagnosticQueueSize = 64

var importNamePattern = regexp.MustCompile(`^pi-ink-[0-9a-f]{32}$`)

type diagnosticCode string

const (
	importStarted                 diagnosticCode = "import.started"
	importSourceVerified          diagnosticCode = "import.source_verified"
	importUploadStarted           diagnosticCode = "import.upload_started"
	importUploadCompleted         diagnosticCode = "import.upload_completed"
	importReceiptReceived         diagnosticCode = "import.receipt_received"
	importReceiptAccepted         diagnosticCode = "import.receipt_accepted"
	importBound                   diagnosticCode = "import.bound"
	importFailed                  diagnosticCode = "import.failed"
	importReceiptFilenameMismatch diagnosticCode = "import.receipt_filename_mismatch"
	importReceiptUUIDInvalid      diagnosticCode = "import.receipt_uuid_invalid"
	importReceiptParentInvalid    diagnosticCode = "import.receipt_parent_invalid"
)

type diagnosticEvent struct {
	Type          string         `json:"type"`
	SchemaVersion int            `json:"schemaVersion"`
	DeviceID      string         `json:"deviceId"`
	ServerID      string         `json:"serverId"`
	JobID         string         `json:"jobId"`
	RequestID     string         `json:"requestId"`
	ImportName    string         `json:"importName"`
	Timestamp     string         `json:"timestamp"`
	ClientVersion string         `json:"clientVersion"`
	Code          diagnosticCode `json:"code"`
	Level         string         `json:"level"`
	Message       string         `json:"message"`
	DroppedBefore uint64         `json:"droppedBefore"`
}

type diagnosticQueue struct {
	events  chan diagnosticEvent
	dropped atomic.Uint64
}

func (q *diagnosticQueue) enqueue(event diagnosticEvent) {
	select {
	case q.events <- event:
	default:
		q.dropped.Add(1)
	}
}

func diagnosticText(code diagnosticCode) (string, string) {
	switch code {
	case importStarted:
		return "info", "Controlled import started"
	case importSourceVerified:
		return "info", "Source PDF verified against the approved synthetic allowlist"
	case importUploadStarted:
		return "info", "Controlled stock upload started"
	case importUploadCompleted:
		return "info", "Controlled stock upload completed"
	case importReceiptReceived:
		return "info", "Native controlled import receipt received"
	case importReceiptAccepted:
		return "info", "Native controlled import receipt accepted"
	case importBound:
		return "info", "Stock association persisted and acknowledged by the originating server"
	case importFailed:
		return "error", "Controlled import failed"
	case importReceiptFilenameMismatch:
		return "warn", "Native receipt filename does not match the controlled upload filename"
	case importReceiptUUIDInvalid:
		return "error", "Native receipt document UUID is invalid"
	case importReceiptParentInvalid:
		return "error", "Native receipt parent UUID is invalid"
	default:
		return "", ""
	}
}

// Caller holds c.mu. Only the captured attempt supplies routing and identity.
func (c *Client) diagnosticLocked(b Binding, code diagnosticCode, failure error) {
	r := c.servers[b.ServerID]
	level, message := diagnosticText(code)
	if r == nil || r.config.ServerID != b.ServerID || !validBinding(b) || !importNamePattern.MatchString(b.ImportName) || level == "" {
		return
	}
	if failure != nil {
		message = importFailureMessage(failure)
	}
	r.diagnostics.enqueue(diagnosticEvent{Type: "diagnostic", SchemaVersion: 1, DeviceID: c.config.DeviceID, ServerID: b.ServerID, JobID: b.JobID, RequestID: b.RequestID, ImportName: b.ImportName, Timestamp: time.Now().UTC().Format(time.RFC3339Nano), ClientVersion: version, Code: code, Level: level, Message: message})
}

func (c *Client) diagnostic(b Binding, code diagnosticCode) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.diagnosticLocked(b, code, nil)
}

// Never forward filesystem paths, response bodies, or unknown dependency errors.
func importFailureMessage(err error) string {
	switch err.Error() {
	case "paired server request failed", "paired server rejected request", "paired server response exceeds limit or was interrupted", "paired server returned invalid JSON",
		"source PDF is not on the owner-approved synthetic SHA256 allowlist", "toolbar did not acknowledge the controlled import name", "import job was cancelled or changed",
		"stock loopback service unavailable", "stock loopback service rejected request", "stock response exceeded limit or was interrupted",
		"Paper Pro requires observations from both UDC controllers", "require detached or powered USB without USB IPv4, stock service on IPv4 localhost:81, and no exposed port80",
		"stock import returned an invalid explicit document UUID", "stock import returned conflicting explicit document UUIDs", "stock response and Library receipt UUIDs disagree",
		"stock import has no matching native document and parent receipt", "import cancelled before binding", "native import destination belongs to another paired server",
		"stock UUID is already associated", "stock association persisted; binding acknowledgement failed":
		return err.Error()
	default:
		return "Controlled import failed during local preparation or state persistence"
	}
}

func (c *Client) nativeDiagnostic(name string, code diagnosticCode) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.importing == nil || c.importing.binding.ImportName != name || !importNamePattern.MatchString(name) {
		return errors.New("native diagnostic does not match the active controlled import")
	}
	switch code {
	case importReceiptFilenameMismatch, importReceiptUUIDInvalid, importReceiptParentInvalid:
	default:
		return errors.New("native diagnostic code is not allowed")
	}
	c.nativeDiagnosticLocked(c.importing, code)
	return nil
}

func (c *Client) nativeDiagnosticLocked(flight *importFlight, code diagnosticCode) {
	if flight.diagnostics == nil {
		flight.diagnostics = make(map[diagnosticCode]bool)
	}
	if !flight.diagnostics[code] {
		flight.diagnostics[code] = true
		c.diagnosticLocked(flight.binding, code, nil)
	}
}

func (c *Client) handleNativeDiagnostic(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ImportName string         `json:"importName"`
		Code       diagnosticCode `json:"code"`
	}
	decoder := json.NewDecoder(io.LimitReader(r.Body, 8193))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&body) != nil || decoder.Decode(new(any)) != io.EOF {
		http.Error(w, "invalid local request JSON", http.StatusBadRequest)
		return
	}
	if err := c.nativeDiagnostic(body.ImportName, body.Code); err != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}
