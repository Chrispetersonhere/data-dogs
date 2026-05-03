# Deploy: Vercel

This walks you through deploying the Next.js web app (`apps/web`) to
Vercel from a clean machine. The Python ingest services are out of
scope for this guide — Vercel only hosts the web app.

## One-time setup

### 1. Install the Vercel CLI

```powershell
npm i -g vercel
vercel login
```

### 2. Link the repo to a Vercel project

From the repo root:

```powershell
vercel link
```

Pick **Create new project** the first time. The
[`vercel.json`](../../vercel.json) at the repo root tells Vercel to
build only `apps/web`.

### 3. Set required environment variables

In the Vercel dashboard for the project (Settings → Environment Variables) or via the CLI:

| Variable | Required | Value | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | `https://your-domain.com` | Used by `metadataBase`, OG image, sitemap and robots. Without it, those URLs default to `https://www.ibis.dev`. |
| `FUNNEL_WEBHOOK_URL` | yes (for prod) | full URL | POST receiver for every signup + contact record. **Required** to avoid losing leads on serverless — see "Persistence on serverless" below. |
| `FUNNEL_WEBHOOK_TOKEN` | optional | secret | Sent as `Authorization: Bearer ...` to your webhook receiver. |
| `ADMIN_ENABLED` | optional | `true` | Enables `/admin/signups`, `/admin/contact`, `/admin/jobs`, `/admin/qa`. **Do not set in prod** unless you have separate auth in front. |
| `FUNNEL_STORAGE_DIR` | optional | absolute path | Override the JSONL storage dir. On Vercel, leave unset — the in-memory fallback kicks in and the webhook is the durable path. |

Apply via the CLI:

```powershell
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add FUNNEL_WEBHOOK_URL production
```

## Deploy

### Preview deploy (safe to share)

```powershell
vercel
```

Vercel returns a preview URL like `https://data-dogs-abc123.vercel.app`. Share it,
poke at it, hit the funnel — every signup hits your webhook.

### Production deploy

```powershell
vercel --prod
```

Aliases the deployment to your project's production domain.

## Persistence on serverless — read this once

The funnel store lives at
[`apps/web/lib/storage/funnelStore.ts`](../../apps/web/lib/storage/funnelStore.ts)
and writes JSONL to disk. **On Vercel that disk is ephemeral** —
serverless functions get a fresh `/tmp` per invocation, so signups
written to disk evaporate the moment the function exits.

The webhook fallback at
[`apps/web/lib/storage/funnelWebhook.ts`](../../apps/web/lib/storage/funnelWebhook.ts)
is the production-durable path. After every successful signup or
contact, the route handler awaits a POST to `FUNNEL_WEBHOOK_URL`. If
the URL is unset, the in-memory store is the only record and you will
lose data.

Cheap, working webhook receivers:

- **Discord:** Server settings → Integrations → Webhooks → New Webhook → Copy URL. Discord expects `{"content": "..."}`, so pair this with a small adapter (Cloudflare Worker, Vercel Function, etc.) that reformats the JSON we send.
- **Zapier / Make:** "Webhooks by Zapier" → Catch Hook → use the URL. Map the JSON fields to Gmail / Notion / Slack / a Sheets row.
- **n8n / self-hosted:** raw HTTP trigger node.
- **Your own endpoint:** any public URL that accepts JSON. The payload shape is `{ kind: 'signup' | 'contact', receivedAt, record }`.

When real DB wiring lands the webhook becomes optional — the route handlers will already be writing through to Postgres.

## Smoke-test the deployed funnel

After deploy, run this against the production URL:

```powershell
$site = 'https://your-domain.com'   # or the *.vercel.app preview URL

# Signup
Invoke-RestMethod "$site/api/v1/signup" -Method Post `
  -ContentType 'application/json' `
  -Body (@{ email='you@firm.com'; name='You'; company='Acme'; plan='researcher' } | ConvertTo-Json)

# Contact
Invoke-RestMethod "$site/api/v1/contact" -Method Post `
  -ContentType 'application/json' `
  -Body (@{ email='you@firm.com'; name='You'; company='Acme'; topic='pricing'; message='hi' } | ConvertTo-Json)

# Status
Invoke-RestMethod "$site/api/v1/status" | ConvertTo-Json -Depth 4

# SEO surface
Invoke-RestMethod "$site/robots.txt"
Invoke-RestMethod "$site/sitemap.xml"
```

Expected: signup + contact return `{ ok: true, ... }` and your webhook
receiver fires within a few seconds.

## Rollback

```powershell
vercel rollback                        # interactive: pick a prior deployment
vercel rollback <deployment-url>       # specific deployment
```

Vercel keeps every prior deployment immutable, so rollback is instant.

## What's intentionally **not** wired

- **No real database.** The funnel webhook + the JSONL fallback cover the lead-capture path. Other data layers (filings, fundamentals, etc.) still use sample data. Real DB wiring is a separate, larger PR.
- **No auth.** `/admin/*` is gated only by `ADMIN_ENABLED=true`, which is an "off switch" not access control. Don't expose admin routes publicly.
- **No CDN tuning beyond the defaults.** `/api/v1/status` ships with `cache-control: public, max-age=30, s-maxage=60`; everything else uses Next/Vercel defaults.
