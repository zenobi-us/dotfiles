// Discovery turns untrusted DNS-SD records into coordinator choices. Addresses
// last for one command; only a coordinator ID can persist between commands.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
)

func discoverCoordinators(ctx context.Context) ([]coordinator, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, errors.New("cannot list multicast network interfaces")
	}
	results := make(chan interfaceDiscovery, len(interfaces))
	workers := 0
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagMulticast == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		workers++
		go browseInterface(ctx, iface, results)
	}
	var records []discoveryRecord
	successes := 0
	for range workers {
		result := <-results
		if result.err == nil {
			successes++
		}
		records = append(records, result.records...)
	}
	if successes == 0 {
		return nil, errors.New("cannot browse coordinators over multicast-capable interfaces")
	}
	return collectCoordinators(records), nil
}

func chooseCoordinator(coordinators []coordinator, preferredID string) (coordinator, error) {
	if preferredID != "" {
		for _, candidate := range coordinators {
			if candidate.ID == preferredID {
				return candidate, nil
			}
		}
		return coordinator{}, errors.New("selected coordinator was not discovered; restore its connection or use select --coordinator-id with another discovered ID")
	}
	if len(coordinators) == 0 {
		return coordinator{}, errors.New("no compatible coordinator discovered; check the desktop and local multicast connectivity")
	}
	if len(coordinators) != 1 {
		return coordinator{}, errors.New("multiple coordinators discovered; use discover, then select --coordinator-id")
	}
	return coordinators[0], nil
}

func reachableCoordinator(ctx context.Context, client *http.Client, candidate coordinator) (string, []byte, error) {
	// Probe all advertised addresses concurrently so a blackholed interface
	// cannot hide a working address. Every response must retain the chosen ID.
	results := make(chan healthResult, len(candidate.Addresses))
	probeContext, cancel := context.WithCancel(ctx)
	defer cancel()
	for _, address := range candidate.Addresses {
		go probeCoordinator(probeContext, client, address, candidate.ID, results)
	}
	for range candidate.Addresses {
		select {
		case result := <-results:
			if result.err == nil {
				return result.address, result.body, nil
			}
		case <-ctx.Done():
			return "", nil, errors.New("selected coordinator did not provide compatible health before the deadline")
		}
	}
	return "", nil, errors.New("selected coordinator has no reachable address with matching health and ID")
}

type coordinator struct {
	ID        string   `json:"id"`
	Addresses []string `json:"addresses"`
}

type coordinatorHealthResponse struct {
	Service  string `json:"service"`
	Status   string `json:"status"`
	Protocol int    `json:"protocol"`
	ID       string `json:"id"`
}

type healthResult struct {
	address string
	body    []byte
	err     error
}

func collectCoordinators(records []discoveryRecord) []coordinator {
	byID := make(map[string]map[string]bool)
	for _, entry := range records {
		id := entry.Text["id"]
		if entry.Type != "_omp-ink._tcp" || entry.Domain != "local" || entry.Text["proto"] != "1" || entry.Text["path"] != "/" || !validCoordinatorID(id) || entry.Port < 1 || entry.Port > 65535 {
			continue
		}
		for _, ip := range entry.IPs {
			address := coordinatorAddress(ip, entry.IfaceName, entry.Port)
			if address == "" {
				continue
			}
			if byID[id] == nil {
				byID[id] = make(map[string]bool)
			}
			byID[id][address] = true
		}
	}
	coordinators := make([]coordinator, 0, len(byID))
	for id, addresses := range byID {
		candidate := coordinator{ID: id, Addresses: make([]string, 0, len(addresses))}
		for address := range addresses {
			candidate.Addresses = append(candidate.Addresses, address)
		}
		slices.Sort(candidate.Addresses)
		coordinators = append(coordinators, candidate)
	}
	slices.SortFunc(coordinators, compareCoordinatorIDs)
	return coordinators
}

