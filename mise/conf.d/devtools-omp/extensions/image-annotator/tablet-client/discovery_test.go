// These tests cover user-visible discovery choices without multicast timing.
package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"
)

func TestSelectionRequiresAnUnambiguousOrExplicitID(t *testing.T) {
	first := coordinator{ID: "0123456789abcdef0123456789abcdef"}
	second := coordinator{ID: "abcdef0123456789abcdef0123456789"}
	cases := []struct {
		name      string
		choices   []coordinator
		preferred string
		want      string
	}{
		{"none", nil, "", ""},
		{"single", []coordinator{first}, "", first.ID},
		{"ambiguous", []coordinator{first, second}, "", ""},
		{"explicit", []coordinator{first, second}, second.ID, second.ID},
		{"remembered missing", []coordinator{second}, first.ID, ""},
	}
	for _, test := range cases {
		got, err := chooseCoordinator(test.choices, test.preferred)
		if test.want == "" {
			if err == nil {
				t.Errorf("%s: selected a coordinator without a valid choice", test.name)
			}
		} else if err != nil || got.ID != test.want {
			t.Errorf("%s: got %q, %v; want %q", test.name, got.ID, err, test.want)
		}
	}
}

func TestDiscoveryMergesDuplicateIDsAndKeepsInterfaceZones(t *testing.T) {
	entry := discoveryTestEntry()
	entry.IPs = []net.IP{net.ParseIP("192.0.2.10"), net.ParseIP("192.0.2.10"), net.ParseIP("fe80::10"), net.ParseIP("2001:db8::10")}
	other := entry
	other.IfaceName = "wlan0"
	records := []discoveryRecord{entry, entry, other}
	got := collectCoordinators(records)
	want := []coordinator{{ID: entry.Text["id"], Addresses: []string{
		"http://192.0.2.10:43123", "http://[2001:db8::10]:43123", "http://[fe80::10%25eth0]:43123", "http://[fe80::10%25wlan0]:43123",
	}}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v; want %#v", got, want)
	}
	parsed, err := url.Parse(got[0].Addresses[2])
	if err != nil || parsed.Hostname() != "fe80::10%eth0" {
		t.Fatalf("link-local URL lost its interface: %v, %v", parsed, err)
	}
}

func TestIncompatibleAdvertisementsAreNotChoices(t *testing.T) {
	cases := []struct{ key, value string }{
		{"proto", "2"}, {"proto", ""}, {"path", "/other"}, {"id", "0123456789ABCDEF0123456789ABCDEF"}, {"id", "short"},
	}
	for _, test := range cases {
		entry := discoveryTestEntry()
		entry.Text[test.key] = test.value
		if got := collectCoordinators([]discoveryRecord{entry}); len(got) != 0 {
			t.Errorf("accepted incompatible %s advertisement", test.key)
		}
	}
	for _, port := range []int{0, -1, 65536} {
		entry := discoveryTestEntry()
		entry.Port = port
		if got := collectCoordinators([]discoveryRecord{entry}); len(got) != 0 {
			t.Errorf("accepted port %d", port)
		}
	}
	for _, ip := range []string{"fe80::1", "::", "ff02::fb", "0.0.0.0", "224.0.0.251", "invalid"} {
		if got := coordinatorAddress(net.ParseIP(ip), "", 43123); got != "" {
			t.Errorf("accepted unrouteable address boundary %s: %s", ip, got)
		}
	}
}

func TestHealthMustMatchTheDiscoveredIdentityAndProtocol(t *testing.T) {
	id := discoveryTestEntry().Text["id"]
	valid := fmt.Sprintf(`{"service":"image-annotator","status":"ok","protocol":1,"id":%q}`, id)
	if err := validateHealth([]byte(valid), id); err != nil {
		t.Fatal(err)
	}
	for _, body := range []string{
		`{"service":"image-annotator","status":"ok","protocol":1}`,
		fmt.Sprintf(`{"service":"image-annotator","status":"ok","protocol":2,"id":%q}`, id),
		fmt.Sprintf(`{"service":"other","status":"ok","protocol":1,"id":%q}`, id),
		fmt.Sprintf(`{"service":"image-annotator","status":"failed","protocol":1,"id":%q}`, id),
		`{"service":"image-annotator","status":"ok","protocol":1,"id":"abcdef0123456789abcdef0123456789"}`,
	} {
		if err := validateHealth([]byte(body), id); err == nil {
			t.Errorf("accepted incompatible health: %s", body)
		}
	}
}

func TestReachableAddressDoesNotChangeCoordinatorIdentity(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(discoveryHealthHandler))
	defer server.Close()
	id := discoveryTestEntry().Text["id"]
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	candidate := coordinator{ID: id, Addresses: []string{"http://127.0.0.1:0", server.URL}}
	address, _, err := reachableCoordinator(ctx, server.Client(), candidate)
	if err != nil || address != server.URL {
		t.Fatalf("working address not selected: %q, %v", address, err)
	}
	candidate.ID = "abcdef0123456789abcdef0123456789"
	if _, _, err := reachableCoordinator(ctx, server.Client(), candidate); err == nil {
		t.Fatal("used a reachable address belonging to another coordinator ID")
	}
}

func TestPreferenceIsOptionalPrivateAndReplaceable(t *testing.T) {
	path := filepath.Join(t.TempDir(), "coordinator-id")
	if id, err := readCoordinatorID(path); err != nil || id != "" {
		t.Fatalf("missing preference must permit discovery: %q, %v", id, err)
	}
	ids := []string{discoveryTestEntry().Text["id"], "abcdef0123456789abcdef0123456789"}
	for _, id := range ids {
		if err := saveCoordinatorID(path, id); err != nil {
			t.Fatal(err)
		}
		got, err := readCoordinatorID(path)
		if err != nil || got != id {
			t.Fatalf("preference was not replaced: %q, %v", got, err)
		}
		info, err := os.Stat(path)
		if err != nil {
			t.Fatal(err)
		}
		if info.Mode().Perm() != 0600 {
			t.Fatalf("preference permissions: %o", info.Mode().Perm())
		}
	}
	if err := os.WriteFile(path, []byte(ids[0]+"\nextra"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := readCoordinatorID(path); err == nil {
		t.Fatal("invalid saved preference silently fell back to discovery")
	}
}

func discoveryTestEntry() discoveryRecord {
	return discoveryRecord{
		Name: "desktop", Type: "_omp-ink._tcp", Domain: "local", IfaceName: "eth0", Port: 43123,
		IPs:  []net.IP{net.ParseIP("192.0.2.10")},
		Text: map[string]string{"proto": "1", "id": "0123456789abcdef0123456789abcdef", "path": "/"},
	}
}

func discoveryHealthHandler(writer http.ResponseWriter, request *http.Request) {
	if request.URL.Path != "/health" {
		http.NotFound(writer, request)
		return
	}
	fmt.Fprintf(writer, `{"service":"image-annotator","status":"ok","protocol":1,"id":%q}`, discoveryTestEntry().Text["id"])
}
