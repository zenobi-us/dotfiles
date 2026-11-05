// Service instances and host addresses use separate caches: several coordinators
// can share a host, and their PTR, SRV, TXT, and address records can arrive separately.
package main

import (
	"net"
	"strings"

	"github.com/miekg/dns"
)

type dnsRecordCache struct {
	instances map[string]string
	services  map[string]*dns.SRV
	text      map[string][]string
	addresses map[string]map[string]net.IP
}

func (cache *dnsRecordCache) consume(records []dns.RR) {
	for _, record := range records {
		header := record.Header()
		name := strings.ToLower(header.Name)
		if !strings.HasSuffix(name, ".local.") {
			continue
		}
		switch value := record.(type) {
		case *dns.PTR:
			if name != coordinatorService || !strings.HasSuffix(strings.ToLower(value.Ptr), "."+coordinatorService) {
				continue
			}
			instance := strings.ToLower(value.Ptr)
			if header.Ttl == 0 {
				delete(cache.instances, instance)
			} else {
				cache.instances[instance] = value.Ptr
			}
		case *dns.SRV:
			if header.Ttl == 0 {
				delete(cache.services, name)
			} else {
				cache.services[name] = value
			}
		case *dns.TXT:
			if header.Ttl == 0 {
				delete(cache.text, name)
			} else {
				cache.text[name] = value.Txt
			}
		case *dns.A:
			cache.address(name, value.A, header.Ttl)
		case *dns.AAAA:
			cache.address(name, value.AAAA, header.Ttl)
		}
	}
}

func (cache *dnsRecordCache) records(interfaceName string) []discoveryRecord {
	records := make([]discoveryRecord, 0, len(cache.instances))
	for key, name := range cache.instances {
		service, hasService := cache.services[key]
		text, hasText := cache.text[key]
		if !hasService || !hasText {
			continue
		}
		addresses := cache.addresses[strings.ToLower(service.Target)]
		if len(addresses) == 0 {
			continue
		}
		record := discoveryRecord{
			Name: name, Type: "_omp-ink._tcp", Domain: "local", IfaceName: interfaceName,
			Port: int(service.Port), Text: make(map[string]string, len(text)), IPs: make([]net.IP, 0, len(addresses)),
		}
		for _, ip := range addresses {
			record.IPs = append(record.IPs, ip)
		}
		for _, field := range text {
			key, value, _ := strings.Cut(field, "=")
			key = strings.ToLower(key)
			if _, exists := record.Text[key]; !exists {
				record.Text[key] = value
			}
		}
		records = append(records, record)
	}
	return records
}

func (cache *dnsRecordCache) questions() []dns.Question {
	var questions []dns.Question
	for instance := range cache.instances {
		service, hasService := cache.services[instance]
		if !hasService {
			questions = append(questions, dns.Question{Name: instance, Qtype: dns.TypeSRV, Qclass: dns.ClassINET})
		}
		if _, hasText := cache.text[instance]; !hasText {
			questions = append(questions, dns.Question{Name: instance, Qtype: dns.TypeTXT, Qclass: dns.ClassINET})
		}
		if hasService && strings.HasSuffix(strings.ToLower(service.Target), ".local.") && len(cache.addresses[strings.ToLower(service.Target)]) == 0 {
			questions = append(questions,
				dns.Question{Name: service.Target, Qtype: dns.TypeA, Qclass: dns.ClassINET},
				dns.Question{Name: service.Target, Qtype: dns.TypeAAAA, Qclass: dns.ClassINET})
		}
	}
	return questions
}

func newDNSRecordCache() *dnsRecordCache {
	return &dnsRecordCache{
		instances: make(map[string]string), services: make(map[string]*dns.SRV),
		text: make(map[string][]string), addresses: make(map[string]map[string]net.IP),
	}
}

func (cache *dnsRecordCache) address(name string, ip net.IP, ttl uint32) {
	if ttl == 0 {
		delete(cache.addresses[name], ip.String())
		return
	}
	addresses := cache.addresses[name]
	if addresses == nil {
		addresses = make(map[string]net.IP)
		cache.addresses[name] = addresses
	}
	addresses[ip.String()] = ip
}
