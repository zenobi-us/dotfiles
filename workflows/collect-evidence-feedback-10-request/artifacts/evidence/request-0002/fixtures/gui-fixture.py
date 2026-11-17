import ctypes as c
import os, signal
x = c.CDLL('libX11.so.6')
x.XOpenDisplay.restype = c.c_void_p
x.XOpenDisplay.argtypes = [c.c_char_p]
d = x.XOpenDisplay(os.environ['DISPLAY'].encode())
if not d: raise RuntimeError('Private display unavailable')
x.XDefaultRootWindow.argtypes = [c.c_void_p]; x.XDefaultRootWindow.restype = c.c_ulong
x.XCreateSimpleWindow.argtypes = [c.c_void_p,c.c_ulong,c.c_int,c.c_int,c.c_uint,c.c_uint,c.c_uint,c.c_ulong,c.c_ulong]; x.XCreateSimpleWindow.restype=c.c_ulong
w=x.XCreateSimpleWindow(d,x.XDefaultRootWindow(d),0,0,480,260,0,0,0x241d33)
x.XStoreName.argtypes=[c.c_void_p,c.c_ulong,c.c_char_p]; x.XStoreName(d,w,b'Owned feedback request fixture')
x.XMapWindow.argtypes=[c.c_void_p,c.c_ulong]; x.XMapWindow(d,w)
x.XCreateGC.argtypes=[c.c_void_p,c.c_ulong,c.c_ulong,c.c_void_p]; x.XCreateGC.restype=c.c_void_p
gc=x.XCreateGC(d,w,0,None)
x.XSetForeground.argtypes=[c.c_void_p,c.c_void_p,c.c_ulong]
x.XFillRectangle.argtypes=[c.c_void_p,c.c_ulong,c.c_void_p,c.c_int,c.c_int,c.c_uint,c.c_uint]
x.XDrawString.argtypes=[c.c_void_p,c.c_ulong,c.c_void_p,c.c_int,c.c_int,c.c_char_p,c.c_int]
x.XFlush.argtypes=[c.c_void_p]
x.XSync.argtypes=[c.c_void_p,c.c_int]
x.XSync(d,0)
import time
time.sleep(.2)
x.XSetForeground(d,gc,0xc9a6ff); x.XFillRectangle(d,w,gc,20,70,200,100)
x.XSetForeground(d,gc,0x9ccfd8); x.XFillRectangle(d,w,gc,250,70,200,100)
x.XSetForeground(d,gc,0xe6e1f2)
for top,text in [(30,b'Feedback request native GUI'),(220,b'Collector-owned fixture. No user windows.')]: x.XDrawString(d,w,gc,20,top,text,len(text))
x.XFlush(d)
print(hex(w),flush=True)
signal.pause()
