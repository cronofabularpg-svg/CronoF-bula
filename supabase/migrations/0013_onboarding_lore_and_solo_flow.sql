-- 0013_onboarding_lore_and_solo_flow.sql
-- Suporte ao onboarding narrativo: capa de campanha por URL manual.

alter table campaigns
  add column if not exists cover_image_url text;
