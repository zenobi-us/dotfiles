//go:build !windows

package main

import (
	"context"
	"errors"
	"io"
	"time"
)

var errUnsupported = errors.New("this build only supports Windows")

func systemIdleDuration() (time.Duration, error) {
	return 0, errUnsupported
}

func jigglePointer(int) error {
	return errUnsupported
}

func runApplication(ctx context.Context, cfg config, stderr io.Writer) error {
	return runWithState(ctx, cfg, newRuntimeState(cfg.idle), stderr)
}
