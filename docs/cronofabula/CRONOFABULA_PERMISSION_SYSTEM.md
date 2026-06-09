# CRONOFÁBULA — PERMISSION SYSTEM

## 1. Resumo Executivo

Este documento define o sistema de permissões do **Cronofábula**.

O objetivo é garantir que cada usuário veja e altere apenas aquilo que seu papel permite e aquilo que seu personagem realmente pode acessar dentro da campanha.

A regra central é:

> O usuário pertence à campanha, mas o personagem pertence à cena.  
> O mestre vê o mundo inteiro.  
> O jogador vê apenas o que seu personagem pode ver, ouvir, carregar, lembrar ou consultar.

O sistema de permissões precisa proteger:

- campanhas;
- personagens;
- cenas;
- mensagens;
- mapa vivo;
- locais secretos;
- NPCs;
- inventário;
- diário;
- mapa como item;
- conhecimento individual;
- combate;
- crônicas;
- aprovações;
- IA;
- mídia;
- configurações.

---

## 2. Papéis Oficiais

## 2.1 Owner

Criador/dono da campanha.

Pode:

- tudo que o mestre pode;
- excluir campanha;
- transferir propriedade;
- alterar permissões de mestres;
- arquivar campanha;
- gerenciar membros;
- alterar configurações críticas.

---

## 2.2 Master

Mestre principal.

Pode:

- controlar campanha;
- narrar;
- criar sessões;
- criar cenas;
- controlar mapa;
- revelar/ocultar locais;
- criar/editar NPCs;
- controlar NPCs;
- iniciar combate;
- encerrar combate;
- aprovar personagens;
- aprovar itens;
- aprovar crônicas;
- aprovar recompensas;
- ver segredos;
- ver contexto da IA;
- corrigir IA.

---

## 2.3 Assistant Master

Mestre auxiliar.

Pode receber permissões específicas.

Permissões possíveis:

- controlar NPCs;
- narrar cenas;
- mover personagens;
- editar mapa;
- controlar combate;
- revisar aprovações;
- criar conteúdo com IA;
- ver segredos.

Por padrão, não deve poder:

- excluir campanha;
- remover owner;
- alterar configurações críticas;
- apagar crônicas canônicas;
- transferir campanha.

---

## 2.4 Player

Jogador.

Pode:

- acessar campanhas onde é membro;
- criar personagem;
- controlar seus personagens;
- participar de cenas onde seu personagem está;
- falar/agir;
- rolar dados;
- registrar dado físico;
- interagir com NPCs presentes;
- consultar seu inventário;
- consultar diário acessível;
- consultar mapa acessível;
- anotar no diário;
- anotar no mapa, se possuir mapa;
- compartilhar informação;
- relatar verdade/meia verdade/mentira;
- iniciar jornada solo, se permitido;
- enviar mudanças para aprovação.

Não pode:

- ver segredos do mestre;
- ver locais secretos não descobertos;
- ver cenas privadas de outros;
- editar NPCs oficiais;
- editar mapa oficial;
- aprovar recompensas;
- aprovar crônicas;
- alterar configurações da campanha;
- ver conhecimento de outros personagens não compartilhado.

---

## 2.5 Spectator

Espectador.

Uso futuro.

Pode:

- assistir cenas públicas autorizadas;
- ver crônicas aprovadas;
- ver personagens públicos, se permitido.

Não pode:

- agir;
- rolar dados oficiais;
- acessar segredos;
- participar de cenas privadas;
- editar qualquer dado.

---

## 2.6 IA

A IA não é membro humano, mas precisa ter permissões lógicas.

A IA pode:

- ler contexto filtrado;
- narrar cena;
- interpretar NPC;
- gerar sugestão;
- resumir sessão;
- sugerir mapa;
- sugerir item;
- narrar combate.

A IA não pode:

- acessar tudo livremente;
- revelar segredo;
- aprovar conteúdo;
- mover personagem oficialmente;
- alterar inventário oficialmente;
- alterar mapa oficialmente;
- transformar sugestão em cânone;
- ignorar permissões.

---

# 3. Princípios de Acesso

## 3.1 Acesso por campanha

