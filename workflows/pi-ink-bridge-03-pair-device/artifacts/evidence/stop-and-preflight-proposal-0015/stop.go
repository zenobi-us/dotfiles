// Uses Linux pidfds to signal only the frozen production process; raw-PID fallback is forbidden.
package main

import (
 "crypto/sha256"
 "encoding/hex"
 "encoding/json"
 "errors"
 "fmt"
 "io"
 "os"
 "strconv"
 "strings"
 "syscall"
)

// Linux asm-generic ABI; both the host smoke and the ARM64 target use these numbers.
const pidfdSendSignal = 424
const pidfdOpen = 434

type processIdentity struct {
 PID int
 Start string
 Parent string
 Boot string
 Exe string
 Hash string
 Proc string
 File string
 UIDs string
 GIDs string
}

type stopResult struct {
 Schema string `json:"schema"`
 PID int `json:"pid"`
 TermSent bool `json:"sigterm_sent"`
 ExitObserved bool `json:"exit_observed"`
}

func main() {
 if len(os.Args)!=1 || os.Geteuid()!=0 { fmt.Fprintln(os.Stderr,"STOP=invocation"); os.Exit(41) }
 want:=processIdentity{PID:41472,Start:"3578271",Parent:"7146",Boot:"8e816d98-6bf4-4f9e-9abe-891fbf83d06f",Exe:"/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/pi-ink-client",Hash:"433d53403a9d3568a00458fe9a02af33813cbdce0489b0b8602693f0ff135051",Proc:"21:205121:0:0",File:"65026:1446:0:0:700:7405752",UIDs:"0,0,0,0",GIDs:"0,0,0,0"}
 result,err:=stopPinned(want)
 if json.NewEncoder(os.Stdout).Encode(result)!=nil { os.Exit(42) }
 if err!=nil { fmt.Fprintln(os.Stderr,"STOP="+err.Error()); os.Exit(41) }
}

func stopPinned(want processIdentity) (stopResult,error) {
 result:=stopResult{Schema:"pi-ink-pidfd-stop/v1",PID:want.PID}
 fd,_,errno:=syscall.Syscall(pidfdOpen,uintptr(want.PID),0,0)
 if errno!=0 { return result,errors.New("pidfd_open_unavailable") }
 defer syscall.Close(int(fd))
 got,err:=observeProcess(want.PID)
 if err!=nil { return result,err }
 if got!=want { return result,errors.New("target_identity_mismatch") }
 exited,err:=awaitExit(int(fd),0)
 if err!=nil { return result,err }
 if exited { result.ExitObserved=true; return result,nil }
 // The descriptor remains bound to this process even if its numeric PID is reused.
 _,_,errno=syscall.Syscall6(pidfdSendSignal,fd,uintptr(syscall.SIGTERM),0,0,0,0)
 if errno!=0 { return result,errors.New("pidfd_sigterm_failed") }
 result.TermSent=true
 result.ExitObserved,err=awaitExit(int(fd),10)
 if err!=nil { return result,err }
 if !result.ExitObserved { return result,errors.New("exit_not_observed_no_escalation") }
 return result,nil
}

func awaitExit(fd int, seconds int64) (bool,error) {
 var set syscall.FdSet
 if fd<0 || fd>=len(set.Bits)*64 { return false,errors.New("pidfd_descriptor_bounds") }
 set.Bits[fd/64] |= int64(1)<<uint(fd%64)
 timeout:=syscall.Timeval{Sec:seconds}
 n,err:=syscall.Select(fd+1,&set,nil,nil,&timeout)
 if err!=nil { return false,errors.New("pidfd_wait_failed") }
 return n==1,nil
}

