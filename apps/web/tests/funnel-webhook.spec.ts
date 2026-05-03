import assert from 'node:assert/strict';
import test from 'node:test';

import { notifyFunnelWebhook } from '../lib/storage/funnelWebhook';

const SAMPLE_SIGNUP = {
  email: 'jane@firm.com',
  name: 'Jane',
  company: 'Acme',
  plan: 'researcher',
  useCase: '',
  receivedAt: '2026-05-03T12:00:00Z',
};

function fakeFetch(captured: { calls: Array<{ url: string; init?: RequestInit }> }) {
  return async (url: string | URL | Request, init?: RequestInit) => {
    captured.calls.push({ url: String(url), init });
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

test('notify is a no-op when no URL is configured', async () => {
  const calls: { calls: Array<{ url: string; init?: RequestInit }> } = { calls: [] };
  const result = await notifyFunnelWebhook('signup', SAMPLE_SIGNUP, {
    url: null,
    fetchImpl: fakeFetch(calls) as unknown as typeof fetch,
  });
  assert.equal(result.delivered, false);
  assert.equal(calls.calls.length, 0);
});

test('notify POSTs the wrapped payload when URL is configured', async () => {
  const captured: { calls: Array<{ url: string; init?: RequestInit }> } = { calls: [] };
  const result = await notifyFunnelWebhook('signup', SAMPLE_SIGNUP, {
    url: 'https://hook.example.com/funnel',
    fetchImpl: fakeFetch(captured) as unknown as typeof fetch,
  });
  assert.equal(result.delivered, true);
  assert.equal(result.status, 200);
  assert.equal(captured.calls.length, 1);
  const call = captured.calls[0];
  assert.equal(call.url, 'https://hook.example.com/funnel');
  assert.equal(call.init?.method, 'POST');
  const body = JSON.parse(String(call.init?.body));
  assert.equal(body.kind, 'signup');
  assert.equal(body.receivedAt, SAMPLE_SIGNUP.receivedAt);
  assert.deepEqual(body.record, SAMPLE_SIGNUP);
});

test('notify includes Bearer token when token is configured', async () => {
  const captured: { calls: Array<{ url: string; init?: RequestInit }> } = { calls: [] };
  await notifyFunnelWebhook('contact', { ...SAMPLE_SIGNUP, topic: 'pricing', message: 'hi' }, {
    url: 'https://hook.example.com/funnel',
    token: 's3cret',
    fetchImpl: fakeFetch(captured) as unknown as typeof fetch,
  });
  const headers = captured.calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer s3cret');
});

test('notify returns delivered=false on non-2xx without throwing', async () => {
  const fetch500: typeof fetch = (async () =>
    new Response('boom', { status: 500 })) as unknown as typeof fetch;
  const result = await notifyFunnelWebhook('signup', SAMPLE_SIGNUP, {
    url: 'https://hook.example.com/funnel',
    fetchImpl: fetch500,
  });
  assert.equal(result.delivered, false);
  assert.equal(result.status, 500);
});

test('notify returns delivered=false when fetch throws', async () => {
  const fetchThrow: typeof fetch = (async () => {
    throw new Error('network down');
  }) as unknown as typeof fetch;
  const result = await notifyFunnelWebhook('signup', SAMPLE_SIGNUP, {
    url: 'https://hook.example.com/funnel',
    fetchImpl: fetchThrow,
  });
  assert.equal(result.delivered, false);
  assert.match(result.error ?? '', /network down/);
});

test('notify aborts with timeout error on slow webhook', async () => {
  const fetchSlow: typeof fetch = ((_url: unknown, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }
    })) as unknown as typeof fetch;

  const result = await notifyFunnelWebhook('signup', SAMPLE_SIGNUP, {
    url: 'https://hook.example.com/funnel',
    fetchImpl: fetchSlow,
    timeoutMs: 50,
  });
  assert.equal(result.delivered, false);
  assert.match(result.error ?? '', /timed out/);
});

test('notify treats empty-string URL as unset (no-op)', async () => {
  const captured: { calls: Array<{ url: string; init?: RequestInit }> } = { calls: [] };
  const result = await notifyFunnelWebhook('signup', SAMPLE_SIGNUP, {
    url: '',
    fetchImpl: fakeFetch(captured) as unknown as typeof fetch,
  });
  assert.equal(result.delivered, false);
  assert.equal(captured.calls.length, 0);
});
