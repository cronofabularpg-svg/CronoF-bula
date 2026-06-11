-- 0017_inventory_real_flow.sql
-- Fase 10: Inventário real, entrega de itens e liberação do diário.

-- Jogadores podem ler o registro de um item (mesmo que visibility = 'master_only')
-- quando o item já foi entregue ao personagem que possuem via character_items.
-- Sem isso, o join items + character_items no Inventário do jogador retornaria
-- nulo para itens entregues que ainda são 'master_only' (ex: Diário antes de virar 'party').
create policy "Players read items delivered to their characters"
on items for select
using (
  exists (
    select 1
    from character_items ci
    where ci.item_id = items.id
      and ci.character_id is not null
      and owns_character(ci.character_id)
  )
);

-- Jogadores podem atualizar o estado "equipado" dos próprios character_items
-- (equipar/desequipar). Entrega, criação e remoção de itens continuam restritas
-- ao mestre pela policy "Masters manage character items".
create policy "Players toggle equipped on own character items"
on character_items for update
using (
  character_id is not null
  and owns_character(character_id)
)
with check (
  character_id is not null
  and owns_character(character_id)
);
