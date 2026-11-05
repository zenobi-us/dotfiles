// These tests protect DNS-SD choices when packets split or services share a host.
package main

import (
	"reflect"
	"testing"

	"github.com/miekg/dns"
)

func TestServicesOnOneHostRetainSeparateIdentitiesAndPorts(t *testing.T) {
	cache := newDNSRecordCache()
	consumeDNSRecords(t, cache,
		"_omp-ink._tcp.local. 120 IN PTR alpha._omp-ink._tcp.local.",
		"_omp-ink._tcp.local. 120 IN PTR beta._omp-ink._tcp.local.",
		"alpha._omp-ink._tcp.local. 120 IN SRV 0 0 40001 desktop.local.",
		"beta._omp-ink._tcp.local. 120 IN SRV 0 0 40002 desktop.local.",
		`alpha._omp-ink._tcp.local. 120 IN TXT "proto=1" "path=/" "id=0123456789abcdef0123456789abcdef"`,
		`beta._omp-ink._tcp.local. 120 IN TXT "proto=1" "path=/" "id=abcdef0123456789abcdef0123456789"`,
		"desktop.local. 120 IN A 192.0.2.10",
	)
	want := []coordinator{
		{ID: "0123456789abcdef0123456789abcdef", Addresses: []string{"http://192.0.2.10:40001"}},
		{ID: "abcdef0123456789abcdef0123456789", Addresses: []string{"http://192.0.2.10:40002"}},
	}
	if got := collectCoordinators(cache.records("eth0")); !reflect.DeepEqual(got, want) {
		t.Fatalf("services on one host lost their separate identity or port: got %#v; want %#v", got, want)
	}
}

func TestSplitDNSRecordsWaitForMetadataAndRemoveWithdrawnAddresses(t *testing.T) {
	cache := newDNSRecordCache()
	consumeDNSRecords(t, cache, "desktop.local. 120 IN A 192.0.2.10", "desktop.local. 120 IN AAAA fe80::10")
	consumeDNSRecords(t, cache, "alpha._omp-ink._tcp.local. 120 IN SRV 0 0 40001 desktop.local.")
	consumeDNSRecords(t, cache, "_omp-ink._tcp.local. 120 IN PTR alpha._omp-ink._tcp.local.")
	if got := collectCoordinators(cache.records("eth0")); len(got) != 0 {
		t.Fatal("offered a service before its protocol and identity arrived")
	}
	consumeDNSRecords(t, cache, `alpha._omp-ink._tcp.local. 120 IN TXT "proto=1" "path=/" "id=0123456789abcdef0123456789abcdef"`)
	want := []coordinator{{ID: "0123456789abcdef0123456789abcdef", Addresses: []string{"http://192.0.2.10:40001", "http://[fe80::10%25eth0]:40001"}}}
	if got := collectCoordinators(cache.records("eth0")); !reflect.DeepEqual(got, want) {
		t.Fatalf("records from separate packets did not form a scoped choice: got %#v; want %#v", got, want)
	}
	consumeDNSRecords(t, cache, "desktop.local. 0 IN AAAA fe80::10")
	want[0].Addresses = []string{"http://192.0.2.10:40001"}
	if got := collectCoordinators(cache.records("eth0")); !reflect.DeepEqual(got, want) {
		t.Fatalf("retained a withdrawn address: got %#v; want %#v", got, want)
	}
	consumeDNSRecords(t, cache, "_omp-ink._tcp.local. 0 IN PTR alpha._omp-ink._tcp.local.")
	if got := collectCoordinators(cache.records("eth0")); len(got) != 0 {
		t.Fatal("offered a withdrawn service")
	}
}

func consumeDNSRecords(t *testing.T, cache *dnsRecordCache, values ...string) {
	t.Helper()
	records := make([]dns.RR, 0, len(values))
	for _, value := range values {
		record, err := dns.NewRR(value)
		if err != nil {
			t.Fatal(err)
		}
		records = append(records, record)
	}
	cache.consume(records)
}
