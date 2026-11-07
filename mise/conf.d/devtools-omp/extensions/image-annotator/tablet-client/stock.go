// Reads only kernel network observations and the stock loopback upload/download API.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type hardwareObservation struct {
	Type      string            `json:"type,omitempty"`
	DeviceID  string            `json:"deviceId,omitempty"`
	UDC       map[string]string `json:"udc"`
	USBIPv4   []string          `json:"usbIPv4"`
	Listeners []string          `json:"listeners"`
	Safe      bool              `json:"safe"`
	Error     string            `json:"error,omitempty"`
}

var observeHardware = readHardware

func readHardware() hardwareObservation {
	o := hardwareObservation{UDC: map[string]string{}, USBIPv4: []string{}, Listeners: []string{}, Safe: true}
	o.readUDCStates("/sys/class/udc/*/state")
	interfaces, err := net.Interfaces()
	if err != nil {
		o.Safe = false
	}
	for _, iface := range interfaces {
		if !strings.HasPrefix(iface.Name, "usb") {
			continue
		}
		addresses, err := iface.Addrs()
		if err != nil {
			o.Safe = false
			continue
		}
		for _, address := range addresses {
			ip, _, err := net.ParseCIDR(address.String())
			if err != nil {
				o.Safe = false
				continue
			}
			if ip.To4() != nil {
				o.USBIPv4 = append(o.USBIPv4, iface.Name+":"+ip.String())
				o.Safe = false
			}
		}
	}
	found := false
	for _, path := range []string{"/proc/net/tcp", "/proc/net/tcp6"} {
		data, err := os.ReadFile(path)
		if err != nil {
			o.Safe = false
			continue
		}
		for _, line := range strings.Split(string(data), "\n") {
			fields := strings.Fields(line)
			if len(fields) < 4 || fields[3] != "0A" {
				continue
			}
			address := strings.ToUpper(fields[1])
			parts := strings.Split(address, ":")
			if len(parts) != 2 {
				continue
			}
			if parts[1] != "0051" && parts[1] != "0050" {
				continue
			}
			o.Listeners = append(o.Listeners, filepath.Base(path)+":"+address)
			if parts[1] == "0051" {
				found = true
				if path != "/proc/net/tcp" || parts[0] != "0100007F" {
					o.Safe = false
				}
			}
			if parts[1] == "0050" && (path != "/proc/net/tcp" || parts[0] != "0100007F") {
				o.Safe = false
			}
		}
	}
	if !found {
		o.Safe = false
	}
	if !o.Safe && o.Error == "" {
		o.Error = "require detached or powered USB without USB IPv4, stock service on IPv4 localhost:81, and no exposed port80"
	}
	return o
}

func (o *hardwareObservation) readUDCStates(pattern string) {
	paths, err := filepath.Glob(pattern)
	if err != nil || len(paths) != 2 {
		o.Safe = false
		o.Error = "Paper Pro requires observations from both UDC controllers"
	}
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			o.Safe = false
			continue
		}
		state := strings.TrimSpace(string(data))
		o.UDC[filepath.Base(filepath.Dir(path))] = state
		if state != "not attached" && state != "powered" {
			o.Safe = false
		}
	}
}

var stockClient = &http.Client{Timeout: 60 * time.Second, Transport: &http.Transport{Proxy: nil}, CheckRedirect: func(*http.Request, []*http.Request) error { return errors.New("stock redirect refused") }}

func stockRequest(ctx context.Context, method, path, contentType string, data []byte) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, method, "http://127.0.0.1:81"+path, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	res, err := stockClient.Do(req)
	if err != nil {
		return nil, errors.New("stock loopback service unavailable")
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, errors.New("stock loopback service rejected request")
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, maxPDF+1))
	if err != nil || len(body) > maxPDF {
		return nil, errors.New("stock response exceeded limit or was interrupted")
	}
	return body, nil
}
func exportStock(ctx context.Context, document string) ([]byte, error) {
	if !uuidPattern.MatchString(document) {
		return nil, errors.New("invalid stock document UUID")
	}
	if o := observeHardware(); !o.Safe {
		return nil, errors.New(o.Error)
	}
	data, err := stockRequest(ctx, "GET", "/download/"+document+"/pdf", "", nil)
	if err == nil && !bytes.HasPrefix(data, []byte("%PDF-")) {
		return nil, errors.New("stock export is not a PDF")
	}
	return data, err
}
func importStock(ctx context.Context, name string, pdf []byte) ([]byte, error) {
	if o := observeHardware(); !o.Safe {
		return nil, errors.New(o.Error)
	}
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", name+".pdf")
	if err != nil {
		return nil, err
	}
	if _, err = part.Write(pdf); err != nil {
		return nil, err
	}
	if err = writer.Close(); err != nil {
		return nil, err
	}
	return stockRequest(ctx, "POST", "/upload", writer.FormDataContentType(), body.Bytes())
}

func resolveImportIdentity(ctx context.Context, response []byte, receipts <-chan importReceipt) (importReceipt, error) {
	returnedDocument, err := returnedUUID(response)
	if err != nil {
		return importReceipt{}, err
	}
	select {
	case receipt := <-receipts:
		if returnedDocument != "" && returnedDocument != receipt.Document {
			return importReceipt{}, errors.New("stock response and Library receipt UUIDs disagree")
		}
		return receipt, nil
	case <-ctx.Done():
		return importReceipt{}, errors.New("stock import has no matching native document and parent receipt")
	}
}

// Only explicit, agreeing UUID fields count. Arbitrary strings and nested guesses do not.
func returnedUUID(data []byte) (string, error) {
	var value map[string]json.RawMessage
	if json.Unmarshal(data, &value) != nil {
		return "", nil
	}
	result := ""
	for _, key := range []string{"id", "uuid", "documentUUID"} {
		raw, ok := value[key]
		if !ok {
			continue
		}
		var id string
		if json.Unmarshal(raw, &id) != nil {
			return "", errors.New("stock import returned an invalid explicit document UUID")
		}
		if len(id) == 38 && id[0] == '{' && id[37] == '}' {
			id = id[1:37]
		}
		if !uuidPattern.MatchString(id) {
			return "", errors.New("stock import returned an invalid explicit document UUID")
		}
		id = strings.ToLower(id)
		if result != "" && result != id {
			return "", errors.New("stock import returned conflicting explicit document UUIDs")
		}
		result = id
	}
	return result, nil
}