Usuário só acessa dados de uma campanha se estiver em `campaign_members`.

Regra:

```txt
Sem membership ativa, sem acesso.
```

---

## 3.2 Acesso por papel

Depois de verificar membership, o sistema verifica papel:

```txt
owner
master
assistant_master
player
spectator
```

---

## 3.3 Acesso por personagem

Para jogadores, muitas permissões dependem do personagem ativo.

Exemplo:

- ver cena;
- acessar diário;
- anotar no mapa;
- ver conhecimento;
- mover-se;
- conversar com NPC.

---

## 3.4 Acesso por cena

O jogador só vê mensagens da cena se seu personagem participa daquela cena ou se a mensagem foi compartilhada/publicada.

---

## 3.5 Acesso por item

Diário e mapa são itens.

O jogador só acessa:

- diário se o personagem tem o item;
- mapa/anotações se o personagem tem o item;
- documento se o personagem possui ou está vendo o documento.

---

## 3.6 Acesso por conhecimento

O personagem só sabe o que:

- viu;
- ouviu;
- anotou;
- recebeu;
- foi compartilhado;
- descobriu;
- estudou;
- o mestre tornou público.

---

# 4. Matriz Geral de Permissões

| Recurso | Owner | Master | Assistant | Player | Spectator | IA |
|---|---:|---:|---:|---:|---:|---:|
| Ver campanha | Sim | Sim | Sim | Sim | Limitado | Contexto filtrado |
| Editar campanha | Sim | Sim | Parcial | Não | Não | Não |
| Excluir campanha | Sim | Não | Não | Não | Não | Não |
| Criar sessão | Sim | Sim | Se permitido | Não | Não | Sugere |
| Entrar em sessão | Sim | Sim | Sim | Sim | Se permitido | Contexto |
| Ver cena pública | Sim | Sim | Sim | Se presente | Se permitido | Contexto |
| Ver cena privada | Sim | Sim | Se permitido | Se presente | Não | Se filtrado |
| Criar cena | Sim | Sim | Se permitido | Solicita | Não | Sugere |
| Ver segredo | Sim | Sim | Se permitido | Não | Não | Só se autorizado |
| Criar NPC | Sim | Sim | Se permitido | Solicita | Não | Sugere |
| Editar NPC | Sim | Sim | Se permitido | Não | Não | Não |
| Controlar NPC | Sim | Sim | Se permitido | Não | Não | Interpreta |
| Criar mapa | Sim | Sim | Se permitido | Não | Não | Sugere |
| Editar mapa | Sim | Sim | Se permitido | Não | Não | Não |
| Anotar mapa | Sim | Sim | Sim | Se tiver mapa | Não | Não |
| Ver diário | Sim | Sim | Se permitido | Se tiver acesso | Não | Só filtrado |
| Aprovar item | Sim | Sim | Se permitido | Não | Não | Não |
| Aprovar crônica | Sim | Sim | Se permitido | Não | Não | Não |
| Iniciar combate | Sim | Sim | Se permitido | Solicita | Não | Sugere |
| Controlar combate | Sim | Sim | Se permitido | Seu turno | Não | Narra |
| Ver contexto IA | Sim | Sim | Se permitido | Não | Não | N/A |

---

# 5. Permissões por Área

## 5.1 Dashboard

### Player

Pode ver:

- campanhas onde participa;
- seus personagens;
- convites recebidos;
- jornadas solo próprias;
- últimas crônicas aprovadas.

### Master

Além disso, vê:

- aprovações pendentes;
- sessões a preparar;
- alertas de campanha;
- sugestões da IA pendentes.

---

## 5.2 Campanhas

### Player

Pode:

- abrir campanha;
- ver visão geral autorizada;
- ver jogadores;
- ver sua ficha;
- ver crônicas aprovadas.

Não pode:

- editar configurações;
- remover membros;
- ver segredos.

### Master

Pode:

- editar campanha;
- convidar/remover membros;
- gerenciar permissões;
- configurar IA;
- configurar jornada solo;
- configurar diário/mapa.

---

## 5.3 Personagens

### Player

Pode:

- criar personagem;
- editar personagem em rascunho;
- solicitar alteração;
- ver seus personagens;
- ver dados públicos de personagens da campanha.

