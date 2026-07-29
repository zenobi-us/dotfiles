package main

import (
	"io"
	"testing"
	"time"
)

func TestParseConfig(t *testing.T) {
	cfg, err := parseConfig([]string{"-idle", "2m", "-poll", "3s", "-distance", "2", "-verbose"}, io.Discard)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.idle != 2*time.Minute || cfg.poll != 3*time.Second || cfg.distance != 2 || !cfg.verbose {
		t.Fatalf("unexpected config: %+v", cfg)
	}
}

func TestParseConfigRejectsInvalidDistance(t *testing.T) {
	if _, err := parseConfig([]string{"-distance", "0"}, io.Discard); err == nil {
		t.Fatal("expected invalid distance error")
	}
}

func TestRuntimeState(t *testing.T) {
	state := newRuntimeState(time.Minute)
	state.setIdle(3 * time.Minute)
	if paused := state.togglePaused(); !paused {
		t.Fatal("expected paused state")
	}
	idle, paused := state.snapshot()
	if idle != 3*time.Minute || !paused {
		t.Fatalf("unexpected runtime state: idle=%s paused=%v", idle, paused)
	}
}
