package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"sync"
	"time"
)

var version = "dev"

type config struct {
	idle     time.Duration
	poll     time.Duration
	distance int
	verbose  bool
}

type runtimeState struct {
	mu     sync.RWMutex
	idle   time.Duration
	paused bool
}

func newRuntimeState(idle time.Duration) *runtimeState {
	return &runtimeState{idle: idle}
}

func (state *runtimeState) snapshot() (time.Duration, bool) {
	state.mu.RLock()
	defer state.mu.RUnlock()
	return state.idle, state.paused
}

func (state *runtimeState) setIdle(idle time.Duration) {
	state.mu.Lock()
	state.idle = idle
	state.mu.Unlock()
}

func (state *runtimeState) togglePaused() bool {
	state.mu.Lock()
	defer state.mu.Unlock()
	state.paused = !state.paused
	return state.paused
}

func parseConfig(args []string, output io.Writer) (config, error) {
	cfg := config{}
	flags := flag.NewFlagSet("servitor", flag.ContinueOnError)
	flags.SetOutput(output)
	flags.DurationVar(&cfg.idle, "idle", 4*time.Minute+30*time.Second, "input inactivity before moving the pointer")
	flags.DurationVar(&cfg.poll, "poll", 5*time.Second, "idle-state polling interval")
	flags.IntVar(&cfg.distance, "distance", 1, "relative pointer movement in pixels")
	flags.BoolVar(&cfg.verbose, "verbose", false, "print each pointer movement")
	showVersion := flags.Bool("version", false, "print version")
	flags.Usage = func() {
		fmt.Fprintln(output, "Keep a Windows display awake by moving the pointer after input inactivity.")
		fmt.Fprintln(output, "\nUsage: servitor [flags]")
		fmt.Fprintln(output, "\nExample: servitor -idle 5m -poll 5s")
		fmt.Fprintln(output, "\nFlags:")
		flags.PrintDefaults()
	}

	if err := flags.Parse(args); err != nil {
		return cfg, err
	}
	if *showVersion {
		fmt.Fprintln(output, version)
		return cfg, errVersionPrinted
	}
	if flags.NArg() != 0 {
		return cfg, fmt.Errorf("unexpected arguments: %v", flags.Args())
	}
	if cfg.idle <= 0 {
		return cfg, errors.New("-idle must be greater than zero")
	}
	if cfg.poll <= 0 {
		return cfg, errors.New("-poll must be greater than zero")
	}
	if cfg.distance < 1 || cfg.distance > 100 {
		return cfg, errors.New("-distance must be between 1 and 100")
	}
	return cfg, nil
}

var errVersionPrinted = errors.New("version printed")

func runWithState(ctx context.Context, cfg config, state *runtimeState, stderr io.Writer) error {
	ticker := time.NewTicker(cfg.poll)
	defer ticker.Stop()

	check := func() error {
		idleThreshold, paused := state.snapshot()
		if paused {
			return nil
		}
		idle, err := systemIdleDuration()
		if err != nil {
			return err
		}
		if idle < idleThreshold {
			return nil
		}
		if err := jigglePointer(cfg.distance); err != nil {
			return err
		}
		if cfg.verbose {
			fmt.Fprintf(stderr, "pointer moved after %s idle\n", idle.Round(time.Second))
		}
		return nil
	}

	if err := check(); err != nil {
		return err
	}
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if err := check(); err != nil {
				return err
			}
		}
	}
}

func main() {
	cfg, err := parseConfig(os.Args[1:], os.Stdout)
	if errors.Is(err, flag.ErrHelp) || errors.Is(err, errVersionPrinted) {
		return
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "servitor:", err)
		os.Exit(2)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	if err := runApplication(ctx, cfg, os.Stderr); err != nil {
		fmt.Fprintln(os.Stderr, "servitor:", err)
		os.Exit(1)
	}
}