Não pode:

- editar personagem de outro jogador;
- aprovar personagem;
- alterar nível sem aprovação.

### Master

Pode:

- ver todos os personagens;
- aprovar;
- editar se necessário;
- aplicar condições;
- subir nível;
- marcar morto/inativo.

---

## 5.4 Mesa Viva

### Player

Pode:

- ver cena onde seu personagem está;
- falar;
- agir;
- rolar dado;
- interagir com NPC presente;
- anotar no diário se acessível;
- pedir movimento;
- compartilhar informação;
- enviar sussurro ao mestre.

Não pode:

- ver cenas onde não está;
- ver sussurros de outros;
- ver ações secretas de outros;
- ver narração em segredo de outro personagem.

### Master

Pode:

- ver todas as cenas;
- narrar para todos;
- narrar para cena;
- narrar em segredo;
- criar cena;
- mover personagens;
- adicionar/remover NPC;
- definir quem vê/ouve;
- pausar IA;
- corrigir IA.

---

## 5.5 Mapa Vivo

### Player

Pode ver:

- localização do personagem;
- locais conhecidos;
- pontos revelados;
- caminhos conhecidos;
- NPCs visíveis;
- anotações em mapas que possui.

Pode fazer:

- mover-se por caminhos conhecidos;
- pedir investigação;
- anotar no mapa se tem item mapa;
- compartilhar mapa se está com ele.

Não pode:

- ver locais secretos;
- ver mapa real do mestre;
- editar pontos oficiais;
- revelar local sem gatilho.

### Master

Pode:

- ver todos os mapas;
- ver locais secretos;
- criar pontos;
- conectar pontos;
- ocultar/revelar locais;
- mover personagens/NPCs;
- criar mapa interno;
- importar imagem;
- aprovar sugestão da IA.

---

## 5.6 Mesa de Combate

### Player

Pode:

- ver combate onde seu personagem participa;
- agir no próprio turno;
- rolar dado;
- informar dado físico;
- falar;
- usar item;
- atacar;
- mover por zona;
- encerrar turno.

Não pode:

- alterar PV livremente;
- alterar CA;
- alterar inimigos;
- pular turno de outro;
- encerrar combate;
- aplicar recompensa.

### Master

Pode:

- iniciar combate;
- adicionar/remover inimigos;
- editar PV/CA;
- aplicar/remover condições;
- reordenar iniciativa;
- pausar;
- forçar evento;
- encerrar combate;
- aprovar recompensas.

### IA

Pode:

- narrar resultados;
- sugerir falas de inimigos;
- sugerir eventos.

Não pode:

- alterar resultado calculado;
- matar personagem sem regra;
- criar inimigo oficial;
- mudar dano.

---

## 5.7 NPCs

### Player

Pode:

- ver NPCs conhecidos;
- ver NPCs presentes na cena;
- conversar com NPC presente;
- ver relação conhecida do seu personagem com o NPC.

Não pode:

- ver segredos do NPC;
- ver objetivos ocultos;
- editar NPC;
- mover NPC oficialmente.

### Master

Pode:

- criar;
- editar;
- mover;
- ocultar;
- revelar;
- assumir fala;
- devolver para IA;
- registrar segredo;
- alterar status.

---

## 5.8 Inventário

### Player

Pode:

- ver itens do seu personagem;
- usar item;
- transferir item, se permitido;
- ver descrição conhecida;
- ver história conhecida;
- solicitar identificação.

Não pode:

- ver propriedades ocultas;
- editar segredo do item;
- criar item oficial sem aprovação;
- transferir item que não possui.

### Master

Pode:

- ver todos os itens;
- ver propriedades ocultas;
- criar;
- editar;
- aprovar;
- transferir;
- remover;
- revelar propriedades.

---

## 5.9 Diário

### Player

Pode acessar diário se:

- diário está com o personagem;
- diário está em local acessível;
- outro personagem mostrou;
- mestre permitiu.

Não pode acessar se:

- diário está perdido;
- diário foi roubado;
- diário foi destruído;
- diário está com NPC;
- diário está oculto;
- diário está com outro personagem que não compartilhou.