func coordinatorAddress(ip net.IP, interfaceName string, port int) string {
	if ip.To16() == nil || ip.IsUnspecified() || ip.IsMulticast() {
		return ""
	}
	host := ip.String()
	if ip.To4() == nil && ip.IsLinkLocalUnicast() {
		if interfaceName == "" {
			return ""
		}
		host += "%" + interfaceName
	}
	address := url.URL{Scheme: "http", Host: net.JoinHostPort(host, strconv.Itoa(port))}
	return address.String()
}

func probeCoordinator(ctx context.Context, client *http.Client, address, id string, results chan<- healthResult) {
	body, err := coordinatorHealth(ctx, client, address, id)
	results <- healthResult{address: address, body: body, err: err}
}

func compareCoordinatorIDs(left, right coordinator) int {
	return strings.Compare(left.ID, right.ID)
}

func coordinatorHealth(ctx context.Context, client *http.Client, address, id string) ([]byte, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, address+"/health", nil)
	if err != nil {
		return nil, errors.New("cannot create coordinator health request")
	}
	response, err := client.Do(request)
	if err != nil {
		return nil, errors.New("cannot reach coordinator health endpoint")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, errors.New("coordinator health must return HTTP 200")
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, 64*1024+1))
	if err != nil || len(body) > 64*1024 {
		return nil, errors.New("cannot read bounded coordinator health response")
	}
	if err := validateHealth(body, id); err != nil {
		return nil, err
	}
	return body, nil
}

func validateHealth(body []byte, id string) error {
	var health coordinatorHealthResponse
	if json.Unmarshal(body, &health) != nil || health.Service != "image-annotator" || health.Status != "ok" || health.Protocol != 1 || !validCoordinatorID(health.ID) || health.ID != id {
		return errors.New("coordinator health must report image-annotator, status ok, protocol 1, and the discovered coordinator ID")
	}
	return nil
}

func validCoordinatorID(id string) bool {
	if len(id) != 32 {
		return false
	}
	for _, character := range id {
		if (character < '0' || character > '9') && (character < 'a' || character > 'f') {
			return false
		}
	}
	return true
}

func coordinatorIDPath() (string, error) {
	executable, err := os.Executable()
	if err != nil {
		return "", errors.New("cannot locate executable for coordinator preference")
	}
	executable, err = filepath.EvalSymlinks(executable)
	if err != nil {
		return "", errors.New("cannot resolve executable for coordinator preference")
	}
	return filepath.Join(filepath.Dir(executable), "coordinator-id"), nil
}

func readCoordinatorID(path string) (string, error) {
	file, err := os.Open(path)
	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}
	if err != nil {
		return "", errors.New("cannot read coordinator-id beside executable")
	}
	defer file.Close()
	body, err := io.ReadAll(io.LimitReader(file, 35))
	if err != nil {
		return "", errors.New("cannot read coordinator-id beside executable")
	}
	id := strings.TrimSuffix(strings.TrimSuffix(string(body), "\n"), "\r")
	if !validCoordinatorID(id) {
		return "", errors.New("coordinator-id must contain one ID of 32 lowercase hexadecimal characters")
	}
	return id, nil
}

func saveCoordinatorID(path, id string) error {
	if !validCoordinatorID(id) {
		return errors.New("coordinator ID must contain 32 lowercase hexadecimal characters")
	}
	file, err := os.CreateTemp(filepath.Dir(path), ".coordinator-id-*")
	if err != nil {
		return errors.New("cannot create private coordinator preference beside executable")
	}
	defer os.Remove(file.Name())
	if _, err := fmt.Fprintln(file, id); err != nil {
		file.Close()
		return errors.New("cannot write coordinator preference")
	}
	if err := file.Close(); err != nil {
		return errors.New("cannot close coordinator preference")
	}
	if err := os.Rename(file.Name(), path); err != nil {
		return errors.New("cannot save coordinator-id beside executable")
	}
	return nil
}
