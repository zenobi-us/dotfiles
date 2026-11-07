// Each paired server gets an isolated certificate-verified, non-proxy transport.
package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

type remote struct {
	config      ServerConfig
	client      *http.Client
	dialer      *websocket.Dialer
	online      bool
	jobs        map[string]Job
	credential  atomic.Value
	diagnostics diagnosticQueue
}

func newRemote(s ServerConfig) (*remote, error) {
	u, err := url.Parse(s.Origin)
	if err != nil || u.Scheme != "https" || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") || (s.Token != "" && len(s.Token) < 32) || strings.ContainsAny(s.Token, "\r\n") {
		return nil, errors.New("paired server requires HTTPS origin, CA file, and credential of at least 32 characters")
	}
	pem, err := os.ReadFile(s.CA)
	if err != nil {
		return nil, errors.New("cannot read paired server CA")
	}
	roots := x509.NewCertPool()
	if !roots.AppendCertsFromPEM(pem) {
		return nil, errors.New("paired server CA is not PEM")
	}
	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: roots}
	tr := &http.Transport{TLSClientConfig: tlsConfig, Proxy: nil, ResponseHeaderTimeout: 30 * time.Second}
	r := &remote{config: s, jobs: map[string]Job{}, client: &http.Client{Transport: tr, Timeout: 90 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return errors.New("redirect refused") }}, dialer: &websocket.Dialer{TLSClientConfig: tlsConfig, Proxy: nil, HandshakeTimeout: 15 * time.Second}}
	r.diagnostics.events = make(chan diagnosticEvent, diagnosticQueueSize)
	r.credential.Store(s.Token)
	return r, nil
}
func (r *remote) request(ctx context.Context, method, path string, data []byte, contentType string, headers map[string]string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, method, strings.TrimRight(r.config.Origin, "/")+"/tablet/v1"+path, bytes.NewReader(data))
	if err != nil {
		return nil, errors.New("cannot construct authenticated request")
	}
	req.Header.Set("Authorization", "Bearer "+r.credential.Load().(string))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := r.client.Do(req)
	if err != nil {
		return nil, errors.New("paired server request failed")
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, errors.New("paired server rejected request")
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, maxPDF+1))
	if err != nil || len(body) > maxPDF {
		return nil, errors.New("paired server response exceeds limit or was interrupted")
	}
	return body, nil
}
func (r *remote) json(ctx context.Context, method, path string, value any, result any) error {
	var body []byte
	var err error
	if value != nil {
		body, err = json.Marshal(value)
		if err != nil {
			return err
		}
	}
	data, err := r.request(ctx, method, path, body, "application/json", nil)
	if err != nil {
		return err
	}
	if result != nil {
		if err = json.Unmarshal(data, result); err != nil {
			return errors.New("paired server returned invalid JSON")
		}
	}
	return nil
}
func (c *Client) runRemote(ctx context.Context, r *remote) {
	for ctx.Err() == nil {
		c.connect(ctx, r)
		timer := time.NewTimer(3 * time.Second)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}
func (c *Client) connect(ctx context.Context, r *remote) {
	if r.credential.Load().(string) == "" {
		return
	}
	endpoint := "wss" + strings.TrimPrefix(strings.TrimRight(r.config.Origin, "/"), "https") + "/tablet/v1/events"
	header := http.Header{}
	header.Set("Authorization", "Bearer "+r.credential.Load().(string))
	conn, res, err := r.dialer.DialContext(ctx, endpoint, header)
	if res != nil && res.Body != nil {
		defer res.Body.Close()
	}
	if err != nil {
		return
	}
	defer conn.Close()
	conn.SetReadLimit(1024 * 1024)
	done := make(chan struct{})
	writerDone := make(chan struct{})
	defer func() {
		close(done)
		conn.Close()
		<-writerDone
	}()
	go func() {
		defer close(writerDone)
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		observation := observeHardware()
		observation.Type = "status"
		observation.DeviceID = c.config.DeviceID
		var packet any = observation
		var dropped uint64
		isDiagnostic := false
		for {
			conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if conn.WriteJSON(packet) != nil {
				if isDiagnostic {
					r.diagnostics.dropped.Add(dropped + 1)
				}
				conn.Close()
				return
			}
			select {
			case <-done:
				return
			case <-ctx.Done():
				conn.Close()
				return
			case event := <-r.diagnostics.events:
				dropped = r.diagnostics.dropped.Swap(0)
				event.DroppedBefore = dropped
				packet = event
				isDiagnostic = true
			case <-ticker.C:
				observation = observeHardware()
				observation.Type = "status"
				observation.DeviceID = c.config.DeviceID
				packet = observation
				isDiagnostic = false
			}
		}
	}()
	defer func() { c.mu.Lock(); r.online = false; c.mu.Unlock() }()
	for {
		var snapshot struct {
			Type     string `json:"type"`
			ServerID string `json:"serverId"`
			Jobs     []Job  `json:"jobs"`
		}
		if err = conn.ReadJSON(&snapshot); err != nil {
			return
		}
		if snapshot.Type != "jobs" || snapshot.ServerID != r.config.ServerID {
			return
		}
		if err = c.applyJobs(r, snapshot.Jobs); err != nil {
			return
		}
		c.reconcileBindings(ctx, r)
	}
}
func (c *Client) applyJobs(r *remote, jobs []Job) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	next := map[string]Job{}
	for _, j := range jobs {
		if !idPattern.MatchString(j.JobID) || !idPattern.MatchString(j.RequestID) || !digestPattern.MatchString(j.SourceDigest) || (j.DocumentUUID != "" && !uuidPattern.MatchString(j.DocumentUUID)) || (j.FolderUUID != "" && !uuidPattern.MatchString(j.FolderUUID)) || (j.State != "pending" && j.State != "completed" && j.State != "cancelled") {
			return errors.New("invalid job snapshot")
		}
		if _, exists := next[j.JobID]; exists {
			return errors.New("duplicate job identity")
		}
		if old, exists := r.jobs[j.JobID]; exists && (old.RequestID != j.RequestID || old.SourceDigest != j.SourceDigest) {
			return errors.New("job identity changed")
		}
		for _, b := range c.disk.Bindings {
			if b.ServerID == r.config.ServerID && b.JobID == j.JobID && !sameJob(b, j) {
				c.disk.Terminal[key(b.ServerID, b.JobID)] = "cancelled"
			}
		}
		terminal := c.disk.Terminal[key(r.config.ServerID, j.JobID)]
		if terminal != "" {
			j.State = terminal
		}
		if j.State != "pending" {
			c.disk.Terminal[key(r.config.ServerID, j.JobID)] = j.State
		}
		next[j.JobID] = j
	}
	for id, old := range r.jobs {
		if _, ok := next[id]; !ok {
			old.State = "cancelled"
			next[id] = old
			c.disk.Terminal[key(r.config.ServerID, id)] = "cancelled"
		}
	}
	for _, b := range c.disk.Bindings {
		if b.ServerID != r.config.ServerID {
			continue
		}
		if _, exists := next[b.JobID]; !exists {
			next[b.JobID] = Job{JobID: b.JobID, RequestID: b.RequestID, SourceDigest: b.SourceDigest, DocumentUUID: b.DocumentUUID, FolderUUID: b.FolderUUID, State: "cancelled"}
			c.disk.Terminal[key(b.ServerID, b.JobID)] = "cancelled"
		}
	}
	r.jobs = next
	r.online = true
	if b, ok := c.disk.Bindings[c.current]; ok && b.ServerID == r.config.ServerID {
		j, exists := next[b.JobID]
		if !exists || !sameJob(b, j) || j.State == "cancelled" {
			if c.cancel != nil {
				c.cancel()
			}
			c.cancel = nil
			c.dirty = nil
			c.pending = nil
			c.status = "cancelled"
			c.generation++
		} else if j.State == "completed" {
			if c.cancel != nil {
				c.cancel()
			}
			c.cancel = nil
			c.dirty = nil
			c.pending = nil
			c.status = "completed"
			c.generation++
		}
	}
	return c.persistLocked()
}

// A lost bind acknowledgement must not force another stock import after restart.
func (c *Client) reconcileBindings(ctx context.Context, r *remote) {
	c.mu.Lock()
	bindings := []Binding{}
	for _, b := range c.disk.Bindings {
		j, ok := r.jobs[b.JobID]
		if b.ServerID == r.config.ServerID && ok && sameJob(b, j) && j.State == "pending" && j.DocumentUUID == "" && c.disk.Terminal[key(b.ServerID, b.JobID)] == "" {
			bindings = append(bindings, b)
		}
	}
	c.mu.Unlock()
	for _, b := range bindings {
		r.json(ctx, "POST", "/jobs/"+b.JobID+"/bind", map[string]string{"requestId": b.RequestID, "documentUUID": b.DocumentUUID, "folderUUID": b.FolderUUID}, nil)
	}
}
