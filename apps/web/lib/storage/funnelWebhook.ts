/**
 * Funnel webhook — fan-out for signup and contact records.
 *
 * On serverless platforms (Vercel, Cloudflare, etc.) the JSONL store
 * in `funnelStore.ts` writes to an ephemeral filesystem that is wiped
 * between invocations. To make sure leads still reach the operator,
 * each successful signup or contact record is also POSTed to an
 * external URL configured via env:
 *
 *   FUNNEL_WEBHOOK_URL   — required to enable. Full URL to POST to.
 *   FUNNEL_WEBHOOK_TOKEN — optional. Sent as `Authorization: Bearer ...`.
 *
 * If `FUNNEL_WEBHOOK_URL` is unset the function is a no-op and the
 * disk-based store remains the source of truth.
 *
 * Posture
 *   - Awaited by the route handler so the request keeps the function
 *     alive until the webhook delivers (Vercel kills fire-and-forget
 *     work after the response is sent).
 *   - 5-second timeout via AbortController — a slow receiver does not
 *     block the user's signup form.
 *   - Failures log but do not throw. The on-disk record is the
 *     authoritative store; the webhook is best-effort notification.
 */

const DEFAULT_TIMEOUT_MS = 5_000;

export type FunnelKind = 'signup' | 'contact';

export type FunnelWebhookPayload<TRecord> = {
  kind: FunnelKind;
  receivedAt: string;
  record: TRecord;
};

export type NotifyOptions = {
  url?: string | null;
  token?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

function resolveUrl(opts: NotifyOptions | undefined): string | null {
  const explicit = opts?.url;
  if (explicit !== undefined) {
    return explicit && explicit.length > 0 ? explicit : null;
  }
  const env = process.env.FUNNEL_WEBHOOK_URL;
  return env && env.length > 0 ? env : null;
}

function resolveToken(opts: NotifyOptions | undefined): string | null {
  if (opts?.token !== undefined) {
    return opts.token && opts.token.length > 0 ? opts.token : null;
  }
  const env = process.env.FUNNEL_WEBHOOK_TOKEN;
  return env && env.length > 0 ? env : null;
}

export async function notifyFunnelWebhook<TRecord extends { receivedAt: string }>(
  kind: FunnelKind,
  record: TRecord,
  opts?: NotifyOptions,
): Promise<{ delivered: boolean; status?: number; error?: string }> {
  const url = resolveUrl(opts);
  if (!url) {
    return { delivered: false };
  }

  const token = resolveToken(opts);
  const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const payload: FunnelWebhookPayload<TRecord> = {
    kind,
    receivedAt: record.receivedAt,
    record,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[funnel-webhook] non-2xx response: ${res.status} for kind=${kind}`,
      );
      return { delivered: false, status: res.status };
    }
    return { delivered: true, status: res.status };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `webhook timed out after ${timeoutMs}ms`
          : err.message
        : String(err);
    // eslint-disable-next-line no-console
    console.warn(`[funnel-webhook] delivery failed for kind=${kind}: ${message}`);
    return { delivered: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
