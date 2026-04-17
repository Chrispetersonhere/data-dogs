import { type ObservabilityContext } from './context';
import { buildLogEntry } from './logger';

export type ErrorBoundaryPayload = {
  title: string;
  message: string;
  requestId: string;
};

export function toErrorBoundaryPayload(
  error: unknown,
  context: ObservabilityContext,
): ErrorBoundaryPayload {
  const message = error instanceof Error ? error.message : 'Unexpected error';

  return {
    title: 'Something went wrong',
    message,
    requestId: context.requestId,
  };
}

export function buildErrorBoundaryLog(error: unknown, context: ObservabilityContext): string {
  const message = error instanceof Error ? error.message : 'Unexpected error';

  return JSON.stringify(
    buildLogEntry(context, {
      event: 'ui.error_boundary',
      level: 'error',
      message,
      details: {
        name: error instanceof Error ? error.name : 'UnknownError',
      },
    }),
  );
}
