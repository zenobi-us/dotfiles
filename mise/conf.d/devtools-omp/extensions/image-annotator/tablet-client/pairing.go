// App pairing uses only setup-provisioned TLS identities, never discovery or HTTP health.
package main

import (
	"context"
	"errors"
	"time"
)

func (c *Client) pairServer(serverID string) error {
	c.mu.Lock()
	r := c.servers[serverID]
	if r == nil || r.online {
		c.mu.Unlock()
		return errors.New("select an unpaired setup-provisioned server")
	}
	token := r.credential.Load().(string)
	if token == "" {
		first, err := nonce()
		if err != nil {
			c.mu.Unlock()
			return err
		}
		second, err := nonce()
		if err != nil {
			c.mu.Unlock()
			return err
		}
		token = first + second
		c.disk.Tokens[serverID] = token
		if err = c.persistLocked(); err != nil {
			c.mu.Unlock()
			return err
		}
		r.credential.Store(token)
	}
	c.mu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	var response struct {
		ServerID  string `json:"serverId"`
		PairingID string `json:"pairingId"`
	}
	if err := r.json(ctx, "POST", "/pair", map[string]string{"deviceId": c.config.DeviceID, "token": token}, &response); err != nil {
		return err
	}
	if response.ServerID != serverID || !idPattern.MatchString(response.PairingID) {
		return errors.New("pairing server identity rejected")
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	c.pairings[serverID] = response.PairingID
	return nil
}

func (c *Client) associateFolder(serverID, folder string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	r := c.servers[serverID]
	if r == nil || !r.online || !uuidPattern.MatchString(folder) {
		return errors.New("folder association requires a native folder UUID and an online paired server")
	}
	if previous := c.disk.Folders[folder]; previous != "" && previous != serverID {
		return errors.New("folder already belongs to another server")
	}
	for _, b := range c.disk.Bindings {
		if b.FolderUUID == folder && b.ServerID != serverID {
			return errors.New("folder contains an association to another server")
		}
	}
	c.disk.Folders[folder] = serverID
	return c.persistLocked()
}
