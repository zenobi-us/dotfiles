// AppLoad owns backend lifetime. Only a verified TLS health response proves server reachability.
package main

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"syscall"
	"time"
)

func runAppLoad(socket, configPath string) error {
	info, err := os.Lstat(configPath)
	if err != nil || !info.Mode().IsRegular() || info.Mode().Perm()&0077 != 0 {
		return errors.New("private setup configuration is required")
	}
	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}
	var config Config
	if json.Unmarshal(data, &config) != nil {
		return errors.New("invalid setup configuration")
	}
	client, err := newClient(config)
	if err != nil {
		return err
	}
	if !filepath.IsAbs(socket) {
		return errors.New("AppLoad requires an absolute local socket path")
	}
	conn, err := net.DialUnix("unixpacket", nil, &net.UnixAddr{Name: socket, Net: "unixpacket"})
	if err != nil {
		return err
	}
	defer conn.Close()
	header := make([]byte, 8)
	body := make([]byte, 4096)
	for {
		n, _, flags, _, err := conn.ReadMsgUnix(header, nil)
		if err != nil {
			return err
		}
		if n != len(header) || flags&syscall.MSG_TRUNC != 0 {
			return errors.New("invalid AppLoad message header")
		}
		kind := binary.LittleEndian.Uint32(header)
		length := binary.LittleEndian.Uint32(header[4:])
		if length > uint32(len(body)) {
			return errors.New("AppLoad message exceeds limit")
		}
		// AppLoad sends a separate body record even when empty. ReadMsgUnix
		// consumes it; Go reports EOF for zero-byte SOCK_SEQPACKET records.
		n, _, flags, _, err = conn.ReadMsgUnix(body, nil)
		if (err != nil && !(length == 0 && n == 0 && errors.Is(err, io.EOF))) ||
			n != int(length) || flags&syscall.MSG_TRUNC != 0 {
			return errors.New("invalid AppLoad message body")
		}
		if kind == 0xffffffff {
			return nil
		}
		if kind != 1 {
			continue
		}
		state := client.connectionView(context.Background())
		bytes, err := json.Marshal(state)
		if err != nil {
			return err
		}
		binary.LittleEndian.PutUint32(header, 2)
		binary.LittleEndian.PutUint32(header[4:], uint32(len(bytes)))
		if _, err = conn.Write(header); err != nil {
			return err
		}
		if _, err = conn.Write(bytes); err != nil {
			return err
		}
	}
}

func (c *Client) connectionView(ctx context.Context) []map[string]string {
	result := make([]map[string]string, 0, len(c.config.Servers))
	for _, config := range c.config.Servers {
		state := map[string]string{"name": config.Name, "serverId": config.ServerID, "connection": "offline", "detail": "Cannot verify the server. Check desktop service, LAN, and certificate address."}
		remote := c.servers[config.ServerID]
		timeout, cancel := context.WithTimeout(ctx, 3*time.Second)
		req, err := http.NewRequestWithContext(timeout, "GET", config.Origin+"/health", nil)
		if err == nil {
			response, err := remote.client.Do(req)
			if err == nil {
				var health struct {
					Service  string `json:"service"`
					ID       string `json:"id"`
					Protocol int    `json:"protocol"`
					Status   string `json:"status"`
				}
				decodeErr := json.NewDecoder(io.LimitReader(response.Body, 4096)).Decode(&health)
				response.Body.Close()
				if response.StatusCode == 200 && decodeErr == nil && health.Service == "pi-ink-bridge" && health.ID == config.ServerID && health.Protocol == 2 && health.Status == "ready" {
					state["connection"] = "available — not paired"
					state["detail"] = "Server identity and TLS verified. Pairing requires explicit desktop approval."
				} else {
					state["detail"] = "Server identity or protocol mismatch. Preserve pairing data and repair setup."
				}
			}
		}
		cancel()
		result = append(result, state)
	}
	return result
}
