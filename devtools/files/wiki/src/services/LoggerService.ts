import { pino } from 'pino';

const enabled = !!process.env.DEBUG;


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
