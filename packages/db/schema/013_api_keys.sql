-- Day 74: API authentication and per-request audit log for the public v1 API.
--
-- Only the SHA-256 hash of the raw key is persisted. The raw key is shown
-- once at issuance time and never again; this matches the posture of every
-- other provenance field in the schema (hashed identity, traceable origin).
--
-- `api_request_log` is the append-only audit trail. It links each public
-- API call back to the issued key, the caller's IP/UA, the path+method,
-- the HTTP status returned, and the request-id propagated through the
-- observability layer so a row can be joined against the existing
-- `ingestion_job` / `parser_run` lineage when a response was backed by a
-- parsed fact.

create table if not exists api_key (
  api_key_id text primary key,
  key_hash text not null unique,
  key_prefix text not null,
  owner_email text not null,
  scope text not null default 'read' check (scope in ('read', 'read_write', 'admin')),
  tier text not null default 'beta' check (tier in ('beta', 'standard', 'internal')),
  created_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  note text
);

create table if not exists api_request_log (
  api_request_log_id text primary key,
  api_key_id text references api_key(api_key_id),
  request_id text not null,
  method text not null,
  path text not null,
  query_string text,
  status_code integer not null,
  remote_ip text,
  user_agent text,
  response_ms integer,
  rate_limit_bucket text,
  rate_limit_remaining integer,
  rate_limited boolean not null default false,
  requested_at timestamptz not null
);

create index if not exists api_key_by_prefix_idx
  on api_key (key_prefix);

create index if not exists api_key_active_idx
  on api_key (revoked_at)
  where revoked_at is null;

create index if not exists api_request_log_by_key_time_idx
  on api_request_log (api_key_id, requested_at);

create index if not exists api_request_log_by_time_idx
  on api_request_log (requested_at);

create index if not exists api_request_log_by_path_time_idx
  on api_request_log (path, requested_at);
