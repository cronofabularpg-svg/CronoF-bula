-- 0019_character_progression_and_resources.sql
-- Fase 10.2: Inventário Final, Ficha Evolutiva e Level Up.
-- Recursos do personagem, condições e fluxo controlado de level up.
-- Também trava, via trigger, a alteração direta de campos críticos da ficha
-- (nível, HP, CA, proficiência, atributos) por quem não é mestre da campanha.

-- Recursos ---------------------------------------------------------------

create table character_resources (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  resource_key text not null,
  label text not null,
  current_value integer default 0,
  max_value integer default 0,
  resource_type text default 'custom',
  recovery_rule text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (character_id, resource_key)
);

create index character_resources_campaign_id_idx on character_resources (campaign_id);
create index character_resources_character_id_idx on character_resources (character_id);

alter table character_resources enable row level security;

create policy "Owners read own resources"
on character_resources for select
using (owns_character(character_id));

create policy "Masters read campaign resources"
on character_resources for select
using (is_campaign_master(campaign_id));

create policy "Masters manage campaign resources"
on character_resources for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

-- Jogador pode ajustar o valor atual (ex: gastar slot de magia, usar dado de
-- vida) do próprio recurso. Demais campos ficam travados pelo trigger abaixo.
create policy "Owners update own resource current value"
on character_resources for update
using (owns_character(character_id))
with check (owns_character(character_id));

create or replace function lock_character_resource_fields()
returns trigger as $$
begin
  if not is_campaign_master(new.campaign_id) then
    new.campaign_id := old.campaign_id;
    new.character_id := old.character_id;
    new.resource_key := old.resource_key;
    new.label := old.label;
    new.max_value := old.max_value;
    new.resource_type := old.resource_type;
    new.recovery_rule := old.recovery_rule;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_character_resources_update_lock_fields
before update on character_resources
for each row execute function lock_character_resource_fields();

create trigger set_character_resources_updated_at
before update on character_resources
for each row execute function set_updated_at();

-- Condições ----------------------------------------------------------------

create table character_conditions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  condition_key text not null,
  label text not null,
  description text,
  source text,
  status text default 'active',
  applied_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index character_conditions_campaign_id_idx on character_conditions (campaign_id);
create index character_conditions_character_id_idx on character_conditions (character_id);

alter table character_conditions enable row level security;

create policy "Owners read own conditions"
on character_conditions for select
using (owns_character(character_id));

-- Apenas o mestre lê, aplica e gerencia condições oficiais da campanha.
-- Jogador não aplica condição em si mesmo nesta fase.
create policy "Masters manage campaign conditions"
on character_conditions for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create trigger set_character_conditions_updated_at
before update on character_conditions
for each row execute function set_updated_at();

-- Level Up -------------------------------------------------------------------

create table character_level_ups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  requested_by uuid references profiles(id),
  from_level integer not null,
  to_level integer not null,
  status text default 'pending',
  proposed_changes jsonb default '{}'::jsonb,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table character_level_ups
  add constraint character_level_ups_status_check
  check (status in ('pending', 'approved', 'rejected', 'applied'));

alter table character_level_ups
  add constraint character_level_ups_levels_check
  check (to_level > from_level);

-- Apenas um pedido pendente por personagem.
create unique index character_level_ups_one_pending_idx
  on character_level_ups (character_id)
  where (status = 'pending');

create index character_level_ups_campaign_id_idx on character_level_ups (campaign_id);
create index character_level_ups_character_id_idx on character_level_ups (character_id);

alter table character_level_ups enable row level security;

create policy "Owners read own level ups"
on character_level_ups for select
using (owns_character(character_id));

create policy "Masters read campaign level ups"
on character_level_ups for select
using (is_campaign_master(campaign_id));

-- Jogador solicita level up para o próprio personagem (apenas +1 nível,
-- a partir do nível atual, status pending).
create policy "Owners request level up for own character"
on character_level_ups for insert
with check (
  owns_character(character_id)
  and requested_by = auth.uid()
  and status = 'pending'
  and is_campaign_member(campaign_id)
  and from_level = (select level from characters c where c.id = character_id)
  and to_level = from_level + 1
);

create policy "Masters manage campaign level ups"
on character_level_ups for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create trigger set_character_level_ups_updated_at
before update on character_level_ups
for each row execute function set_updated_at();

-- Trava de campos críticos --------------------------------------------------
-- Jogador não altera nível/HP/CA/proficiência/velocidade diretamente.
-- O mestre continua podendo editar tudo (Portal do Mestre / aprovação de level up).

create or replace function lock_character_critical_fields()
returns trigger as $$
begin
  if new.campaign_id is not null and not is_campaign_master(new.campaign_id) then
    new.level := old.level;
    new.current_hp := old.current_hp;
    new.max_hp := old.max_hp;
    new.armor_class := old.armor_class;
    new.proficiency_bonus := old.proficiency_bonus;
    new.speed := old.speed;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_character_update_lock_critical_fields
before update on characters
for each row execute function lock_character_critical_fields();

-- Jogador não altera atributos/saving_throws/skills diretamente.
-- sheet_state (inspiração, exaustão, xp, ouro, mana, condições narrativas)
-- continua livre para o jogador.

create or replace function lock_character_stats_attributes()
returns trigger as $$
declare
  v_campaign_id uuid;
begin
  select campaign_id into v_campaign_id from characters where id = new.character_id;

  if v_campaign_id is not null and not is_campaign_master(v_campaign_id) then
    new.strength := old.strength;
    new.dexterity := old.dexterity;
    new.constitution := old.constitution;
    new.intelligence := old.intelligence;
    new.wisdom := old.wisdom;
    new.charisma := old.charisma;
    new.saving_throws := old.saving_throws;
    new.skills := old.skills;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_character_stats_update_lock_attributes
