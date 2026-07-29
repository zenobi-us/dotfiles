//go:build windows

package main

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"time"

	"fyne.io/systray"
)

var idlePresets = []time.Duration{
	1 * time.Minute,
	3 * time.Minute,
	10 * time.Minute,
	30 * time.Minute,
}

func runApplication(parent context.Context, cfg config, stderr io.Writer) error {
	ctx, cancel := context.WithCancel(parent)
	defer cancel()

	state := newRuntimeState(cfg.idle)
	errCh := make(chan error, 1)

	onReady := func() {
		systray.SetIcon(trayIcon())
		systray.SetTitle("Servitor")

		statusItem := systray.AddMenuItem("", "Current Servitor status")
		statusItem.Disable()
		pauseItem := systray.AddMenuItemCheckbox("Pause", "Temporarily stop pointer movement", false)
		thresholdItem := systray.AddMenuItem("Idle threshold", "Select inactivity duration")
		presetItems := make(map[time.Duration]*systray.MenuItem, len(idlePresets))
		for _, preset := range idlePresets {
			presetItems[preset] = thresholdItem.AddSubMenuItemCheckbox(durationLabel(preset), "", false)
		}
		systray.AddSeparator()
		quitItem := systray.AddMenuItem("Quit", "Stop Servitor")

		updateMenu := func() {
			idle, paused := state.snapshot()
			if paused {
				statusItem.SetTitle("Paused")
				pauseItem.Check()
				systray.SetTooltip("Servitor paused")
			} else {
				statusItem.SetTitle("Active · " + durationLabel(idle))
				pauseItem.Uncheck()
				systray.SetTooltip("Servitor active · moves after " + durationLabel(idle) + " idle")
			}
			for preset, item := range presetItems {
				if preset == idle {
					item.Check()
				} else {
					item.Uncheck()
				}
			}
		}
		updateMenu()

		go func() {
			for {
				select {
				case <-ctx.Done():
					return
				case <-pauseItem.ClickedCh:
					state.togglePaused()
					updateMenu()
				case <-presetItems[1*time.Minute].ClickedCh:
					state.setIdle(1 * time.Minute)
					updateMenu()
				case <-presetItems[3*time.Minute].ClickedCh:
					state.setIdle(3 * time.Minute)
					updateMenu()
				case <-presetItems[10*time.Minute].ClickedCh:
					state.setIdle(10 * time.Minute)
					updateMenu()
				case <-presetItems[30*time.Minute].ClickedCh:
					state.setIdle(30 * time.Minute)
					updateMenu()
				case <-quitItem.ClickedCh:
					cancel()
					systray.Quit()
					return
				}
			}
		}()

		go func() {
			if err := runWithState(ctx, cfg, state, stderr); err != nil {
				select {
				case errCh <- err:
				default:
				}
				systray.SetTooltip("Servitor error: " + err.Error())
				systray.Quit()
			}
		}()
	}

	go func() {
		<-parent.Done()
		systray.Quit()
	}()

	systray.Run(onReady, cancel)
	select {
	case err := <-errCh:
		return err
	default:
		return nil
	}
}

func durationLabel(duration time.Duration) string {
	if duration%time.Minute == 0 {
		minutes := int(duration / time.Minute)
		if minutes == 1 {
			return "1 minute"
		}
		return fmt.Sprintf("%d minutes", minutes)
	}
	return duration.String()
}

func trayIcon() []byte {
	const size = 32
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	amber := color.RGBA{R: 0xf5, G: 0xa6, B: 0x23, A: 0xff}
	dark := color.RGBA{R: 0x24, G: 0x20, B: 0x18, A: 0xff}
	for y := 2; y < size-2; y++ {
		for x := 2; x < size-2; x++ {
			dx, dy := x-size/2, y-size/2
			if dx*dx+dy*dy <= 13*13 {
				img.SetRGBA(x, y, amber)
			}
			if abs(dx)+abs(dy) <= 7 {
				img.SetRGBA(x, y, dark)
			}
		}
	}

	var pngData bytes.Buffer
	_ = png.Encode(&pngData, img)
	var ico bytes.Buffer
	_ = binary.Write(&ico, binary.LittleEndian, uint16(0))
	_ = binary.Write(&ico, binary.LittleEndian, uint16(1))
	_ = binary.Write(&ico, binary.LittleEndian, uint16(1))
	ico.Write([]byte{size, size, 0, 0})
	_ = binary.Write(&ico, binary.LittleEndian, uint16(1))
	_ = binary.Write(&ico, binary.LittleEndian, uint16(32))
	_ = binary.Write(&ico, binary.LittleEndian, uint32(pngData.Len()))
	_ = binary.Write(&ico, binary.LittleEndian, uint32(22))
	ico.Write(pngData.Bytes())
	return ico.Bytes()
}

func abs(value int) int {
	if value < 0 {
		return -value
	}
	return value
}
