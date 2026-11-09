// pi-ink-client checks the desktop coordinator and downloads verified bootstrap bundles.
package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

var version = "development"

const maximumBundleSize int64 = 64 << 20

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		return errors.New("usage: pi-ink-client discover|select|status|download-bundle|update|version|serve|appload|install-client")
	}
	command := args[0]
	if command == "install-client" {
		return installClient(args[1:])
	}
	if command == "appload" {
		flags := flag.NewFlagSet("appload", flag.ContinueOnError)
		config := flags.String("config", "/home/root/.local/share/pi-ink-bridge/config.json", "private setup configuration")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 {
			return errors.New("appload requires the AppLoad socket path")
		}
		return runAppLoad(flags.Arg(0), *config)
	}
	if command == "serve" {
		return serve(args[1:])
	}
	if command == "version" {
		if len(args) != 1 {
			return errors.New("usage: pi-ink-client version")
		}
		fmt.Println(version)
		return nil
	}
	if command != "status" && command != "download-bundle" && command != "discover" && command != "select" && command != "update" {
		return errors.New("unknown command: use discover, select, status, download-bundle, update, or version")
	}
	flags := flag.NewFlagSet(command, flag.ContinueOnError)
	var coordinatorID string
	if command != "discover" {
		flags.StringVar(&coordinatorID, "coordinator-id", "", "32 lowercase hexadecimal coordinator ID")
	}
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
	if command == "select" && coordinatorID == "" {
		return errors.New("select requires --coordinator-id from discover")
	}
	if coordinatorID != "" && !validCoordinatorID(coordinatorID) {
		return errors.New("coordinator ID must contain 32 lowercase hexadecimal characters")
	}
	var preferencePath string
	if command != "discover" {
		var err error
		preferencePath, err = coordinatorIDPath()
		if err != nil {
			return err
		}
		if coordinatorID == "" {
			coordinatorID, err = readCoordinatorID(preferencePath)
			if err != nil {
				return err
			}
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	coordinators, err := discoverCoordinators(ctx)
	if err != nil {
		return err
	}
	if command == "discover" {
		return json.NewEncoder(os.Stdout).Encode(coordinators)
	}
	coordinator, err := chooseCoordinator(coordinators, coordinatorID)
	if err != nil {
		return err
	}
	// Bootstrap traffic goes straight to mDNS addresses, never through a proxy
	// or redirect that could move the request away from the selected coordinator.
	client := &http.Client{
		Timeout:       2 * time.Minute,
		Transport:     &http.Transport{},
		CheckRedirect: refuseRedirect,
	}
	defer client.CloseIdleConnections()
	healthContext, healthCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer healthCancel()
	base, health, err := reachableCoordinator(healthContext, client, coordinator)
	if err != nil {
		return err
	}
	if command == "select" {
		return saveCoordinatorID(preferencePath, coordinator.ID)
	}
	if command == "status" {
		_, err = fmt.Fprintln(os.Stdout, strings.TrimSpace(string(health)))
		return err
	}
	if command == "update" {
		fmt.Fprintln(os.Stderr, "WARNING: unsigned development update over HTTP. Discovery and the adjacent SHA256 checksum do not authenticate the publisher. Use only an explicitly trusted development network and approved payload.")
		executable, err := os.Executable()
		if err != nil {
			return errors.New("cannot locate installed client for update")
		}
		result, err := updateClient(client, base, executable)
		if err != nil {
			return err
		}
		return json.NewEncoder(os.Stdout).Encode(result)
	}
	return downloadBundle(client, base, output)
}

func refuseRedirect(_ *http.Request, _ []*http.Request) error {
	return errors.New("coordinator redirects are not allowed")
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
	size, err := io.Copy(io.MultiWriter(file, digest), io.LimitReader(response.Body, maximumBundleSize+1))
	if err != nil {
		return fmt.Errorf("write bundle output: %w", err)
	}
	if size > maximumBundleSize {
		return errors.New("bundle exceeds the 64 MiB download limit")
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
