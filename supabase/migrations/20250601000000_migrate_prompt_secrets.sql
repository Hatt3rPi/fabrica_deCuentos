/*
  # Migrate prompt secrets to prompts table

  Insert prompts that were previously stored as edge function secrets into
  the 'prompts' table. Replace the placeholder values with the actual
  prompt text before running the migration.
*/

insert into prompts(type, content)
values
  ('PROMPT_CREAR_MINIATURA_PERSONAJE', '<PROMPT_CREAR_MINIATURA_PERSONAJE>'),
  ('PROMPT_DESCRIPCION_PERSONAJE', '<PROMPT_DESCRIPCION_PERSONAJE>')
on conflict (type) do update set content = excluded.content;

