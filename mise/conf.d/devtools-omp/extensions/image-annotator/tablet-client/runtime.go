// The tablet toolbar calls this loopback-only API; no notebook files are opened.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func serve(args []string) error {
	flags := flag.NewFlagSet("serve", flag.ContinueOnError)
	configPath := flags.String("config", "", "path to setup-provisioned JSON configuration")
	if err := flags.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if *configPath == "" || flags.NArg() != 0 {
		return errors.New("serve requires --config with a private setup configuration")
	}
	info, err := os.Stat(*configPath)
	if err != nil || info.Mode().Perm()&0077 != 0 {
		return errors.New("configuration must exist with mode 0600")
	}
	data, err := os.ReadFile(*configPath)
	if err != nil {
		return errors.New("cannot read configuration")
	}
	var config Config
	if json.Unmarshal(data, &config) != nil {
		return errors.New("configuration is not valid JSON")
	}
	c, err := newClient(config)
	if err != nil {
		return err
	}
	listener, err := net.Listen("tcp4", uiAddress)
	if err != nil {
		return errors.New("cannot bind tablet UI loopback address")
	}
	fmt.Fprintln(os.Stderr, "Pi Ink UI ready at "+uiAddress)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	for _, remote := range c.servers {
		go c.runRemote(ctx, remote)
	}
	server := &http.Server{Handler: c.handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 3 * time.Minute, IdleTimeout: 30 * time.Second, MaxHeaderBytes: 8192}
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(shutdown)
	}()
	if err = server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return errors.New("tablet local API stopped unexpectedly")
	}
	return nil
}
func (c *Client) handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil || host != "127.0.0.1" || r.Host != uiAddress || r.Header.Get("Origin") != "" {
			http.Error(w, "loopback UI only", http.StatusForbidden)
			return
		}
		if r.Method == "GET" && r.URL.Path == "/state" {
			json.NewEncoder(w).Encode(c.view())
			return
		}
		if r.Method != "POST" {
			http.Error(w, "route not found", 404)
			return
		}
		// Qt adds the UTF-8 charset when it sends a JSON string.
		mediaType, _, mediaTypeErr := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if mediaTypeErr != nil || mediaType != "application/json" {
			http.Error(w, "expected application/json", 415)
			return
		}
		if r.URL.Path == "/diagnostic" {
			c.handleNativeDiagnostic(w, r)
			return
		}
		var body struct {
			DocumentUUID   string `json:"documentUUID"`
			FolderUUID     string `json:"folderUUID"`
			ServerID       string `json:"serverId"`
			JobID          string `json:"jobId"`
			ImportName     string `json:"importName"`
			ConfirmationID string `json:"confirmationId"`
		}
		decoder := json.NewDecoder(io.LimitReader(r.Body, 8193))
		decoder.DisallowUnknownFields()
		if err = decoder.Decode(&body); err != nil {
			http.Error(w, "invalid local request JSON", 400)
			return
		}
		if decoder.Decode(new(any)) != io.EOF {
			http.Error(w, "expected one JSON value", 400)
			return
		}
		if (r.URL.Path == "/send" || r.URL.Path == "/confirm") && (body.ServerID != "" || body.JobID != "") {
			http.Error(w, "Send uses only the immutable originating association", 409)
			return
		}
		switch r.URL.Path {
		case "/pair":
			err = c.pairServer(body.ServerID)
		case "/folder":
			err = c.associateFolder(body.ServerID, body.FolderUUID)
		case "/current":
			err = c.setCurrent(body.DocumentUUID)
		case "/send":
			err = c.submit(body.DocumentUUID, false, "")
		case "/confirm":
			err = c.submit(body.DocumentUUID, true, body.ConfirmationID)
		case "/import":
			err = c.beginImport(body.ServerID, body.JobID)
		case "/import-ready":
			err = c.importReady(body.ImportName)
		case "/imported":
			err = c.imported(body.ImportName, body.DocumentUUID, body.FolderUUID)
		default:
			http.Error(w, "route not found", 404)
			return
		}
		if err != nil {
			w.WriteHeader(409)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})
}
func (c *Client) view() map[string]any {
	c.mu.Lock()
	defer c.mu.Unlock()
	servers := []map[string]string{}
	imports := []map[string]string{}
	folders := []map[string]string{}
	for folder, server := range c.disk.Folders {
		folders = append(folders, map[string]string{"folderUUID": folder, "serverId": server, "serverName": c.servers[server].config.Name})
	}
	for _, config := range c.config.Servers {
		r := c.servers[config.ServerID]
		connection := "offline"
		if r.credential.Load().(string) == "" {
			connection = "not-paired"
		} else if c.pairings[config.ServerID] != "" {
			connection = "approval-pending"
		}
		if r.online {
			connection = "online"
		}
		servers = append(servers, map[string]string{"serverId": config.ServerID, "name": config.Name, "connection": connection, "pairingId": c.pairings[config.ServerID]})
		for _, job := range r.jobs {
			status := job.State
			name := ""
			for _, bound := range c.disk.Bindings {
				if bound.ServerID == config.ServerID && bound.JobID == job.JobID {
					name = bound.ImportName
					status = bound.Status
					if terminal := c.disk.Terminal[key(bound.ServerID, bound.JobID)]; terminal != "" {
						status = terminal
					}
				}
			}
			if c.importing != nil && c.importing.binding.ServerID == config.ServerID && c.importing.binding.JobID == job.JobID {
				name = c.importing.binding.ImportName
				status = "importing"
			}
			imports = append(imports, map[string]string{"serverId": config.ServerID, "jobId": job.JobID, "requestId": job.RequestID, "sourceDigest": job.SourceDigest, "importName": name, "status": status})
		}
	}
	view := map[string]any{"version": version, "documentUUID": c.current, "connection": "offline", "status": c.status, "message": c.message, "canSend": false, "canConfirm": false, "servers": servers, "imports": imports, "folders": folders}
	if c.pending != nil {
		view["confirmationId"] = c.pending.ConfirmationID
	}
	if b, ok := c.disk.Bindings[c.current]; ok {
		r := c.servers[b.ServerID]
		view["serverId"] = b.ServerID
		view["serverName"] = r.config.Name
		view["folderUUID"] = b.FolderUUID
		if r.online {
			view["connection"] = "online"
		}
		_, _, err := c.activeLocked(c.current)
		view["canSend"] = err == nil && c.cancel == nil
		view["canConfirm"] = err == nil && c.cancel == nil && c.pending != nil
	}
	return view
}
