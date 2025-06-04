-- Add endpoint and model columns to prompts table
alter table prompts
  add column if not exists endpoint text,
  add column if not exists model text;

-- Populate existing prompts with default values
update prompts set endpoint='https://api.openai.com/v1/chat/completions', model='gpt-4-turbo'
  where type in ('PROMPT_DESCRIPCION_PERSONAJE','PROMPT_GENERADOR_CUENTOS');
update prompts set endpoint='https://api.openai.com/v1/images/generations', model='gpt-image-1'
  where type='PROMPT_CUENTO_PORTADA';
update prompts set endpoint='https://api.openai.com/v1/images/edits', model='gpt-image-1'
  where type in ('PROMPT_CREAR_MINIATURA_PERSONAJE','PROMPT_ESTILO_KAWAII','PROMPT_ESTILO_ACUARELADIGITAL','PROMPT_ESTILO_BORDADO','PROMPT_ESTILO_MANO','PROMPT_ESTILO_RECORTES','PROMPT_VARIANTE_TRASERA','PROMPT_VARIANTE_LATERAL');
