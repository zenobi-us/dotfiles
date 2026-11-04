// pi-ink-client checks the desktop coordinator and downloads verified bootstrap bundles.
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var version = "development"

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		return errors.New("usage: pi-ink-client status|download-bundle|validate-url|version")
	}
	command := args[0]
	if command == "version" {
		if len(args) != 1 {
			return errors.New("usage: pi-ink-client version")
		}
		fmt.Println(version)
		return nil
	}
	if command != "status" && command != "download-bundle" && command != "validate-url" {
		return errors.New("unknown command: use status, download-bundle, validate-url, or version")
	}
	flags := flag.NewFlagSet(command, flag.ContinueOnError)
	coordinator := flags.String("coordinator-url", "", "HTTP or HTTPS coordinator base URL")
	var output string
	if command == "download-bundle" {
		flags.StringVar(&output, "output", "", "new file for the verified bundle")
	}
	if err := flags.Parse(args[1:]); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return nil
		}
		return err
	}
	if flags.NArg() != 0 {
		return errors.New("unexpected positional arguments; use named flags")
	}
	if command == "download-bundle" && output == "" {
		return errors.New("download-bundle requires --output with a new file path")
	}
	base, err := coordinatorURL(*coordinator)
	if err != nil {
		return err
	}
	if command == "validate-url" {
		_, err := fmt.Fprintln(os.Stdout, base)
		return err
	}
	client := &http.Client{Timeout: 2 * time.Minute}
	if command == "status" {
		return status(client, base)
	}
	return downloadBundle(client, base, output)
}

func status(client *http.Client, base string) error {
	body, err := fetchSmall(client, base+"/health", 64*1024)
	if err != nil {
		return fmt.Errorf("read coordinator health: %w", err)
	}
	var health struct {
		Service  string `json:"service"`
		Status   string `json:"status"`
		Protocol int    `json:"protocol"`
	}
	if err := json.Unmarshal(body, &health); err != nil {
		return errors.New("coordinator health must be valid JSON")
	}
	if health.Service != "image-annotator" || health.Status != "ok" || health.Protocol != 1 {
		return errors.New("coordinator health must report service image-annotator, status ok, and protocol 1")
	}
	_, err = fmt.Fprintln(os.Stdout, strings.TrimSpace(string(body)))
	return err
}

func downloadBundle(client *http.Client, base, output string) error {
	file, err := os.OpenFile(output, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return fmt.Errorf("create new bundle output: %w", err)
	}
	complete := false
	defer func() {
		file.Close()
		if !complete {
			os.Remove(output)
		}
	}()

	checksum, err := fetchSmall(client, base+"/tablet/bundle.sha256", 1024)
	if err != nil {
		return fmt.Errorf("read bundle checksum: %w", err)
	}
	expected, err := parseChecksum(checksum)
	if err != nil {
		return err
	}
	response, err := get(client, base+"/tablet/bundle.tar.gz")
	if err != nil {
		return fmt.Errorf("download bundle: %w", err)
	}
	defer response.Body.Close()
	digest := sha256.New()
	if _, err := io.Copy(io.MultiWriter(file, digest), response.Body); err != nil {
		return fmt.Errorf("write bundle output: %w", err)
	}
	if !bytes.Equal(digest.Sum(nil), expected) {
		return errors.New("bundle SHA-256 mismatch; partial output removed")
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close bundle output: %w", err)
	}
	complete = true
	return nil
}

func coordinatorURL(value string) (string, error) {
	if value == "" {
		executable, err := os.Executable()
		if err != nil {
			return "", errors.New("cannot locate executable; provide --coordinator-url")
		}
		executable, err = filepath.EvalSymlinks(executable)
		if err != nil {
			return "", errors.New("cannot resolve executable; provide --coordinator-url")
		}
		data, err := os.ReadFile(filepath.Join(filepath.Dir(executable), "coordinator-url"))
		if err != nil {
			return "", errors.New("cannot read coordinator-url next to executable; provide --coordinator-url")
		}
		value = strings.TrimSuffix(strings.TrimSuffix(string(data), "\n"), "\r")
		if strings.ContainsAny(value, "\r\n") {
			return "", errors.New("coordinator-url must contain one URL on a single line")
		}
	}
	base, err := url.Parse(value)
	if err != nil || (base.Scheme != "http" && base.Scheme != "https") || base.Hostname() == "" || base.User != nil || base.RawQuery != "" || base.ForceQuery || base.Fragment != "" || base.Opaque != "" {
		return "", errors.New("coordinator URL must be an http:// or https:// base URL without credentials, query, or fragment")
	}
	return strings.TrimRight(base.String(), "/"), nil
}

func parseChecksum(body []byte) ([]byte, error) {
	line := strings.TrimSpace(string(body))
	fields := strings.Fields(line)
	if strings.ContainsAny(line, "\r\n") || len(fields) != 2 || (fields[1] != "bundle.tar.gz" && fields[1] != "*bundle.tar.gz") {
		return nil, errors.New("bundle checksum must be one sha256sum line for bundle.tar.gz")
	}
	digest, err := hex.DecodeString(fields[0])
	if err != nil || len(digest) != sha256.Size {
		return nil, errors.New("bundle checksum must contain a 64-digit SHA-256 digest")
	}
	return digest, nil
}

func fetchSmall(client *http.Client, address string, limit int64) ([]byte, error) {
	response, err := get(client, address)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, limit+1))
	if err != nil {
		return nil, fmt.Errorf("read coordinator response: %w", err)
	}
	if int64(len(body)) > limit {
		return nil, errors.New("coordinator response exceeds size limit")
	}
	return body, nil
}

func get(client *http.Client, address string) (*http.Response, error) {
	response, err := client.Get(address)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	if response.StatusCode != http.StatusOK {
		response.Body.Close()
		return nil, fmt.Errorf("coordinator returned HTTP %d; expected 200", response.StatusCode)
	}
	return response, nil
}
