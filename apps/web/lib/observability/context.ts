export const REQUEST_ID_HEADER = 'x-request-id';
export const JOB_ID_HEADER = 'x-job-id';

export type ObservabilityContext = {
  requestId: string;
  jobId?: string;
};

function normalizeHeaderId(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

export function resolveRequestId(
  value: string | null | undefined,
  fallbackFactory: () => string = () => crypto.randomUUID(),
): string {
  return normalizeHeaderId(value) ?? fallbackFactory();
}

export function resolveJobId(value: string | null | undefined): string | undefined {
  return normalizeHeaderId(value);
}

export function buildObservabilityContext(headers: Headers): ObservabilityContext {
  return {
    requestId: resolveRequestId(headers.get(REQUEST_ID_HEADER)),
    jobId: resolveJobId(headers.get(JOB_ID_HEADER)),
  };
}
