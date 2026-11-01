// Throwaway Paper Pro pen-quality probe. It transfers one synthetic image over
// authenticated TLS and records the tablet PNG separately from editable strokes.
package main

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/subtle"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

func main() {
	host := flag.String("host", "", "Desktop LAN IPv4 address")
	dir := flag.String("dir", "", "Private temporary output directory")
	port := flag.Int("port", 47831, "Temporary HTTPS port")
	flag.Parse()
	if net.ParseIP(*host) == nil || *dir == "" {
		log.Fatal("Set --host to the desktop LAN address and --dir to a private temporary directory.")
	}
	must(os.MkdirAll(*dir, 0700))
	certPath, keyPath := createCertificate(*host, *dir)
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	must(err)
	token := hex.EncodeToString(tokenBytes)
	listenAddress := net.JoinHostPort(*host, strconv.Itoa(*port))
	address := "https://" + listenAddress
	deviceRoot := "/home/root/xovi/exthome/appload/pi-ink-bridge-pen-prototype"
	config := fmt.Sprintf("cacert = \"%s/server.crt\"\nheader = \"Authorization: Bearer %s\"\n", deviceRoot, token)
	must(os.WriteFile(filepath.Join(*dir, "transfer.conf"), []byte(config), 0600))
	must(os.WriteFile(filepath.Join(*dir, "server-url"), []byte(address), 0600))
	must(os.WriteFile(filepath.Join(*dir, "local-token"), []byte(token), 0600))

	source := makeSource()
	var sourcePNG bytes.Buffer
	must(png.Encode(&sourcePNG, source))
	must(os.WriteFile(filepath.Join(*dir, "source.png"), sourcePNG.Bytes(), 0600))
	var mu sync.Mutex
	state := map[string]any{"sourceWidth": 800, "sourceHeight": 1000, "resultAccepted": false}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /source", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write(sourcePNG.Bytes())
		log.Print("SOURCE_DOWNLOADED")
	})
	mux.HandleFunc("POST /strokes", func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 128*1024))
		if err != nil || !json.Valid(body) {
			http.Error(w, "Send valid stroke JSON below 128 KiB.", 400)
			return
		}
		must(os.WriteFile(filepath.Join(*dir, "strokes.json"), body, 0600))
		w.WriteHeader(204)
	})
	mux.HandleFunc("POST /result", func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 8*1024*1024))
		if err != nil {
			http.Error(w, "Send a PNG below 8 MiB.", 413)
			return
		}
		config, err := png.DecodeConfig(bytes.NewReader(body))
		if err != nil || config.Width != 800 || config.Height != 1000 {
			http.Error(w, "The PNG must keep the 800 by 1000 source dimensions.", 400)
			return
		}
		result, err := png.Decode(bytes.NewReader(body))
		if err != nil {
			http.Error(w, "Send a valid PNG.", 400)
			return
		}
		changed := 0
		for y := range 1000 {
			for x := range 800 {
				if color.NRGBAModel.Convert(source.At(x, y)) != color.NRGBAModel.Convert(result.At(x, y)) {
					changed++
				}
			}
		}
		must(os.WriteFile(filepath.Join(*dir, "result.png"), body, 0600))
		mu.Lock()
		state["resultAccepted"] = true
		state["changedPixels"] = changed
		state["acceptedAt"] = time.Now().UTC().Format(time.RFC3339)
		encoded, err := json.MarshalIndent(state, "", "  ")
		must(err)
		must(os.WriteFile(filepath.Join(*dir, "result-summary.json"), encoded, 0600))
		mu.Unlock()
		log.Printf("RESULT_ACCEPTED dimensions=800x1000 changedPixels=%d", changed)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"accepted":true}`))
	})
	mux.HandleFunc("GET /status", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(state)
	})
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host != listenAddress || r.Header.Get("Origin") != "" {
			http.Error(w, "Unexpected host or browser origin.", 403)
			return
		}
		if subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+token)) != 1 {
			http.Error(w, "Device authentication is required.", 401)
			return
		}
		mux.ServeHTTP(w, r)
	})
	server := &http.Server{Addr: listenAddress, Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 20 * time.Second, WriteTimeout: 20 * time.Second, TLSConfig: &tls.Config{MinVersion: tls.VersionTLS12}}
	log.Printf("PROTOTYPE_READY %s", address)
	log.Fatal(server.ListenAndServeTLS(certPath, keyPath))
}

func makeSource() *image.NRGBA {
	img := image.NewNRGBA(image.Rect(0, 0, 800, 1000))
	for y := range 1000 {
		for x := range 800 {
			shade := uint8(255)
			if x%100 == 0 || y%100 == 0 { shade = 210 }
			if x < 5 || x >= 795 || y < 5 || y >= 995 { shade = 0 }
			if (x >= 40 && x < 80 || x >= 720 && x < 760) && (y >= 40 && y < 80 || y >= 920 && y < 960) { shade = 0 }
			img.SetNRGBA(x, y, color.NRGBA{R: shade, G: shade, B: shade, A: 255})
		}
	}
	return img
}

func createCertificate(host, dir string) (string, string) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	must(err)
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	must(err)
	cert := &x509.Certificate{SerialNumber: serial, Subject: pkix.Name{CommonName: "Pi Ink pen prototype"}, NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(24 * time.Hour), IPAddresses: []net.IP{net.ParseIP(host)}, KeyUsage: x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment | x509.KeyUsageCertSign, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}, IsCA: true, BasicConstraintsValid: true}
	der, err := x509.CreateCertificate(rand.Reader, cert, cert, &key.PublicKey, key)
	must(err)
	certPath, keyPath := filepath.Join(dir, "server.crt"), filepath.Join(dir, "server.key")
	must(os.WriteFile(certPath, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0600))
	must(os.WriteFile(keyPath, pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)}), 0600))
	return certPath, keyPath
}

func must(err error) {
	if err != nil { log.Fatal(err) }
}
