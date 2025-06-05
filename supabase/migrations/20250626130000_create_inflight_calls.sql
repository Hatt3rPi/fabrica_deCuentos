-- Track in-flight API calls
create table inflight_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  etapa text,
  actividad text,
  modelo text,
  input jsonb,
  inicio timestamptz default now()
);
