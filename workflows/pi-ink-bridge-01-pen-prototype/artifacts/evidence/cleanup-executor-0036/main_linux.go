//go:build !hostfixture

// The same fixed target data builds a host executor and an ARM64 tablet executor.
// Production has no alternate manifest, root, path or fixture argument.
package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"syscall"
)

//go:embed targets.json
var targetBytes []byte

const fixedManifestSHA = "58e922578c95faf911f6e8740d85e31748011be44566304e9166c00dc447ebfc"

type frozenTargets struct {
	ManifestSHA string   `json:"manifest_sha256"`
	Host        []target `json:"host"`
	Device      []target `json:"device"`
}

func main() { os.Exit(entry()) }
func entry() int {
	if len(os.Args) != 2 || (os.Args[1] != "check" && os.Args[1] != "apply") {
		fmt.Println("CLEANUP_REFUSAL EXACT_CHECK_OR_APPLY_REQUIRED")
		return 2
	}
	if os.Getenv("PI_INK_CLEANUP_EXECUTOR_APPROVED") != fixedManifestSHA || os.Getenv("PI_INK_OPERATOR_HANDOFF") != "confirmed-to-parent" {
		fmt.Println("CLEANUP_REFUSAL NEW_EXACT_EXECUTION_APPROVAL_REQUIRED")
		return 2
	}
	var frozen frozenTargets
	if json.Unmarshal(targetBytes, &frozen) != nil || frozen.ManifestSHA != fixedManifestSHA {
		fmt.Println("CLEANUP_REFUSAL EMBEDDED_MANIFEST")
		return 1
	}
	var targets []target
	var guard func() error
	switch runtime.GOARCH {
	case "amd64":
		targets = frozen.Host
		if len(targets) == 0 || uint32(os.Geteuid()) != targets[0].UID || uint32(os.Getegid()) != targets[0].GID {
			fmt.Println("CLEANUP_REFUSAL HOST_EXECUTION_OWNER")
			return 1
		}
		guard = func() error { return hostRuntimeGuard(targets) }
	case "arm64":
		targets = frozen.Device
		guard = deviceRuntimeGuard
	default:
		fmt.Println("CLEANUP_REFUSAL UNSUPPORTED_TARGET")
		return 1
	}
	if len(targets) != 48 {
		fmt.Println("CLEANUP_REFUSAL TARGET_COUNT")
		return 1
	}
	root, err := syscall.Open("/", nofollowFlags|syscall.O_DIRECTORY, 0)
	if err != nil {
		fmt.Println("CLEANUP_REFUSAL ROOT_OPEN")
		return 1
	}
	c, err := newCleanup(root, targets, os.Stdout, guard, 0)
	if err != nil {
		syscall.Close(root)
		fmt.Println("CLEANUP_REFUSAL ROOT_IDENTITY")
		return 1
	}
	if err = c.run(os.Args[1] == "apply"); err != nil {
		fmt.Println("CLEANUP_REFUSAL", err.Error())
		return 1
	}
	return 0
}
