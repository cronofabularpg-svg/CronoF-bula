-- 0028_character_setup_images_chronicles.sql
-- Fase 11: Setup Inicial de Personagem (wizard), exposição dos uploads R2
-- (avatar de personagem / token de NPC) e geração funcional de crônicas.
--
-- O wizard de setup inicial precisa gravar campos hoje travados pelos
-- triggers `lock_character_critical_fields` e `lock_character_stats_attributes`
-- (0019) para jogadores. Para permitir esse fluxo controlado, sem desativar
-- RLS nem os triggers de trava, criamos uma RPC security definer que:
--   1. valida que o chamador é o dono do personagem (e a ficha ainda está
--      incompleta) ou o mestre da campanha;
--   2. liga uma flag local de transação (`cronofabula.allow_initial_setup`)
--      que os triggers de trava passam a respeitar como escape;
--   3. grava characters/character_stats/character_resources/items/character_items
--      de forma controlada, sem criar recursos ou itens que não foram
--      explicitamente selecionados pelo jogador.

-- ----------------------------------------------------------------------------
-- 1. Escape hatch nos triggers de trava de campos críticos
-- ----------------------------------------------------------------------------

create or replace function lock_character_critical_fields()
returns trigger as $$
begin
  if new.campaign_id is not null
     and not is_campaign_master(new.campaign_id)
     and coalesce(current_setting('cronofabula.allow_initial_setup', true), 'false') <> 'true' then
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

create or replace function lock_character_stats_attributes()
returns trigger as $$
declare
  v_campaign_id uuid;
begin
  select campaign_id into v_campaign_id from characters where id = new.character_id;

  if v_campaign_id is not null
     and not is_campaign_master(v_campaign_id)
     and coalesce(current_setting('cronofabula.allow_initial_setup', true), 'false') <> 'true' then
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

-- ----------------------------------------------------------------------------
-- 2. RPC de setup inicial de personagem
-- ----------------------------------------------------------------------------

create or replace function complete_character_initial_setup(
  target_character_id uuid,
  p_identity jsonb default '{}'::jsonb,
  p_attributes jsonb default '{}'::jsonb,
  p_combat jsonb default '{}'::jsonb,
  p_proficiencies jsonb default '{}'::jsonb,
  p_resources jsonb default '[]'::jsonb,
  p_items jsonb default '[]'::jsonb
)
returns characters as $$
declare
  v_campaign_id uuid;
  v_is_master boolean;
  v_incomplete boolean;
  v_resource jsonb;
  v_item jsonb;
  v_item_id uuid;
  v_character characters;
