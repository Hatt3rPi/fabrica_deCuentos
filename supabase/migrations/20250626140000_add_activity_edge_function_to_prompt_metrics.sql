-- Add activity and edge_function columns to prompt_metrics
alter table prompt_metrics add column if not exists actividad text;
alter table prompt_metrics add column if not exists edge_function text;
