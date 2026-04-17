import { type ObservabilityContext } from './context';
import { buildLogEntry, serializeLogEntry } from './logger';

export type ErrorBoundaryPayload = {
  title: string;
  message: string;
  requestId: string;
};

function getErrorDetails(error: unknown): { message: string; name: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: 'Unexpected error',
    name: 'UnknownError',
  };
}

export function toErrorBoundaryPayload(
  error: unknown,
  context: ObservabilityContext,
): ErrorBoundaryPayload {
  const { message } = getErrorDetails(error);

  return {
    title: 'Something went wrong',
    message,
    requestId: context.requestId,
  };
}

export function buildErrorBoundaryLog(error: unknown, context: ObservabilityContext): string {
  const { message, name } = getErrorDetails(error);

  return serializeLogEntry(
    buildLogEntry(context, {
      event: 'ui.error_boundary',
      level: 'error',
      message,
      details: {
        name,
      },
    }),
  );
}