begin
  select campaign_id into v_campaign_id from characters where id = target_character_id;

  if v_campaign_id is null then
    raise exception 'Personagem não encontrado.';
  end if;

  v_is_master := is_campaign_master(v_campaign_id);

  if not v_is_master and not owns_character(target_character_id) then
    raise exception 'Sem permissão para configurar este personagem.';
  end if;

  -- Jogador só pode rodar o setup inicial enquanto a ficha estiver
  -- incompleta. Depois disso, alterações nesses campos passam a ser
  -- responsabilidade do mestre (level up, ajustes manuais etc.).
  if not v_is_master then
    select (
      c.current_hp is null or c.max_hp is null or c.armor_class is null
      or c.speed is null or c.proficiency_bonus is null
      or c.class is null or c.race is null
      or cs.character_id is null
      or cs.strength is null or cs.dexterity is null or cs.constitution is null
      or cs.intelligence is null or cs.wisdom is null or cs.charisma is null
    )
    into v_incomplete
    from characters c
    left join character_stats cs on cs.character_id = c.id
    where c.id = target_character_id;

    if not coalesce(v_incomplete, true) then
      raise exception 'A ficha deste personagem já foi configurada. Peça ao mestre para ajustar.';
    end if;
  end if;

  perform set_config('cronofabula.allow_initial_setup', 'true', true);

  update characters set
    race = coalesce(p_identity->>'race', race),
    class = coalesce(p_identity->>'class', class),
    background = coalesce(p_identity->>'background', background),
    alignment = coalesce(p_identity->>'alignment', alignment),
    level = coalesce((p_identity->>'level')::int, level),
    current_hp = coalesce((p_combat->>'current_hp')::int, current_hp),
    max_hp = coalesce((p_combat->>'max_hp')::int, max_hp),
    armor_class = coalesce((p_combat->>'armor_class')::int, armor_class),
    speed = coalesce((p_combat->>'speed')::int, speed),
    proficiency_bonus = coalesce((p_combat->>'proficiency_bonus')::int, proficiency_bonus)
  where id = target_character_id;

  update character_stats set
    strength = coalesce((p_attributes->>'strength')::int, strength),
    dexterity = coalesce((p_attributes->>'dexterity')::int, dexterity),
    constitution = coalesce((p_attributes->>'constitution')::int, constitution),
    intelligence = coalesce((p_attributes->>'intelligence')::int, intelligence),
    wisdom = coalesce((p_attributes->>'wisdom')::int, wisdom),
    charisma = coalesce((p_attributes->>'charisma')::int, charisma),
    saving_throws = coalesce(p_proficiencies->'saving_throws', saving_throws),
    skills = coalesce(p_proficiencies->'skills', skills)
  where character_id = target_character_id;

  -- Recursos selecionados pelo jogador (ex: dados de vida, inspiração,
  -- espaços de magia de nível 1). Nada é criado se p_resources vier vazio.
  if jsonb_typeof(p_resources) = 'array' then
    for v_resource in select * from jsonb_array_elements(p_resources)
    loop
      if coalesce(v_resource->>'resource_key', '') <> '' then
        insert into character_resources (
          campaign_id, character_id, resource_key, label,
          current_value, max_value, resource_type, recovery_rule
        ) values (
          v_campaign_id, target_character_id,
          v_resource->>'resource_key',
          coalesce(v_resource->>'label', v_resource->>'resource_key'),
          coalesce((v_resource->>'current_value')::int, 0),
          coalesce((v_resource->>'max_value')::int, 0),
          coalesce(v_resource->>'resource_type', 'custom'),
          v_resource->>'recovery_rule'
        )
        on conflict (character_id, resource_key) do update set
          label = excluded.label,
          current_value = excluded.current_value,
          max_value = excluded.max_value,
          resource_type = excluded.resource_type,
          recovery_rule = excluded.recovery_rule;
      end if;
    end loop;
  end if;

  -- Itens iniciais (Etapa 5). Nada é criado se p_items vier vazio
  -- ("Adicionar depois").
  if jsonb_typeof(p_items) = 'array' then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      if coalesce(v_item->>'name', '') <> '' then
        insert into items (campaign_id, name, item_type, description, visibility, status, created_by)
        values (
          v_campaign_id,
          v_item->>'name',
          v_item->>'item_type',
          v_item->>'description',
          'party',
          'available',
          auth.uid()
        )
        returning id into v_item_id;

        insert into character_items (campaign_id, character_id, item_id, quantity, equipped)
        values (v_campaign_id, target_character_id, v_item_id, 1, coalesce((v_item->>'equipped')::boolean, true));
      end if;
    end loop;
  end if;

  perform set_config('cronofabula.allow_initial_setup', 'false', true);

  select * into v_character from characters where id = target_character_id;
  return v_character;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function complete_character_initial_setup(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Expor npcs.image_url em get_campaign_npcs (TAREFA 5 — token/imagem de NPC)
-- ----------------------------------------------------------------------------

-- A coluna image_url já consta na definição de 0009 neste repositório, mas o
-- banco em produção foi criado a partir de uma versão anterior do arquivo que
-- não a incluía. Garantimos aqui que ela exista antes de expô-la na RPC.
alter table npcs add column if not exists image_url text;

-- O retorno (OUT params) mudou em relação à versão anterior (ganhou image_url),
-- então create or replace não é suficiente: precisamos dropar a função antes.
drop function if exists get_campaign_npcs(uuid);

create or replace function get_campaign_npcs(target_campaign_id uuid)
returns table (
  id uuid,
  campaign_id uuid,
  name text,
  role text,
  description text,
  personality text,
  goals text,
  secrets text,
  knowledge jsonb,
  relationship_status text,
  current_location_id uuid,
  current_scene_id uuid,
  visibility text,
  status text,
  image_url text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
) as $$
  select
    n.id,
    n.campaign_id,
    n.name,
    n.role,
    n.description,
    n.personality,
    n.goals,
    case when is_campaign_master(n.campaign_id) then n.secrets else null end as secrets,
    n.knowledge,
    n.relationship_status,
    n.current_location_id,
    n.current_scene_id,
    n.visibility,
    n.status,
    n.image_url,
    n.created_by,
    n.created_at,
    n.updated_at
  from npcs n
  where n.campaign_id = target_campaign_id
    and (
      is_campaign_master(n.campaign_id)
      or (
        is_campaign_member(n.campaign_id)
        and n.visibility in ('public', 'visible')
      )
      or (
        is_campaign_member(n.campaign_id)
        and n.current_scene_id is not null
        and is_scene_participant(n.current_scene_id)
        and n.visibility in ('public', 'visible', 'scene')
      )
    )
  order by n.name asc;
$$ language sql stable security definer set search_path = public;

grant execute on function get_campaign_npcs(uuid) to authenticated;
