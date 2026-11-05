//go:build hostsmoke

// Simulated host stock/network observations only; never included in candidate builds.
package main
import ("context"; "net"; "net/http"; "os"; "bufio")
func init() {
 observeHardware = func() hardwareObservation { return hardwareObservation{Safe:true, UDC:map[string]string{"simulated":"not attached"}, USBIPv4:[]string{}, Listeners:[]string{"SIMULATED loopback peer"}} }
 stockClient.Transport = &http.Transport{Proxy:nil, DialContext:func(ctx context.Context, network, address string)(net.Conn,error){return (&net.Dialer{}).DialContext(ctx, "tcp4", os.Getenv("INK_SIMULATED_STOCK"))}}
 go func(){ scanner:=bufio.NewScanner(os.Stdin); if scanner.Scan() && scanner.Text()=="host-smoke-complete" { os.Exit(0) } }()
}
