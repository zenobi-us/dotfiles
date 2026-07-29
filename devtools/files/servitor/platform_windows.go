//go:build windows

package main

import (
	"fmt"
	"syscall"
	"time"
	"unsafe"
)

const (
	inputMouse     = 0
	mouseEventMove = 0x0001
)

var (
	user32               = syscall.NewLazyDLL("user32.dll")
	kernel32             = syscall.NewLazyDLL("kernel32.dll")
	procGetLastInputInfo = user32.NewProc("GetLastInputInfo")
	procSendInput        = user32.NewProc("SendInput")
	procGetTickCount64   = kernel32.NewProc("GetTickCount64")
)

type lastInputInfo struct {
	size uint32
	tick uint32
}

type mouseInput struct {
	dx        int32
	dy        int32
	mouseData uint32
	flags     uint32
	time      uint32
	extraInfo uintptr
}

type input struct {
	typeID uint32
	mouse  mouseInput
}

func systemIdleDuration() (time.Duration, error) {
	info := lastInputInfo{size: uint32(unsafe.Sizeof(lastInputInfo{}))}
	result, _, callErr := procGetLastInputInfo.Call(uintptr(unsafe.Pointer(&info)))
	if result == 0 {
		return 0, win32Error("GetLastInputInfo", callErr)
	}

	now, _, _ := procGetTickCount64.Call()
	elapsedMilliseconds := uint32(now) - info.tick
	return time.Duration(elapsedMilliseconds) * time.Millisecond, nil
}

func jigglePointer(distance int) error {
	inputs := [2]input{
		{typeID: inputMouse, mouse: mouseInput{dx: int32(distance), flags: mouseEventMove}},
		{typeID: inputMouse, mouse: mouseInput{dx: int32(-distance), flags: mouseEventMove}},
	}

	inserted, _, callErr := procSendInput.Call(
		uintptr(len(inputs)),
		uintptr(unsafe.Pointer(&inputs[0])),
		unsafe.Sizeof(inputs[0]),
	)
	if inserted != uintptr(len(inputs)) {
		return win32Error("SendInput", callErr)
	}
	return nil
}

func win32Error(operation string, err error) error {
	if errno, ok := err.(syscall.Errno); ok && errno == 0 {
		return fmt.Errorf("%s failed", operation)
	}
	return fmt.Errorf("%s: %w", operation, err)
}
