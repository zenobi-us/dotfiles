// Exercises kernel controller observations used by the stock import/export guard.
package main

import (
	"os"
	"path/filepath"
	"strconv"
	"testing"
)

func TestUDCChargingOnlySafety(t *testing.T) {
	cases := []struct {
		name           string
		states         []string
		stateDirectory bool
		wantSafe       bool
	}{
		{name: "detached", states: []string{"not attached", "not attached"}, wantSafe: true},
		{name: "charging", states: []string{"powered", "not attached"}, wantSafe: true},
		{name: "both powered", states: []string{"powered", "powered"}, wantSafe: true},
		{name: "configured", states: []string{"configured", "powered"}},
		{name: "addressed", states: []string{"addressed", "not attached"}},
		{name: "default", states: []string{"default", "not attached"}},
		{name: "suspended", states: []string{"suspended", "not attached"}},
		{name: "attached", states: []string{"attached", "not attached"}},
		{name: "unknown", states: []string{"unexpected", "not attached"}},
		{name: "empty state", states: []string{"", "not attached"}},
		{name: "missing controller", states: []string{"powered"}},
		{name: "unexpected controller", states: []string{"powered", "not attached", "not attached"}},
		{name: "unreadable state", states: []string{"powered", "not attached"}, stateDirectory: true},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			directory := t.TempDir()
			for index, state := range test.states {
				controller := filepath.Join(directory, "ci_hdrc."+strconv.Itoa(index))
				if err := os.Mkdir(controller, 0700); err != nil {
					t.Fatal(err)
				}
				path := filepath.Join(controller, "state")
				if test.stateDirectory && index == 0 {
					if err := os.Mkdir(path, 0700); err != nil {
						t.Fatal(err)
					}
				} else if err := os.WriteFile(path, []byte(state+"\n"), 0600); err != nil {
					t.Fatal(err)
				}
			}
			observation := hardwareObservation{UDC: map[string]string{}, Safe: true}
			observation.readUDCStates(filepath.Join(directory, "*", "state"))
			if observation.Safe != test.wantSafe {
				t.Fatalf("controller observations %v: safe=%v, want %v", test.states, observation.Safe, test.wantSafe)
			}
		})
	}
}
