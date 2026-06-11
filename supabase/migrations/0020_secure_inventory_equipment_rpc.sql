-- 0020_secure_inventory_equipment_rpc.sql
-- Fase 10.2: equipar/desequipar item via RPC segura, em vez de UPDATE amplo
-- em character_items.

create or replace function toggle_character_item_equipped(target_character_item_id uuid, target_equipped boolean)
returns character_items as $$
declare
  v_row character_items;
begin
  select * into v_row from character_items where id = target_character_item_id;
  if not found then
    raise exception 'Item de personagem não encontrado';
  end if;

  if v_row.character_id is null
     or not (owns_character(v_row.character_id) or is_campaign_master(v_row.campaign_id)) then
    raise exception 'Sem permissão para alterar este item';
  end if;

  update character_items
  set equipped = target_equipped
  where id = target_character_item_id
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function toggle_character_item_equipped(uuid, boolean) to authenticated;

-- A policy ampla permitia UPDATE de qualquer coluna (quantity, notes, item_id,
-- equipped) desde que o jogador fosse dono do personagem. Agora equipar/
-- desequipar passa pela RPC acima (security definer); a policy ampla é removida.
drop policy if exists "Players toggle equipped on own character items" on character_items;
