export const HEALTHCHECK_PATH = '/healthz';

export type HealthStatus = {
  ok: true;
  service: 'web';
  timestamp: string;
};

export function buildHealthStatus(now: Date = new Date()): HealthStatus {
  return {
    ok: true,
    service: 'web',
    timestamp: now.toISOString(),
  };
}
