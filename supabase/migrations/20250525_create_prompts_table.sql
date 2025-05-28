/*
  # Create prompts table for editable templates

  1. New Tables
    - prompts
      - id uuid primary key
      - type text unique
      - content text
      - version integer
      - updated_at timestamp
      - updated_by uuid
    - prompt_versions
      - id uuid primary key
      - prompt_id uuid references prompts
      - version integer
      - content text
      - created_at timestamp
      - created_by uuid

  2. RLS
    - Only admins may read or modify prompts and versions

  3. Triggers
    - Auto increment version on update
    - Log versions on insert/update
*/

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  type text unique not null,
  content text not null,
  version integer not null default 1,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
  version integer not null,
  content text not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table prompts enable row level security;
alter table prompt_versions enable row level security;

create policy "Admins read prompts" on prompts
for select to authenticated
using (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
));

create policy "Admins modify prompts" on prompts
for all to authenticated
using (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
))
with check (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
));

create policy "Admins read prompt_versions" on prompt_versions
for select to authenticated
using (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
));

create policy "Admins insert prompt_versions" on prompt_versions
for insert to authenticated
with check (auth.jwt() ->> 'email' in (
  'fabarca212@gmail.com',
  'lucianoalonso2000@gmail.com',
  'javier2000asr@gmail.com'
));

create or replace function update_prompt_version()
returns trigger as $$
begin
  new.version := coalesce(old.version,1) + 1;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace function log_prompt_version()
returns trigger as $$
begin
  insert into prompt_versions(prompt_id, version, content, created_by)
  values(new.id, new.version, new.content, new.updated_by);
  return new;
end;
$$ language plpgsql;

create trigger trg_update_prompt_version
before update on prompts
for each row execute function update_prompt_version();

create trigger trg_log_prompt_version
after insert or update on prompts
for each row execute function log_prompt_version();

create or replace function revert_prompt_version(p_id uuid, p_version integer)
returns void as $$
declare
  v_content text;
begin
  select content into v_content
  from prompt_versions
  where prompt_id = p_id and version = p_version
  order by created_at desc limit 1;
  if v_content is null then
    raise exception 'Version not found';
  end if;
  update prompts
  set content = v_content,
      version = p_version,
      updated_at = now()
  where id = p_id;
end;
$$ language plpgsql security definer;

grant execute on function revert_prompt_version(uuid, integer) to authenticated;
