import { appendFileSync, writeFileSync } from 'node:fs';
writeFileSync("/tmp/ce-fix-0023-lu0flE/credential-1-expect-identity.json", JSON.stringify({ runtime: process.env.XDG_RUNTIME_DIR, pid: process.pid, server: process.ppid }));
process.stdin.setRawMode(true);
const screen = (title: string) => process.stdout.write('\x1b[?25l\x1b[2J\x1b[H\x1b[38;2;230;225;242m' + title + '\r\nSelected item\r\n\x1b[48;2;201;166;255m' + ' '.repeat(30) + '\x1b[0m\r\n' + "API-key:" + '\r\n');
screen('Ready screen');
process.stdin.on('data', data => { appendFileSync("/tmp/ce-fix-0023-lu0flE/credential-1-expect-input", data);  });
