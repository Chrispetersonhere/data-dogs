import { type ObservabilityContext } from './context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type StructuredLogEntry = {
  event: string;
  message: string;
  level: LogLevel;
  timestamp: string;
  requestId: string;
  jobId?: string;
  details?: Record<string, unknown>;
};

export function buildLogEntry(
  context: ObservabilityContext,
  input: Omit<StructuredLogEntry, 'timestamp' | 'requestId' | 'jobId'>,
): StructuredLogEntry {
  return {
    ...input,
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    ...(context.jobId ? { jobId: context.jobId } : {}),
  };
}

export function serializeLogEntry(entry: StructuredLogEntry): string {
  return JSON.stringify(entry);
}
