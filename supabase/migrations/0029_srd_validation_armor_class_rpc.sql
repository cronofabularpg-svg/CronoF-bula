-- 0029_srd_validation_armor_class_rpc.sql
-- Fase 12: validação de Setup Inicial D&D/SRD na Ficha (TAREFA 5).
--
-- A Ficha agora pode sugerir uma Classe de Armadura recalculada a partir do
-- equipamento equipado (armor/shield com properties.ac/base_ac/ac_bonus/
-- dex_cap) + DEX. Após o setup inicial, characters.armor_class é um "campo
-- crítico" travado pelo trigger lock_character_critical_fields (0019/0028)
-- para quem não é mestre — então o jogador não consegue aplicar essa
-- sugestão com um update direto.
--
-- Esta RPC reaproveita o mesmo escape hatch (cronofabula.allow_initial_setup)
-- já usado por complete_character_initial_setup, mas apenas para o campo
-- armor_class, mediante ação explícita do mestre ou do dono do personagem
-- (botão "Aplicar CA sugerida"). Não altera RLS nem desativa os triggers.

create or replace function apply_character_armor_class(
  target_character_id uuid,
  new_armor_class int
)
returns characters as $$
declare
  v_campaign_id uuid;
  v_character characters;
begin
  if new_armor_class is null then
    raise exception 'Classe de Armadura inválida.';
  end if;

  select campaign_id into v_campaign_id from characters where id = target_character_id;

  if v_campaign_id is null then
    raise exception 'Personagem não encontrado.';
  end if;

  if not is_campaign_master(v_campaign_id) and not owns_character(target_character_id) then
    raise exception 'Sem permissão para ajustar a CA deste personagem.';
  end if;

  perform set_config('cronofabula.allow_initial_setup', 'true', true);

  update characters set armor_class = new_armor_class where id = target_character_id;

  perform set_config('cronofabula.allow_initial_setup', 'false', true);

  select * into v_character from characters where id = target_character_id;
  return v_character;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function apply_character_armor_class(uuid, int) to authenticated;