func processTimes(pid int) (string,string,error) {
 data,err:=os.ReadFile("/proc/"+strconv.Itoa(pid)+"/stat")
 if err!=nil { return "","",errors.New("process_stat") }
 closing:=strings.LastIndex(string(data),") ")
 if closing<0 { return "","",errors.New("process_stat_shape") }
 fields:=strings.Fields(string(data[closing+2:]))
 if len(fields)<20 { return "","",errors.New("process_stat_shape") }
 return fields[19],fields[1],nil
}

func identity(info os.FileInfo, process bool) (string,error) {
 st,ok:=info.Sys().(*syscall.Stat_t)
 if !ok { return "",errors.New("stat_shape") }
 if process { return fmt.Sprintf("%d:%d:%d:%d",st.Dev,st.Ino,st.Uid,st.Gid),nil }
 return fmt.Sprintf("%d:%d:%d:%d:%o:%d",st.Dev,st.Ino,st.Uid,st.Gid,info.Mode().Perm(),st.Size),nil
}

func observeProcess(pid int) (processIdentity,error) {
 out:=processIdentity{PID:pid}
 base:="/proc/"+strconv.Itoa(pid)
 boot,err:=os.ReadFile("/proc/sys/kernel/random/boot_id")
 if err!=nil { return out,errors.New("boot_read") }
 out.Boot=strings.TrimSpace(string(boot))
 out.Start,out.Parent,err=processTimes(pid)
 if err!=nil { return out,err }
 proc,err:=os.Stat(base)
 if err!=nil { return out,errors.New("process_metadata") }
 out.Proc,err=identity(proc,true)
 if err!=nil { return out,err }
 out.Exe,err=os.Readlink(base+"/exe")
 if err!=nil { return out,errors.New("executable_path") }
 file,err:=os.Open(base+"/exe")
 if err!=nil { return out,errors.New("executable_open") }
 defer file.Close()
 before,err:=file.Stat()
 if err!=nil || !before.Mode().IsRegular() || before.Size()>32*1024*1024 { return out,errors.New("executable_type_size") }
 out.File,err=identity(before,false)
 if err!=nil { return out,err }
 digest:=sha256.New()
 n,err:=io.Copy(digest,io.LimitReader(file,32*1024*1024+1))
 if err!=nil || n!=before.Size() { return out,errors.New("executable_read_changed") }
 out.Hash=hex.EncodeToString(digest.Sum(nil))
 after,err:=file.Stat()
 if err!=nil { return out,errors.New("executable_stat") }
 beforeStat,ok1:=before.Sys().(*syscall.Stat_t)
 afterStat,ok2:=after.Sys().(*syscall.Stat_t)
 if !ok1 || !ok2 || beforeStat.Dev!=afterStat.Dev || beforeStat.Ino!=afterStat.Ino || beforeStat.Mode!=afterStat.Mode || beforeStat.Uid!=afterStat.Uid || beforeStat.Gid!=afterStat.Gid || beforeStat.Size!=afterStat.Size || beforeStat.Mtim!=afterStat.Mtim || beforeStat.Ctim!=afterStat.Ctim { return out,errors.New("executable_changed") }
 status,err:=os.ReadFile(base+"/status")
 if err!=nil { return out,errors.New("status_read") }
 for _,line:=range strings.Split(string(status),"\n") {
  fields:=strings.Fields(line)
  if len(fields)==5 && fields[0]=="Uid:" { out.UIDs=strings.Join(fields[1:],",") }
  if len(fields)==5 && fields[0]=="Gid:" { out.GIDs=strings.Join(fields[1:],",") }
 }
 start,parent,err:=processTimes(pid)
 if err!=nil || start!=out.Start || parent!=out.Parent { return out,errors.New("process_reused_or_changed") }
 path,err:=os.Readlink(base+"/exe")
 if err!=nil || path!=out.Exe { return out,errors.New("executable_path_changed") }
 proc,err=os.Stat(base)
 if err!=nil { return out,errors.New("process_metadata_changed") }
 end,err:=identity(proc,true)
 if err!=nil || end!=out.Proc { return out,errors.New("process_identity_changed") }
 return out,nil
}
