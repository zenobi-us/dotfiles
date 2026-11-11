import { appendFileSync } from 'node:fs';
process.stdin.setRawMode(true);
const screen = (title: string) => process.stdout.write('\x1b[?25l\x1b[2J\x1b[H\x1b[38;2;230;225;242m' + title + '\r\nSelected item\r\n\x1b[48;2;201;166;255m' + ' '.repeat(30) + '\x1b[0m' + "\r\nDelete files? [y/N]\r\n");
screen('Ready screen');
process.stdin.on('data', data => { appendFileSync("/tmp/ce-fix-0017-ns4SuA/expect-confirmation-input", data); screen('Loading screen'); setTimeout(() => screen('Details screen'),1500); });