before update on character_stats
for each row execute function lock_character_stats_attributes();

-- Aplicação de Level Up -------------------------------------------------------
-- Função interna: aplica as mudanças propostas em characters/character_stats/
-- character_resources. Chamada apenas por funções security definer de mestre.

create or replace function apply_level_up_changes(p_character_id uuid, p_to_level integer, p_proposed_changes jsonb)
returns void as $$
declare
  v_resource jsonb;
begin
  update characters
  set
    level = p_to_level,
    proficiency_bonus = coalesce((p_proposed_changes->>'proficiency_bonus')::int, proficiency_bonus),
    max_hp = coalesce((p_proposed_changes->>'max_hp')::int, max_hp),
    current_hp = coalesce((p_proposed_changes->>'current_hp')::int, current_hp)
  where id = p_character_id;

  if jsonb_typeof(p_proposed_changes->'resources') = 'array' then
    for v_resource in select * from jsonb_array_elements(p_proposed_changes->'resources')
    loop
      insert into character_resources (
        campaign_id, character_id, resource_key, label, current_value, max_value, resource_type, recovery_rule
      )
      select
        c.campaign_id,
        p_character_id,
        v_resource->>'resource_key',
        coalesce(v_resource->>'label', v_resource->>'resource_key'),
        coalesce((v_resource->>'current_value')::int, (v_resource->>'max_value')::int, 0),
        coalesce((v_resource->>'max_value')::int, 0),
        coalesce(v_resource->>'resource_type', 'custom'),
        v_resource->>'recovery_rule'
      from characters c
      where c.id = p_character_id
      on conflict (character_id, resource_key) do update
      set
        label = excluded.label,
        max_value = excluded.max_value,
        current_value = excluded.current_value,
        resource_type = excluded.resource_type,
        recovery_rule = excluded.recovery_rule,
        updated_at = now();
    end loop;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- RPC: mestre aprova/rejeita um pedido de level up pendente.

create or replace function resolve_character_level_up(target_level_up_id uuid, target_decision text)
returns character_level_ups as $$
declare
  v_row character_level_ups;
  v_character_name text;
begin
  if target_decision not in ('approve', 'reject') then
    raise exception 'Decisão inválida: %', target_decision;
  end if;

  select * into v_row from character_level_ups where id = target_level_up_id;
  if not found then
    raise exception 'Pedido de level up não encontrado';
  end if;

  if not is_campaign_master(v_row.campaign_id) then
    raise exception 'Apenas o mestre pode resolver pedidos de level up';
  end if;

  if v_row.status != 'pending' then
    raise exception 'Este pedido já foi resolvido';
  end if;

  if target_decision = 'reject' then
    update character_level_ups
    set status = 'rejected', approved_by = auth.uid(), approved_at = now()
    where id = target_level_up_id
    returning * into v_row;
    return v_row;
  end if;

  perform apply_level_up_changes(v_row.character_id, v_row.to_level, v_row.proposed_changes);

  update character_level_ups
  set status = 'applied', approved_by = auth.uid(), approved_at = now()
  where id = target_level_up_id
  returning * into v_row;

  select name into v_character_name from characters where id = v_row.character_id;

  insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
  select s.campaign_id, s.id, sc.id, 'level_up', coalesce(v_character_name, 'O personagem') || ' alcançou o nível ' || v_row.to_level || '.', auth.uid()
  from sessions s
  join scenes sc on sc.session_id = s.id and sc.status = 'active'
  where s.campaign_id = v_row.campaign_id and s.status = 'active'
  order by s.created_at desc, sc.created_at desc
  limit 1;

  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function resolve_character_level_up(uuid, text) to authenticated;

-- RPC: mestre sobe o nível do personagem diretamente ("Upar Personagem Agora").

create or replace function master_apply_level_up(target_character_id uuid, target_to_level integer, target_proposed_changes jsonb default '{}'::jsonb)
returns character_level_ups as $$
declare
  v_campaign_id uuid;
  v_from_level integer;
  v_row character_level_ups;
  v_character_name text;
begin
  select campaign_id, level into v_campaign_id, v_from_level from characters where id = target_character_id;
  if not found then
    raise exception 'Personagem não encontrado';
  end if;

  if not is_campaign_master(v_campaign_id) then
    raise exception 'Apenas o mestre pode aplicar level up diretamente';
  end if;

  if target_to_level <= v_from_level then
    raise exception 'O novo nível deve ser maior que o nível atual';
  end if;

  insert into character_level_ups (
    campaign_id, character_id, requested_by, from_level, to_level, status, proposed_changes, approved_by, approved_at
  ) values (
    v_campaign_id, target_character_id, auth.uid(), v_from_level, target_to_level, 'applied', target_proposed_changes, auth.uid(), now()
  )
  returning * into v_row;

  perform apply_level_up_changes(target_character_id, target_to_level, target_proposed_changes);

  select name into v_character_name from characters where id = target_character_id;

  insert into scene_events (campaign_id, session_id, scene_id, event_type, content, created_by)
  select s.campaign_id, s.id, sc.id, 'level_up', coalesce(v_character_name, 'O personagem') || ' alcançou o nível ' || target_to_level || '.', auth.uid()
  from sessions s
  join scenes sc on sc.session_id = s.id and sc.status = 'active'
  where s.campaign_id = v_campaign_id and s.status = 'active'
  order by s.created_at desc, sc.created_at desc
  limit 1;

  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function master_apply_level_up(uuid, integer, jsonb) to authenticated;