### Master

Pode ver por segurança narrativa.

### Regra especial

Se o diário for perdido, o sistema não deve mostrar anotações ao jogador.

---

## 5.10 Crônicas

### Player

Pode ver:

- crônicas aprovadas;
- resumos públicos;
- eventos canônicos públicos;
- crônicas do próprio personagem, se autorizadas.

Não pode ver:

- rascunhos do mestre;
- segredos;
- resumo com informações não descobertas.

### Master

Pode:

- gerar;
- editar;
- aprovar;
- arquivar;
- transformar em memória.

---

## 5.11 IA Mestre

### Player

Pode usar IA limitada:

- pedir regra;
- pedir explicação;
- talvez pedir ajuda narrativa do próprio personagem;
- interagir com NPC autorizado.

Não pode:

- ver contexto bruto da IA;
- pedir segredos;
- gerar mapa oficial;
- criar evento canônico;
- gerar recompensas oficiais.

### Master

Pode:

- ver contexto da IA;
- gerar sessão;
- gerar mapa;
- gerar NPC;
- gerar consequência;
- resumir sessão;
- corrigir memória;
- aprovar sugestão.

---

## 5.12 Aprovações

### Player

Pode:

- enviar solicitação;
- ver status das próprias solicitações;
- comentar se permitido.

Não pode:

- aprovar;
- rejeitar;
- ajustar oficialmente.

### Master

Pode:

- aprovar;
- rejeitar;
- ajustar;
- marcar parcial;
- comentar;
- ver origem.

---

# 6. Regras de Visibilidade

## 6.1 Mensagens

Mensagens podem ter visibilidade:

```txt
scene
private
party
public
master_only
off
```

### scene

Visto por participantes da cena.

### private

Visto por remetente, destinatário e mestre.

### party

Visto pelo grupo autorizado.

### public

Visto por todos da campanha.

### master_only

Visto apenas por mestre/owner/auxiliar autorizado.

### off

Chat fora do personagem. Não vira conhecimento do personagem.

---

## 6.2 Cenas

Cenas podem ser:

```txt
participants
private
public
master_only
```

Jogador só vê cena se:

- personagem está na cena;
- cena é pública para campanha;
- mestre adicionou o personagem;
- informação foi compartilhada.

---

## 6.3 Locais

Locais podem ser:

```txt
visible
hidden
secret
master_only
```

### visible

Jogadores autorizados podem ver.

### hidden

Existe, mas ainda não foi revelado.

### secret

Totalmente invisível até descoberta.

### master_only

Só mestre.

---

## 6.4 Itens

Itens podem ter:

```txt
available
lost
stolen
destroyed
hidden
with_other
pending_approval
```

Jogador só vê detalhes conhecidos de itens acessíveis.

---

## 6.5 Conhecimento

Conhecimento pode ser:

```txt
private
party
public
master_only
```

O sistema deve registrar quem sabe o quê.

---

# 7. Regras Especiais

## 7.1 Diário como item

Acesso ao diário depende de:

- `journals.access_status`;
- posse do item em `character_items`;
- permissão do mestre.

Se `access_status` não for `available`, bloquear para jogador.

---

## 7.2 Mapa como item

Anotações no mapa dependem de:

- personagem possuir item do tipo `map`;
- `player_map_items.access_status = available`.

Sem mapa, sem anotação.

---

## 7.3 Local secreto

Local secreto só se torna visível se:

- mestre revelar;
- teste passar;
- NPC revelar;
- item correto for usado;
- evento acontecer;
- IA sugerir e mestre aprovar.

---

## 7.4 Conhecimento compartilhado

Quando um jogador compartilha informação, o sistema cria conhecimento para os destinatários com o conteúdo relatado.

Se o jogador mentir, o sistema registra a mentira como conhecimento dos ouvintes.

---

## 7.5 IA nunca recebe mais do que o usuário pode acessar

Exceto quando chamada pelo mestre.

Para jogador:

```txt
IA recebe apenas contexto permitido ao personagem/jogador.
```

Para mestre:

```txt
IA pode receber contexto de mestre, mas deve marcar segredos claramente.
```

---

# 8. RLS Base no Supabase

