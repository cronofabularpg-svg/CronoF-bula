-- 0034_scene_metadata.sql
-- Metadados opcionais de cena (ex.: scene_image_url configurada no onboarding).

alter table scenes
  add column if not exists metadata jsonb not null default '{}'::jsonb;
