/*
  # Create prompt_metrics table to store prompt usage metrics
  1. New table
    - prompt_metrics
      - id uuid primary key
      - prompt_id uuid references prompts(id)
      - timestamp timestamptz
      - modelo_ia text
      - tiempo_respuesta_ms integer
      - estado text
      - tokens_entrada integer
      - tokens_salida integer
      - usuario_id uuid references auth.users(id)
      - metadatos jsonb
  2. Indexes
    - index on prompt_id
    - index on timestamp
  3. Row Level Security
    - enabled
    - admin users can read and insert
*/

create table if not exists prompt_metrics (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id),
  timestamp timestamptz default now(),
  modelo_ia text not null,
  tiempo_respuesta_ms integer,
  estado text,
  tokens_entrada integer,
  tokens_salida integer,
  usuario_id uuid references auth.users(id),
  metadatos jsonb
);

create index if not exists idx_prompt_metrics_prompt on prompt_metrics(prompt_id);
create index if not exists idx_prompt_metrics_timestamp on prompt_metrics(timestamp);

alter table prompt_metrics enable row level security;

create policy "Admins read prompt metrics" on prompt_metrics
for select to authenticated
using (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
));

create policy "Admins insert prompt metrics" on prompt_metrics
for insert to authenticated
with check (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
));
