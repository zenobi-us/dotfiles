// The temporary AppLoad client uses this writer because the tablet has no base64 utility.
package main

import (
	"encoding/base64"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		log.Fatal("Pass one base64-encoded PNG.")
	}
	executable, err := os.Executable()
	if err != nil { log.Fatal(err) }
	output, err := os.OpenFile(filepath.Join(filepath.Dir(executable), "result.png"), os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil { log.Fatal(err) }
	_, err = io.Copy(output, base64.NewDecoder(base64.StdEncoding, strings.NewReader(os.Args[1])))
	if err != nil { log.Fatal(err) }
	if err := output.Close(); err != nil { log.Fatal(err) }
}
