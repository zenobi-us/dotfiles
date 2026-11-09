// Production deployment owns two named links and immutable releases, never existing experiments.
package main

import (
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type bootstrapServer struct {
	ServerID    string `json:"serverId"`
	Name        string `json:"name"`
	Origin      string `json:"origin"`
	Certificate string `json:"certificate"`
	Fingerprint string `json:"fingerprint"`
}

func installClient(args []string) error {
	flags := flag.NewFlagSet("install-client", flag.ContinueOnError)
	digest := flags.String("archive-sha256", "", "trusted ZIP digest")
	source := flags.String("source", "", "verified extracted release")
	server := flags.String("server", "", "verified bootstrap record")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 || !digestPattern.MatchString(*digest) || !filepath.IsAbs(*source) || !filepath.IsAbs(*server) {
		return errors.New("install-client requires verified release and server paths and a SHA256 digest")
	}
	return installRelease(*source, *server, "/home/root", *digest)
}

func installRelease(source, serverPath, home, digest string) error {
	data, err := os.ReadFile(serverPath)
	if err != nil {
		return err
	}
	var server bootstrapServer
	if json.Unmarshal(data, &server) != nil || !idPattern.MatchString(server.ServerID) || !digestPattern.MatchString(server.Fingerprint) {
		return errors.New("invalid bootstrap identity")
	}
	block, rest := pem.Decode([]byte(server.Certificate))
	if block == nil || block.Type != "CERTIFICATE" || len(rest) != 0 {
		return errors.New("bootstrap must contain one PEM certificate")
	}
	certificate, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return errors.New("invalid bootstrap certificate")
	}
	hash := sha256.Sum256(certificate.Raw)
	if hex.EncodeToString(hash[:]) != server.Fingerprint || time.Now().Before(certificate.NotBefore) || time.Now().After(certificate.NotAfter) {
		return errors.New("bootstrap certificate fingerprint or validity rejected")
	}
	// Use the same strict HTTPS/CA configuration as normal client connections.
	base := filepath.Join(home, ".local/share/pi-ink-bridge")
	configPath := filepath.Join(base, "config.json")
	caPath := filepath.Join(base, "server-ca.pem")
	release := filepath.Join(base, "releases", digest)
	appLink := filepath.Join(home, "xovi/exthome/appload/pi-annotations")
	patchLink := filepath.Join(home, "xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd")
	for _, path := range []string{base, filepath.Join(base, "releases"), filepath.Dir(appLink), filepath.Dir(patchLink)} {
		if err := rejectSymlinkParents(path); err != nil {
			return err
		}
	}
	for link, target := range map[string]string{appLink: filepath.Join(release, "app"), patchLink: filepath.Join(release, "sidebar.qmd")} {
		info, err := os.Lstat(link)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink == 0 {
			return fmt.Errorf("occupied installation path; preserve and repair manually: %s", link)
		}
		existing, err := os.Readlink(link)
		if err != nil || existing != target {
			return errors.New("existing launcher differs; an explicit upgrade/repair plan is required")
		}
	}
	files := []string{"pi-ink-client", "VERSION", "sidebar.qmd", "app/manifest.json", "app/resources.rcc", "app/backend/entry"}
	for _, name := range files {
		info, err := os.Lstat(filepath.Join(source, name))
		if err != nil || !info.Mode().IsRegular() {
			return errors.New("verified release is missing a regular required file")
		}
	}
	oldConfig, err := os.ReadFile(configPath)
	if err == nil {
		var config Config
		if json.Unmarshal(oldConfig, &config) != nil || len(config.Servers) != 1 || config.Servers[0].ServerID != server.ServerID || config.Servers[0].Origin != server.Origin {
			return errors.New("existing server configuration differs; pairing and drafts were preserved")
		}
		ca, err := os.ReadFile(caPath)
		if err != nil || string(ca) != server.Certificate {
			return errors.New("existing certificate differs; trust was not replaced")
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	// Construct and verify the new transport before publishing a launcher.
	if err := os.MkdirAll(base, 0700); err != nil {
		return err
	}
	for _, name := range []string{"config.json", "server-ca.pem", "state.json"} {
		info, err := os.Lstat(filepath.Join(base, name))
		if err == nil && (!info.Mode().IsRegular() || info.Mode().Perm()&0077 != 0) {
			return errors.New("existing private client data has unsafe type or permissions")
		}
		if err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	if len(oldConfig) == 0 {
		if err := exclusiveFile(caPath, []byte(server.Certificate), 0600); err != nil {
			return err
		}
		remote, err := newRemote(ServerConfig{ServerID: server.ServerID, Name: server.Name, Origin: server.Origin, CA: caPath})
		if err != nil {
			return err
		}
		remote.client.CloseIdleConnections()
		device, err := nonce()
		if err != nil {
			return err
		}
		config := Config{DeviceID: device, StatePath: filepath.Join(base, "state.json"), UIAddress: uiAddress, Servers: []ServerConfig{remote.config}}
		bytes, err := json.Marshal(config)
		if err != nil {
			return err
		}
		if err := exclusiveFile(configPath, bytes, 0600); err != nil {
			return err
		}
	}
	if info, err := os.Lstat(release); err == nil {
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return errors.New("release path is occupied")
		}
		for _, name := range files {
			expected, e1 := os.ReadFile(filepath.Join(source, name))
			actual, e2 := os.ReadFile(filepath.Join(release, name))
			if e1 != nil || e2 != nil || sha256.Sum256(expected) != sha256.Sum256(actual) {
				return errors.New("existing release changed; no files were overwritten")
			}
		}
	} else if os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(release), 0700); err != nil {
			return err
		}
		staging, err := os.MkdirTemp(filepath.Dir(release), ".install-")
		if err != nil {
			return err
		}
		defer os.RemoveAll(staging)
		for _, name := range files {
			destination := filepath.Join(staging, name)
			if err := os.MkdirAll(filepath.Dir(destination), 0700); err != nil {
				return err
			}
			bytes, err := os.ReadFile(filepath.Join(source, name))
			if err != nil {
				return err
			}
			mode := os.FileMode(0600)
			if name == "pi-ink-client" || name == "app/backend/entry" {
				mode = 0700
			}
			if err := exclusiveFile(destination, bytes, mode); err != nil {
				return err
			}
		}
		if err := os.Rename(staging, release); err != nil {
			return err
		}
	} else {
		return err
	}
	for link, target := range map[string]string{appLink: filepath.Join(release, "app"), patchLink: filepath.Join(release, "sidebar.qmd")} {
		if _, err := os.Lstat(link); os.IsNotExist(err) {
			if err := os.Symlink(target, link); err != nil {
				return err
			}
		}
	}
	fmt.Println("Pi Annotations installed; existing pairing, drafts, and unrelated files preserved.")
	return nil
}
func rejectSymlinkParents(path string) error {
	for path != string(filepath.Separator) {
		info, err := os.Lstat(path)
		if err == nil && (!info.IsDir() || info.Mode()&os.ModeSymlink != 0) {
			return errors.New("installation directories must not be symlinks or non-directories")
		}
		if err != nil && !os.IsNotExist(err) {
			return err
		}
		path = filepath.Dir(path)
	}
	return nil
}
func exclusiveFile(path string, data []byte, mode os.FileMode) error {
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, mode)
	if err != nil {
		return err
	}
	if _, err = file.Write(data); err != nil {
		file.Close()
		return err
	}
	if err = file.Sync(); err != nil {
		file.Close()
		return err
	}
	return file.Close()
}
