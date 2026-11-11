#!/usr/bin/python3
import sys, tty, time
from pathlib import Path
tty.setraw(sys.stdin.fileno())
def screen(title):
    sys.stdout.write('\x1b[?25l\x1b[2J\x1b[H\x1b[38;2;230;225;242m'+title+'\r\nSelected item\r\n\x1b[48;2;201;166;255m'+(' '*30)+'\x1b[0m')
    sys.stdout.flush()
screen('Ready screen')
while True:
    ch=sys.stdin.read(1)
    Path('/tmp/ce-native-recovery-LxHQWV/inputs.log').open('a').write(repr(ch)+'\n')
    if ch=='n':
        screen('Loading screen')
        time.sleep(1.5)
        screen('Details screen')
    elif ch=='c': screen('Password:')
