// Persists immutable stock UUID associations separately from server display names.
package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"sync"
)

const uiAddress = "127.0.0.1:9821"
const maxPDF = 50 * 1024 * 1024

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
var digestPattern = regexp.MustCompile(`^[0-9a-f]{64}$`)
var idPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,128}$`)

type Config struct {
	DeviceID           string         `json:"deviceId"`
	StatePath          string         `json:"statePath"`
	UIAddress          string         `json:"uiAddress"`
	Servers            []ServerConfig `json:"servers"`
	SyntheticAllowlist []string       `json:"syntheticAllowlist"`
}
type ServerConfig struct {
	ServerID string `json:"serverId"`
	Name     string `json:"name"`
	Origin   string `json:"origin"`
	CA       string `json:"ca"`
	Token    string `json:"token"`
}
type Job struct {
	JobID           string `json:"jobId"`
	RequestID       string `json:"requestId"`
	SourceDigest    string `json:"sourceDigest"`
	State           string `json:"state"`
	DocumentUUID    string `json:"documentUUID,omitempty"`
	FolderUUID      string `json:"folderUUID,omitempty"`
	SubmissionEpoch uint64 `json:"submissionEpoch"`
}
type Binding struct {
	ServerID     string `json:"serverId"`
	JobID        string `json:"jobId"`
	RequestID    string `json:"requestId"`
	SourceDigest string `json:"sourceDigest"`
	DocumentUUID string `json:"documentUUID"`
	FolderUUID   string `json:"folderUUID,omitempty"`
	ImportName   string `json:"importName"`
	Status       string `json:"status"`
}
type diskState struct {
	Bindings map[string]Binding `json:"bindings"`
	Terminal map[string]string  `json:"terminal"`
	Tokens   map[string]string  `json:"tokens,omitempty"`
	Folders  map[string]string  `json:"folders,omitempty"`
}
type consent struct {
	RequestID      string `json:"requestId"`
	SourceDigest   string `json:"sourceDigest"`
	ExportDigest   string `json:"exportDigest"`
	Consent        string `json:"consent"`
	DocumentUUID   string `json:"documentUUID"`
	ConfirmationID string `json:"-"`
}
type importReceipt struct{ Name, Document, Folder string }
type importFlight struct {
	binding          Binding
	receipt          chan importReceipt
	ready            chan struct{}
	acceptingReceipt bool
	accepted         *importReceipt
	diagnostics      map[diagnosticCode]bool
}
type Client struct {
	mu         sync.Mutex
	config     Config
	disk       diskState
	servers    map[string]*remote
	current    string
	generation uint64
	status     string
	message    string
	pending    *consent
	pairings   map[string]string
	cancel     context.CancelFunc
	importing  *importFlight
	// Switching waits for remote invalidation before a new send or confirmation.
	invalidating     bool
	invalidationDebt *Binding
	dirty            *Binding
}

func newClient(config Config) (*Client, error) {
	if config.UIAddress != uiAddress || config.DeviceID == "" || !filepath.IsAbs(config.StatePath) || len(config.Servers) == 0 {
		return nil, errors.New("configure deviceId, absolute statePath, paired servers, and uiAddress 127.0.0.1:9821")
	}
	c := &Client{config: config, servers: make(map[string]*remote), status: "unassociated", disk: diskState{Bindings: map[string]Binding{}, Terminal: map[string]string{}}}
	c.pairings = map[string]string{}
	for _, d := range config.SyntheticAllowlist {
		if !digestPattern.MatchString(d) {
			return nil, errors.New("syntheticAllowlist requires lowercase SHA256 hashes of approved PDF bytes")
		}
	}
	for _, s := range config.Servers {
		if !idPattern.MatchString(s.ServerID) || c.servers[s.ServerID] != nil {
			return nil, errors.New("paired server IDs must be unique safe identifiers")
		}
		r, err := newRemote(s)
		if err != nil {
			return nil, err
		}
		c.servers[s.ServerID] = r
	}
	c.disk.Tokens = map[string]string{}
	c.disk.Folders = map[string]string{}
	data, err := os.ReadFile(config.StatePath)
	if err == nil {
		if err = json.Unmarshal(data, &c.disk); err != nil {
			return nil, errors.New("invalid persisted association state")
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	if c.disk.Bindings == nil || c.disk.Terminal == nil {
		return nil, errors.New("invalid persisted association maps")
	}
	for id, token := range c.disk.Tokens {
		r := c.servers[id]
		if r == nil || len(token) != 64 {
			return nil, errors.New("invalid persisted pairing")
		}
		r.credential.Store(token)
	}
	for folder, server := range c.disk.Folders {
		if !uuidPattern.MatchString(folder) || c.servers[server] == nil {
			return nil, errors.New("invalid persisted folder association")
		}
	}
	for doc, b := range c.disk.Bindings {
		if doc != b.DocumentUUID || !uuidPattern.MatchString(doc) || !validBinding(b) || c.servers[b.ServerID] == nil {
			return nil, errors.New("persisted association has invalid identity")
		}
	}
	return c, nil
}
func validBinding(b Binding) bool {
	return idPattern.MatchString(b.ServerID) && idPattern.MatchString(b.JobID) && idPattern.MatchString(b.RequestID) && digestPattern.MatchString(b.SourceDigest) && (b.FolderUUID == "" || uuidPattern.MatchString(b.FolderUUID))
}
func key(server, job string) string { return server + "/" + job }
func sameJob(b Binding, j Job) bool {
	return b.JobID == j.JobID && b.RequestID == j.RequestID && b.SourceDigest == j.SourceDigest && (j.DocumentUUID == "" || j.DocumentUUID == b.DocumentUUID)
}
func nonce() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// Caller holds mu. Rename keeps a power loss from exposing half an association.
func (c *Client) persistLocked() error {
	data, err := json.MarshalIndent(c.disk, "", "  ")
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(c.config.StatePath), 0700); err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(c.config.StatePath), ".tablet-state-")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if err = f.Chmod(0600); err == nil {
		_, err = f.Write(data)
	}
	if err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	if err = os.Rename(f.Name(), c.config.StatePath); err != nil {
		return err
	}
	directory, err := os.Open(filepath.Dir(c.config.StatePath))
	if err != nil {
		return err
	}
	defer directory.Close()
	return directory.Sync()
}
