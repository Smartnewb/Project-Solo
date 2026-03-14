type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  endpoint: string;
  action: string;
  message?: string;
  status?: number;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
}

function log(entry: LogEntry): void {
  const payload = {
    ...entry,
    timestamp: new Date().toISOString(),
    service: 'admin-bff',
  };
  if (entry.level === 'error') {
    // eslint-disable-next-line no-console -- structured server-side logging
    console.error(JSON.stringify(payload));
  } else {
    // eslint-disable-next-line no-console -- structured server-side logging
    console.log(JSON.stringify(payload));
  }
}

export const adminLog = {
  info: (endpoint: string, action: string, extra?: Record<string, unknown>) =>
    log({ level: 'info', endpoint, action, ...extra }),
  warn: (endpoint: string, action: string, extra?: Record<string, unknown>) =>
    log({ level: 'warn', endpoint, action, ...extra }),
  error: (endpoint: string, action: string, error: unknown, extra?: Record<string, unknown>) =>
    log({
      level: 'error',
      endpoint,
      action,
      error: error instanceof Error ? error.message : String(error),
      ...extra,
    }),
};
