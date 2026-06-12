-- 0031_live_map_scopes_and_images.sql
-- Mapa Vivo em camadas: cada location passa a indicar em qual escala de mapa
-- ela aparece (mundo, região, cidade, local/dungeon), pode pertencer a um
-- local "pai" (ex.: um distrito pertence a uma cidade) e tem uma posição em
-- porcentagem (map_position_x/y) para ser exibida sobre a imagem de fundo da
-- camada. Nenhuma coluna existente é removida ou renomeada; tudo é aditivo e
-- com defaults seguros para registros já existentes.

alter table locations add column if not exists map_scope text not null default 'world';

alter table locations
  add constraint locations_map_scope_check
  check (map_scope in ('world', 'region', 'city', 'local', 'dungeon'));

alter table locations add column if not exists parent_location_id uuid;

alter table locations
  add constraint locations_parent_location_id_fkey
  foreign key (parent_location_id) references locations(id) on delete set null;

alter table locations add column if not exists map_position_x numeric not null default 50;
alter table locations add column if not exists map_position_y numeric not null default 50;

alter table locations add column if not exists map_marker_type text not null default 'point';

alter table locations
  add constraint locations_map_marker_type_check
  check (map_marker_type in ('point', 'city', 'region', 'dungeon', 'landmark', 'portal', 'danger', 'shop', 'quest'));

alter table locations add column if not exists map_icon text;

alter table locations add column if not exists map_scale text not null default 'medium';

alter table locations
  add constraint locations_map_scale_check
  check (map_scale in ('tiny', 'small', 'medium', 'large', 'huge'));

alter table locations add column if not exists map_image_fit text not null default 'contain';

alter table locations
  add constraint locations_map_image_fit_check
  check (map_image_fit in ('contain', 'cover'));

alter table locations add column if not exists map_grid_enabled boolean not null default false;
alter table locations add column if not exists map_grid_opacity numeric not null default 0.35;

create index if not exists locations_campaign_map_scope_idx on locations (campaign_id, map_scope);
create index if not exists locations_campaign_parent_location_idx on locations (campaign_id, parent_location_id);
create index if not exists locations_campaign_visibility_idx on locations (campaign_id, visibility);