## 8.1 Função: is_campaign_member

```sql
create or replace function is_campaign_member(campaign uuid)
returns boolean as $$
  select exists (
    select 1
    from campaign_members
    where campaign_id = campaign
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer;
```

---

## 8.2 Função: is_campaign_master

```sql
create or replace function is_campaign_master(campaign uuid)
returns boolean as $$
  select exists (
    select 1
    from campaign_members
    where campaign_id = campaign
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'master', 'assistant_master')
  );
$$ language sql security definer;
```

---

## 8.3 Função: is_campaign_owner

```sql
create or replace function is_campaign_owner(campaign uuid)
returns boolean as $$
  select exists (
    select 1
    from campaigns
    where id = campaign
      and owner_id = auth.uid()
  );
$$ language sql security definer;
```

---

## 8.4 Função: owns_character

```sql
create or replace function owns_character(character uuid)
returns boolean as $$
  select exists (
    select 1
    from characters
    where id = character
      and owner_user_id = auth.uid()
  );
$$ language sql security definer;
```

---

## 8.5 Política base por campaign_id

Exemplo genérico:

```sql
create policy "Campaign members can read campaign records"
on table_name
for select
using (is_campaign_member(campaign_id));
```

Exemplo para mestre editar:

```sql
create policy "Masters can update campaign records"
on table_name
for update
using (is_campaign_master(campaign_id));
```

---

# 9. Onde usar API/Server em vez de só RLS

Algumas regras são complexas demais para RLS puro.

Devem ser validadas em API/server actions:

- abrir diário;
- anotar no mapa;
- revelar local secreto;
- mover personagem;
- filtrar contexto da IA;
- acessar cena privada;
- compartilhar conhecimento;
- iniciar combate;
- aplicar dano;
- aprovar recompensas;
- gerar resumo canônico.

Motivo:

Essas ações dependem de múltiplas tabelas, estado narrativo e regras condicionais.

---

# 10. Funções de Permissão no Código

Criar utilitários:

```ts
canViewCampaign(userId, campaignId)
canEditCampaign(userId, campaignId)
canViewScene(userId, sceneId)
canSendMessage(userId, sceneId, characterId)
canMoveCharacter(userId, characterId, targetNodeId)
canViewMapNode(userId, characterId, nodeId)
canAnnotateMap(userId, characterId, mapId)
canOpenJournal(userId, characterId, journalId)
canViewItem(userId, characterId, itemId)
canApproveRequest(userId, approvalId)
canStartCombat(userId, campaignId)
canTakeCombatTurn(userId, combatParticipantId)
canCallAI(userId, mode, context)
```

---

# 11. BuildAIContext e Permissões

Antes de montar contexto para IA, validar:

```txt
Usuário pertence à campanha?
Usuário pode acessar cena?
Personagem está na cena?
NPC está presente?
Local está visível?
Diário está disponível?
Mapa está disponível?
Conhecimento é permitido?
Segredo pode ser enviado?
```

Se qualquer item falhar:

```txt
Não enviar à IA.
```

---

# 12. Políticas por Tabela — Direção

## campaigns

- membros podem ler;
- owner/master pode editar;
- owner pode excluir/arquivar.

## campaign_members

- membros podem ver lista básica;
- mestre pode convidar/remover;
- owner pode alterar papel crítico.

## characters

- mestre vê todos;
- jogador vê próprios completos;
- jogadores veem versão pública dos personagens da campanha;
- edição do jogador pode exigir aprovação.

## sessions/scenes

- membros podem ver sessões autorizadas;
- jogador só vê cenas onde participa;
- mestre vê todas.

## scene_messages

- mestre vê todas da campanha;
- jogador vê mensagens da cena onde participa ou mensagens destinadas a ele;
- private só remetente/destinatário/mestre;
- master_only só mestre.

## maps/map_nodes/map_edges

- mestre vê todos;
- jogador vê visíveis/conhecidos;
- secretos invisíveis.

## items/character_items

- mestre vê todos;
- jogador vê itens próprios e compartilhados;
- propriedades ocultas só mestre.

## journals/journal_entries

- mestre vê todos;
- jogador só vê se diário acessível;
- se perdido/roubado/destruído, bloquear.

