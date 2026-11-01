// Throwaway AppLoad backend. Read the Paper Pro pen without grabbing the device
// or changing Xochitl input. Touch input never enters this stroke stream.
package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"unsafe"
)

func main() {
	name, err := os.ReadFile("/sys/class/input/event2/device/name")
	must(err)
	if strings.TrimSpace(string(name)) != "Elan marker input" {
		log.Fatal("The input device is not the expected Paper Pro pen.")
	}
	input, err := os.Open("/dev/input/event2")
	must(err)
	xRange := readAxis(input, 0)
	yRange := readAxis(input, 1)
	pressureRange := readAxis(input, 24)
	info := penDevice{Device: strings.TrimSpace(string(name)), X: xRange, Y: yRange, Pressure: pressureRange}
	if len(os.Args) == 2 && os.Args[1] == "--inspect" {
		must(json.NewEncoder(os.Stdout).Encode(info))
		return
	}
	if len(os.Args) != 2 { log.Fatal("AppLoad must supply its Unix socket path.") }
	connection, err := net.DialUnix("unixpacket", nil, &net.UnixAddr{Name: os.Args[1], Net: "unixpacket"})
	must(err)
	var ready atomic.Bool
	var sendLock sync.Mutex
	send := func(kind uint32, value any) {
		payload, err := json.Marshal(value)
		must(err)
		var header [8]byte
		binary.LittleEndian.PutUint32(header[:4], kind)
		binary.LittleEndian.PutUint32(header[4:], uint32(len(payload)))
		sendLock.Lock()
		defer sendLock.Unlock()
		_, err = connection.Write(header[:])
		must(err)
		_, err = connection.Write(payload)
		must(err)
	}
	go func() {
		var header [8]byte
		payload := make([]byte, 1024)
		for {
			n, err := connection.Read(header[:])
			if err != nil || n != 8 { os.Exit(0) }
			kind := binary.LittleEndian.Uint32(header[:4])
			length := binary.LittleEndian.Uint32(header[4:])
			if length > uint32(len(payload)) { log.Fatal("The AppLoad control message is too large.") }
			if length > 0 {
				n, err = connection.Read(payload[:length])
				if err != nil || n != int(length) { os.Exit(0) }
			}
			if kind == 0xffffffff { os.Exit(0) }
			if kind == 1 || kind == 0xfffffffe {
				send(2, &info)
				ready.Store(true)
			}
		}
	}()
	var event [24]byte
	var x, y, pressure int32
	var down, wasDown bool
	var sample penSample
	for {
		_, err := io.ReadFull(input, event[:])
		must(err)
		kind := binary.LittleEndian.Uint16(event[16:18])
		code := binary.LittleEndian.Uint16(event[18:20])
		value := int32(binary.LittleEndian.Uint32(event[20:24]))
		if kind == 3 {
			switch code {
			case 0: x = value
			case 1: y = value
			case 24: pressure = value
			}
		}
		if kind == 1 && code == 330 { down = value != 0 }
		if kind == 0 && code == 0 && ready.Load() {
			if down || wasDown {
				sample.Down = down
				sample.X = normalize(x, xRange)
				sample.Y = normalize(y, yRange)
				sample.Pressure = normalize(pressure, pressureRange)
				send(1, &sample)
			}
			wasDown = down
		}
	}
}

type penSample struct {
	Down bool `json:"down"`
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Pressure float64 `json:"pressure"`
}

type penDevice struct {
	Device string `json:"device"`
	X axisInfo `json:"x"`
	Y axisInfo `json:"y"`
	Pressure axisInfo `json:"pressure"`
}

type axisInfo struct {
	Value int32 `json:"value"`
	Minimum int32 `json:"minimum"`
	Maximum int32 `json:"maximum"`
	Fuzz int32 `json:"fuzz"`
	Flat int32 `json:"flat"`
	Resolution int32 `json:"resolution"`
}

func readAxis(file *os.File, code uintptr) axisInfo {
	var axis axisInfo
	_, _, errno := syscall.Syscall(syscall.SYS_IOCTL, file.Fd(), 0x80184540+code, uintptr(unsafe.Pointer(&axis)))
	if errno != 0 { log.Fatal(fmt.Errorf("Read pen axis %d: %w", code, errno)) }
	if axis.Maximum <= axis.Minimum { log.Fatal("The pen axis has no usable range.") }
	return axis
}

func normalize(value int32, axis axisInfo) float64 {
	return float64(value-axis.Minimum) / float64(axis.Maximum-axis.Minimum)
}

func must(err error) {
	if err != nil { log.Fatal(err) }
}
