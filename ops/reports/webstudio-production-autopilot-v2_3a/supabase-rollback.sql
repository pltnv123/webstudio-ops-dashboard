-- Rollback for WebStudio Production Autopilot V2.3A operational memory/state tables
-- Destructive: drops only the four ops tables created by this task.

drop table if exists public.webstudio_memory_index;
drop table if exists public.webstudio_artifacts;
drop table if exists public.webstudio_jobs;
drop table if exists public.webstudio_ops_status;
