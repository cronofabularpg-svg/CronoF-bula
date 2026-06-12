-- 0030_item_images_and_battlefield_visuals.sql
-- Expansão visual: imagens de itens, locais (Mapa Vivo) e fundo do grid de
-- combate. As colunas abaixo já existem nas definições atuais de cada
-- tabela (items.image_url em 0016, locations.image_url em 0009,
-- npcs.image_url em 0028, characters.avatar_url em 0005,
-- combats.battlefield_config em 0026), mas alguns ambientes podem ter sido
-- criados a partir de versões anteriores desses arquivos — garantimos aqui
-- que existam, sem duplicar nada.

alter table items add column if not exists image_url text;
alter table locations add column if not exists image_url text;
alter table npcs add column if not exists image_url text;
alter table characters add column if not exists avatar_url text;

-- combats.battlefield_config (jsonb) já existe desde 0026 e não é alterado
-- aqui — os novos campos visuais (backgroundFit, gridOpacity, showGrid) são
-- chaves dentro do próprio jsonb, gravadas via set_combat_battlefield, sem
-- necessidade de migration de schema.

-- media_assets.usage_type já aceita 'item_image' desde 0027
-- (media_assets_usage_type_check) — nenhuma alteração necessária.
