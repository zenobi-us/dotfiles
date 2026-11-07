// Serializes explicit Send, per-result consent, and controlled stock import receipts.
package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strconv"
	"time"
)

func (c *Client) setCurrent(document string) error {
	if document != "" && !uuidPattern.MatchString(document) {
		return errors.New("current document must be a stock UUID or empty")
	}
	c.mu.Lock()
	if c.current != document {
		old, associated := c.disk.Bindings[c.current]
		if associated && (c.cancel != nil || c.pending != nil || (c.dirty != nil && c.dirty.DocumentUUID == old.DocumentUUID)) {
			copy := old
			c.invalidationDebt = &copy
		}
		if c.cancel != nil {
			c.cancel()
			c.cancel = nil
		}
		c.pending = nil
		c.generation++
		c.current = document
		c.message = ""
		c.status = "unassociated"
		if b, ok := c.disk.Bindings[document]; ok {
			c.status = "pending"
			if terminal := c.disk.Terminal[key(b.ServerID, b.JobID)]; terminal != "" {
				c.status = terminal
			}
		}
	}
	if c.invalidationDebt == nil || c.invalidating {
		c.mu.Unlock()
		return nil
	}
	old := *c.invalidationDebt
	c.invalidating = true
	c.mu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err := c.servers[old.ServerID].json(ctx, "POST", "/jobs/"+old.JobID+"/invalidate", map[string]string{"requestId": old.RequestID, "documentUUID": old.DocumentUUID}, nil)
	c.mu.Lock()
	defer c.mu.Unlock()
	c.invalidating = false
	if c.disk.Terminal[key(old.ServerID, old.JobID)] != "" {
		err = nil
	}
	if err != nil {
		c.status = "error"
		c.message = "Previous confirmation is stale; server invalidation failed; refresh current document to retry"
	} else {
		c.invalidationDebt = nil
		c.dirty = nil
	}
	return err
}
func (c *Client) activeLocked(document string) (Binding, *remote, error) {
	b, ok := c.disk.Bindings[document]
	if document == "" || document != c.current || !ok {
		return Binding{}, nil, errors.New("current stock document has no association")
	}
	r := c.servers[b.ServerID]
	if r == nil || !r.online {
		return Binding{}, nil, errors.New("originating paired server is offline")
	}
	j, ok := r.jobs[b.JobID]
	if !ok || !sameJob(b, j) || j.State != "pending" || c.disk.Terminal[key(b.ServerID, b.JobID)] != "" {
		return Binding{}, nil, errors.New("originating job is no longer pending")
	}
	if c.invalidating || c.invalidationDebt != nil {
		return Binding{}, nil, errors.New("previous result invalidation must complete first")
	}
	return b, r, nil
}
func checkRemote(ctx context.Context, r *remote, b Binding) (uint64, error) {
	var j Job
	if err := r.json(ctx, "GET", "/jobs/"+b.JobID, nil, &j); err != nil {
		return 0, err
	}
	if !sameJob(b, j) || j.DocumentUUID != b.DocumentUUID || j.State != "pending" {
		return 0, errors.New("remote job identity or state changed")
	}
	return j.SubmissionEpoch, nil
}
func (c *Client) submit(document string, confirm bool, confirmationID string) error {
	c.mu.Lock()
	b, r, err := c.activeLocked(document)
	if err != nil {
		c.mu.Unlock()
		return err
	}
	if c.cancel != nil {
		c.mu.Unlock()
		return errors.New("a submission is already running")
	}
	var approval *consent
	if confirm {
		if c.pending == nil || c.pending.DocumentUUID != document || confirmationID == "" || c.pending.ConfirmationID != confirmationID {
			c.mu.Unlock()
			return errors.New("displayed clipping confirmation is stale")
		}
		copy := *c.pending
		approval = &copy
	}
	c.pending = nil
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	c.cancel = cancel
	c.generation++
	generation := c.generation
	c.status = "sending"
	c.message = ""
	copyBinding := b
	c.dirty = &copyBinding
	c.mu.Unlock()
	defer cancel()
	operationEpoch, err := checkRemote(ctx, r, b)
	hardwareBlocked := false
	var response struct {
		Status string `json:"status"`
		consent
	}
	if err == nil {
		if confirm {
			if observation := observeHardware(); !observation.Safe {
				hardwareBlocked = true
				err = errors.New(observation.Error)
			} else {
				err = r.json(ctx, "POST", "/jobs/"+b.JobID+"/confirm", approval, &response)
			}
		} else {
			var pdf []byte
			pdf, err = exportStock(ctx, document)
			if err == nil {
				var currentEpoch uint64
				currentEpoch, err = checkRemote(ctx, r, b)
				if err == nil && currentEpoch != operationEpoch {
					err = errors.New("submission invalidated before upload")
				}
			}
			if err == nil {
				var data []byte
				data, err = r.request(ctx, "POST", "/jobs/"+b.JobID+"/result", pdf, "application/pdf", map[string]string{
					"X-Request-ID": b.RequestID, "X-Document-UUID": document,
					"X-Submission-Epoch": strconv.FormatUint(operationEpoch, 10),
				})
				if err == nil {
					err = json.Unmarshal(data, &response)
				}
			}
		}
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if generation != c.generation || c.current != document {
		if c.current == document && c.disk.Terminal[key(b.ServerID, b.JobID)] == "completed" {
			return nil
		}
		return errors.New("submission invalidated by document switch or cancellation")
	}
	c.cancel = nil
	if err != nil {
		c.status = "error"
		c.message = err.Error()
		if hardwareBlocked {
			c.pending = approval
			c.status = "confirmation-required"
		}
		return err
	}
	if response.Status == "completed" {
		c.dirty = nil
		c.status = "completed"
		c.disk.Terminal[key(b.ServerID, b.JobID)] = "completed"
		return c.persistLocked()
	}
	if !confirm && response.Status == "confirmation-required" && response.RequestID == b.RequestID && response.SourceDigest == b.SourceDigest && digestPattern.MatchString(response.ExportDigest) && response.Consent != "" {
		id, nonceErr := nonce()
		if nonceErr != nil {
			c.status = "error"
			return nonceErr
		}
		response.DocumentUUID = document
		response.ConfirmationID = id
		c.pending = &response.consent
		c.status = "confirmation-required"
		return nil
	}
	c.status = "error"
	return errors.New("server returned an invalid result or consent identity")
}
func (c *Client) beginImport(serverID, jobID string) (resultErr error) {
	c.mu.Lock()
	r := c.servers[serverID]
	if r == nil || !r.online || c.importing != nil {
		c.mu.Unlock()
		return errors.New("import requires an online paired server and no active import")
	}
	j, ok := r.jobs[jobID]
	if !ok || j.State != "pending" || j.DocumentUUID != "" || c.disk.Terminal[key(serverID, jobID)] != "" {
		c.mu.Unlock()
		return errors.New("import job is not unbound and pending")
	}
	for _, bound := range c.disk.Bindings {
		if bound.ServerID == serverID && bound.JobID == jobID {
			c.mu.Unlock()
			return errors.New("job already has an immutable stock association")
		}
	}
	n, err := nonce()
	if err != nil {
		c.mu.Unlock()
		return err
	}
	flight := &importFlight{binding: Binding{ServerID: serverID, JobID: jobID, RequestID: j.RequestID, SourceDigest: j.SourceDigest, ImportName: "pi-ink-" + n, Status: "importing"}, receipt: make(chan importReceipt, 1), ready: make(chan struct{}, 1)}
	attempt := flight.binding
	c.importing = flight
	c.diagnosticLocked(attempt, importStarted, nil)
	c.mu.Unlock()
	defer func() {
		c.mu.Lock()
		if resultErr != nil {
			c.diagnosticLocked(attempt, importFailed, resultErr)
		}
		if c.importing == flight {
			c.importing = nil
		}
		c.mu.Unlock()
	}()
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	pdf, err := r.request(ctx, "GET", "/jobs/"+jobID+"/source.pdf", nil, "", nil)
	if err != nil {
		return err
	}
	hash := sha256.Sum256(pdf)
	digest := hex.EncodeToString(hash[:])
	approved := false
	for _, allow := range c.config.SyntheticAllowlist {
		if digest == allow {
			approved = true
		}
	}
	if !approved || !bytes.HasPrefix(pdf, []byte("%PDF-")) {
		return errors.New("source PDF is not on the owner-approved synthetic SHA256 allowlist")
	}
	c.diagnostic(attempt, importSourceVerified)
	select {
	case <-flight.ready:
	case <-ctx.Done():
		return errors.New("toolbar did not acknowledge the controlled import name")
	}
	c.mu.Lock()
	flight.acceptingReceipt = true
	c.mu.Unlock()
	c.mu.Lock()
	currentJob, exists := r.jobs[jobID]
	valid := exists && sameJob(flight.binding, currentJob) && currentJob.State == "pending" && c.disk.Terminal[key(serverID, jobID)] == ""
	c.mu.Unlock()
	if !valid {
		return errors.New("import job was cancelled or changed")
	}
	c.diagnostic(attempt, importUploadStarted)
	response, err := importStock(ctx, flight.binding.ImportName, pdf)
	if err != nil {
		return err
	}
	c.diagnostic(attempt, importUploadCompleted)
	// A bare HTTP UUID proves no parent. Wait for the controlled native receipt
	// instead of displaying an unobserved destination as the stock root.
	receipt, err := resolveImportIdentity(ctx, response, flight.receipt)
	if err != nil {
		return err
	}
	c.diagnostic(attempt, importReceiptAccepted)
	document, folder := receipt.Document, receipt.Folder
	b := flight.binding
	b.DocumentUUID = document
	b.FolderUUID = folder
	b.Status = "pending"
	c.mu.Lock()
	j, ok = r.jobs[jobID]
	if !ok || !sameJob(b, j) || j.State != "pending" || c.disk.Terminal[key(serverID, jobID)] != "" {
		c.mu.Unlock()
		return errors.New("import cancelled before binding")
	}
	if owner := c.disk.Folders[folder]; owner != "" && owner != serverID {
		c.mu.Unlock()
		return errors.New("native import destination belongs to another paired server")
	}
	if _, exists := c.disk.Bindings[document]; exists {
		c.mu.Unlock()
		return errors.New("stock UUID is already associated")
	}
	// Persist before acknowledging so a lost response cannot cause a second UUID import.
	c.disk.Bindings[document] = b
	err = c.persistLocked()
	c.mu.Unlock()
	if err != nil {
		return err
	}
	if err = r.json(ctx, "POST", "/jobs/"+jobID+"/bind", map[string]string{"requestId": b.RequestID, "documentUUID": document, "folderUUID": folder}, nil); err != nil {
		return errors.New("stock association persisted; binding acknowledgement failed")
	}
	c.mu.Lock()
	if c.current == document && c.status == "unassociated" {
		c.status = "pending"
	}
	c.mu.Unlock()
	c.diagnostic(attempt, importBound)
	return nil
}
func (c *Client) imported(name, document, folder string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !uuidPattern.MatchString(document) {
		if c.importing != nil && c.importing.binding.ImportName == name {
			c.nativeDiagnosticLocked(c.importing, importReceiptUUIDInvalid)
		}
		return errors.New("Library receipt requires actual stock UUIDs")
	}
	if folder != "" && !uuidPattern.MatchString(folder) {
		if c.importing != nil && c.importing.binding.ImportName == name {
			c.nativeDiagnosticLocked(c.importing, importReceiptParentInvalid)
		}
		return errors.New("Library receipt requires actual stock UUIDs")
	}
	for _, binding := range c.disk.Bindings {
		if binding.ImportName == name && binding.DocumentUUID == document && binding.FolderUUID == folder {
			return nil
		}
	}
	if c.importing == nil || c.importing.binding.ImportName != name {
		return errors.New("Library receipt does not match the serialized controlled import")
	}
	c.diagnosticLocked(c.importing.binding, importReceiptReceived, nil)
	if accepted := c.importing.accepted; accepted != nil {
		if accepted.Document == document && accepted.Folder == folder {
			return nil
		}
		return errors.New("Library receipt conflicts with the accepted UUID")
	}
	if !c.importing.acceptingReceipt {
		return errors.New("Library receipt arrived before the controlled stock upload")
	}
	receipt := importReceipt{Name: name, Document: document, Folder: folder}
	select {
	case c.importing.receipt <- receipt:
		c.importing.accepted = &receipt
		c.importing.acceptingReceipt = false
		return nil
	default:
		return errors.New("Library receipt was already supplied")
	}
}
func (c *Client) importReady(name string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.importing == nil || c.importing.binding.ImportName != name {
		return errors.New("toolbar acknowledgement does not match controlled import")
	}
	select {
	case c.importing.ready <- struct{}{}:
	default:
	}
	return nil
}
