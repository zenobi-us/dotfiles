// Legacy-unicast mDNS queries need no tablet daemon or privileged UDP port.
// Bind each query to an interface address to retain IPv6 link-local scope.
package main

import (
	"context"
	"errors"
	"net"
	"time"

	"github.com/miekg/dns"
	"golang.org/x/net/ipv4"
	"golang.org/x/net/ipv6"
)

const coordinatorService = "_omp-ink._tcp.local."

type discoveryRecord struct {
	Name, Type, Domain, IfaceName string
	Port                          int
	IPs                           []net.IP
	Text                          map[string]string
}

type interfaceDiscovery struct {
	records []discoveryRecord
	err     error
}

func browseInterface(ctx context.Context, iface net.Interface, results chan<- interfaceDiscovery) {
	addresses, err := iface.Addrs()
	if err != nil {
		results <- interfaceDiscovery{err: err}
		return
	}
	var v4, v6 net.IP
	for _, address := range addresses {
		ip, _, parseErr := net.ParseCIDR(address.String())
		if parseErr != nil || ip.IsUnspecified() || ip.IsLoopback() {
			continue
		}
		if ip.To4() != nil && v4 == nil {
			v4 = ip
		} else if ip.To4() == nil && v6 == nil {
			v6 = ip
		}
	}
	familyResults := make(chan interfaceDiscovery, 2)
	workers := 0
	for _, ip := range []net.IP{v4, v6} {
		if ip != nil {
			workers++
			go browseSocket(ctx, iface, ip, familyResults)
		}
	}
	result := interfaceDiscovery{err: errors.New("interface has no usable multicast address")}
	for range workers {
		family := <-familyResults
		result.records = append(result.records, family.records...)
		if family.err == nil {
			result.err = nil
		}
	}
	results <- result
}

func browseSocket(ctx context.Context, iface net.Interface, ip net.IP, results chan<- interfaceDiscovery) {
	connection, destination, err := openQuerySocket(iface, ip)
	if err != nil {
		results <- interfaceDiscovery{err: err}
		return
	}
	defer connection.Close()
	stopCancellation := context.AfterFunc(ctx, func() { connection.Close() })
	defer stopCancellation()
	deadline, ok := ctx.Deadline()
	if !ok {
		deadline = time.Now().Add(3 * time.Second)
	}
	if err := connection.SetReadDeadline(deadline); err != nil {
		results <- interfaceDiscovery{err: err}
		return
	}
	cache := newDNSRecordCache()
	asked := make(map[dns.Question]bool)
	questions := []dns.Question{{Name: coordinatorService, Qtype: dns.TypePTR, Qclass: dns.ClassINET}}
	buffer := make([]byte, 65535)
	for {
		for _, question := range questions {
			if asked[question] {
				continue
			}
			asked[question] = true
			message := dns.Msg{Question: []dns.Question{question}}
			packet, packErr := message.Pack()
			if packErr != nil {
				results <- interfaceDiscovery{err: packErr}
				return
			}
			if _, err := connection.WriteToUDP(packet, destination); err != nil {
				if errors.Is(ctx.Err(), context.DeadlineExceeded) {
					err = nil
				}
				results <- interfaceDiscovery{records: cache.records(iface.Name), err: err}
				return
			}
		}
		length, source, readErr := connection.ReadFromUDP(buffer)
		if readErr != nil {
			var timeout net.Error
			if errors.As(readErr, &timeout) && timeout.Timeout() || errors.Is(ctx.Err(), context.DeadlineExceeded) {
				results <- interfaceDiscovery{records: cache.records(iface.Name)}
			} else {
				results <- interfaceDiscovery{err: readErr}
			}
			return
		}
		if source.Port != 5353 {
			continue
		}
		var message dns.Msg
		if message.Unpack(buffer[:length]) != nil || !message.Response || message.Truncated {
			continue
		}
		cache.consume(message.Answer)
		cache.consume(message.Extra)
		questions = cache.questions()
	}
}

func openQuerySocket(iface net.Interface, ip net.IP) (*net.UDPConn, *net.UDPAddr, error) {
	network := "udp4"
	destination := &net.UDPAddr{IP: net.IPv4(224, 0, 0, 251), Port: 5353}
	local := &net.UDPAddr{IP: ip}
	if ip.To4() == nil {
		network = "udp6"
		local.Zone = iface.Name
		destination = &net.UDPAddr{IP: net.ParseIP("ff02::fb"), Port: 5353, Zone: iface.Name}
	}
	connection, err := net.ListenUDP(network, local)
	if err != nil {
		return nil, nil, err
	}
	if network == "udp4" {
		packet := ipv4.NewPacketConn(connection)
		err = packet.SetMulticastInterface(&iface)
		if err == nil {
			err = packet.SetMulticastTTL(255)
		}
	} else {
		packet := ipv6.NewPacketConn(connection)
		err = packet.SetMulticastInterface(&iface)
		if err == nil {
			err = packet.SetMulticastHopLimit(255)
		}
	}
	if err != nil {
		connection.Close()
		return nil, nil, err
	}
	return connection, destination, nil
}
