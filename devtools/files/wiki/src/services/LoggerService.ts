import { pino } from 'pino';

const enabled = !!process.env.DEBUG;

console.log(`Logger initialized. Level: ${process.env.LOG_LEVEL || 'info'}, Enabled: ${enabled}`);

export const Logger = pino({
  name: 'wiki',
  level: process.env.LOG_LEVEL || 'info',
  enabled: !!process.env.DEBUG,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    }
  },
})
