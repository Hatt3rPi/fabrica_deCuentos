-- Add column for error classification on prompt metrics
alter table prompt_metrics add column if not exists error_type text;
