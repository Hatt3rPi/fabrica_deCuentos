-- Add cached tokens columns to prompt_metrics table
-- These columns will track OpenAI prompt caching usage

alter table prompt_metrics 
  add column if not exists tokens_entrada_cacheados integer,
  add column if not exists tokens_salida_cacheados integer;

-- Add comments for documentation
comment on column prompt_metrics.tokens_entrada_cacheados is 'Number of cached input tokens used (reduces cost by 50%)';
comment on column prompt_metrics.tokens_salida_cacheados is 'Number of cached output tokens used (if applicable)';