## approval_requests

- mestre vê todas;
- jogador vê próprias.

## ai_context_snapshots

- mestre vê;
- jogador não vê contexto bruto.

---

# 13. MVP de Permissões

Para o MVP, implementar primeiro:

## Obrigatório

- membership por campanha;
- master vs player;
- player controla só seus personagens;
- mestre vê tudo;
- jogador só vê cenas onde participa;
- mensagem privada;
- diário bloqueado se perdido;
- mapa secreto invisível;
- aprovação por mestre;
- IA com contexto filtrado.

## Pode ficar para fase 2

- spectator;
- permissões granulares de assistant master;
- RLS muito refinado por conhecimento;
- múltiplos mestres com níveis diferentes;
- visibilidade avançada por audição/distância;
- logs completos de auditoria;
- permissões por documento específico.

---

# 14. Testes de Permissão

## Teste 1 — Jogador fora da campanha

Resultado esperado:

```txt
Não consegue abrir campanha.
Não consegue ver personagens.
Não consegue ver sessões.
```

## Teste 2 — Jogador em cena A

Resultado esperado:

```txt
Vê mensagens da cena A.
Não vê mensagens da cena B.
Mestre vê ambas.
```

## Teste 3 — Conversa privada com NPC

Resultado esperado:

```txt
Jogador participante vê.
Mestre vê.
Outros jogadores não veem.
```

## Teste 4 — Diário perdido

Resultado esperado:

```txt
Jogador não acessa anotações.
Mestre ainda acessa.
Ao recuperar diário, jogador volta a acessar.
```

## Teste 5 — Mapa secreto

Resultado esperado:

```txt
Jogador não vê local secreto.
Mestre vê.
Após descoberta, local aparece para personagem autorizado.
```

## Teste 6 — IA de jogador

Resultado esperado:

```txt
IA não recebe segredos.
IA não recebe cenas de outros.
IA não recebe diário perdido.
```

## Teste 7 — IA de mestre

Resultado esperado:

```txt
IA pode receber contexto amplo, mas segredos são marcados como segredos do mestre.
```

## Teste 8 — Aprovação de item

Resultado esperado:

```txt
Jogador solicita item/recompensa.
Item fica pending_approval.
Mestre aprova.
Item entra no inventário oficial.
```

---

# 15. Riscos e Mitigações

## Risco 1 — RLS insuficiente

Mitigação:

- RLS base + validações server-side;
- nunca confiar apenas no frontend.

## Risco 2 — IA vazar segredo

Mitigação:

- buildAIContext rigoroso;
- snapshots de contexto;
- botão Ver Contexto da IA;
- logs;
- testes automatizados.

## Risco 3 — Jogador ver cena errada

Mitigação:

- scene_participants;
- filtros por personagem ativo;
- mensagens com visibility;
- testes de permissão.

## Risco 4 — Diário/mapa parecer bugado

Mitigação:

- mostrar mensagem narrativa clara.

Exemplo:

```txt
Você não está com seu diário. Última vez visto: Pousada do Cervo Torto.
```

## Risco 5 — Mestre auxiliar com poder excessivo

Mitigação:

- permissões granulares na fase 2;
- no MVP, assistant_master com poderes simples ou desativado.

---

# 16. Decisão Oficial

```txt
Cronofábula terá permissões baseadas em campanha, papel, personagem, cena, item e conhecimento.
O mestre vê o estado completo da campanha.
O jogador vê apenas o que seu personagem pode acessar.
Diário e mapa são itens com controle real de acesso.
Locais secretos são invisíveis até descoberta.
IA sempre recebe contexto filtrado.
RLS será usado para segurança base e API/server actions para regras narrativas complexas.
```

---

# 17. Próximos Passos

Após este documento, os próximos passos técnicos são:

```txt
CRONOFABULA_SQL_MIGRATIONS_PLAN.md
CRONOFABULA_PROGRAM_GUIDE.md
```

Ordem recomendada:

1. Criar migrations SQL por fase.
2. Criar funções RLS básicas.
3. Criar helpers de permissão no código.
4. Criar testes de permissão.
5. Implementar buildAIContext com validação.
