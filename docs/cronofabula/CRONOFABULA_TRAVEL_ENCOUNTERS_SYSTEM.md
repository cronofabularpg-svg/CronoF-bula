# CRONOFÁBULA — TRAVEL ENCOUNTERS SYSTEM

## 1. Resumo Executivo

Este documento define o sistema de **Encontros de Viagem** do **Mapa Vivo** no Cronofábula.

O objetivo é tornar o deslocamento entre pontos do mapa mais imersivo, sem transformar viagens em deslocamentos automáticos e sem permitir que eventos aleatórios quebrem a segurança narrativa da campanha.

A regra central é:

> A viagem pode gerar narrativa, rolagem e sugestão de evento.  
> Mas item, combate, descoberta, NPC oficial ou consequência canônica precisam de validação do sistema e/ou aprovação do mestre.

Fluxo oficial:

```txt
Jogador solicita viagem
↓
Sistema valida conexão e permissão
↓
Sistema registra estado de viagem
↓
Sistema rola encontro
↓
Sistema mostra overlay/modal narrativo
↓
Mestre aprova ou ajusta consequência
↓
Sistema aplica resultado permitido
↓
Personagem chega ao destino ou a viagem é interrompida
```

---

# 2. Objetivo do Sistema

O sistema de Encontros de Viagem existe para:

- tornar o Mapa Vivo mais dinâmico;
- criar sensação de mundo vivo;
- gerar eventos entre locais;
- permitir descobertas controladas;
- conectar exploração, inventário, diálogo e combate;
- registrar acontecimentos relevantes;
- preservar o controle do mestre.

Não existe para:

- substituir o mestre;
- criar recompensas automáticas;
- iniciar combate sem aprovação;
- revelar locais secretos sem gatilho;
- criar NPCs oficiais sem validação;
- alterar inventário sem controle;
- mover personagens ignorando permissões.

---

# 3. Regras Obrigatórias

## 3.1 O sistema controla

```txt
conexões do mapa
permissão de movimento
estado da viagem
rolagem
resultado mecânico
posição dos personagens
criação de eventos pendentes
histórico de dados
aprovações
```

## 3.2 A IA controla

```txt
narração do caminho
descrição sensorial
clima do encontro
fala sugerida de viajante
descrição de item encontrado
gancho narrativo
resumo do acontecimento
```

## 3.3 O mestre controla

```txt
aprovar consequência
iniciar combate
aceitar item
revelar local secreto
transformar viajante em NPC oficial
tornar evento canônico
editar resultado
ignorar encontro
```

---

# 4. Tipos de Encontro

## 4.1 Tranquilo

Resultado narrativo sem incidente relevante.

Exemplo:

```txt
O grupo atravessa a estrada sem encontrar ameaças. O vento frio acompanha a marcha, mas nada interrompe o caminho.
```

Pode:

- gerar descrição;
- registrar viagem simples;
- mover personagem ao destino.

Não precisa obrigatoriamente de aprovação do mestre, se a campanha permitir viagem automática.

---

## 4.2 Diálogo / Evento Social

Um viajante, mercador, patrulha, animal estranho, mensageiro, criança perdida, peregrino ou evento social aparece.

Pode:

- abrir cena rápida;
- gerar fala de NPC temporário;
- gerar rumor;
- sugerir missão;
- criar conhecimento pendente.

Não pode automaticamente:

- criar NPC oficial;
- revelar segredo;
- entregar informação crítica;
- alterar facção;
- criar missão canônica.

---

## 4.3 Item / Descoberta

O grupo encontra objeto, pista, documento, recurso, fragmento de mapa ou sinal físico.

Pode:

- gerar sugestão de item;
- criar aprovação de recompensa;
- criar evento de descoberta;
- sugerir anotação no diário/mapa;
- gerar item pendente.

Não pode automaticamente:

- adicionar item ao inventário;
- revelar propriedade oculta;
- conceder item raro;
- adicionar ouro/XP;
- revelar mapa secreto sem gatilho.

---

## 4.4 Combate / Emboscada

Uma ameaça interrompe a viagem.

Pode:

- sugerir combate;
- criar evento pendente;
- abrir preparação de Mesa de Combate;
- gerar inimigos temporários;
- pedir confirmação do mestre.

Não pode automaticamente:

- iniciar combate;
- criar inimigos oficiais;
- aplicar dano;
- mover personagens para combate;
- gerar recompensa;
- matar personagem.

---

# 5. Tabela Base de Rolagem

## 5.1 Tabela MVP

```txt
1-8   Tranquilo
9-13  Diálogo / Evento Social
14-17 Item / Descoberta
18-20 Combate / Emboscada
```

## 5.2 Observação de balanceamento

A chance de combate nessa tabela é de 15%.

Isso pode ser alto para campanhas mais narrativas. Portanto, a tabela deve ser configurável por:

```txt
tipo de mapa
tipo de conexão
nível de perigo da região
estado da campanha
decisão do mestre
configuração da campanha
```

---

# 6. Modificadores Recomendados

## 6.1 Por tipo de caminho

```txt
Estrada segura: -3 na rolagem de encontro
Estrada comum: sem modificador
Floresta perigosa: +2
Ruínas antigas: +3
Território inimigo: +4
Masmorra: +5
```

## 6.2 Por período

```txt
Dia: sem modificador
Noite: +2
Tempestade: +2
Lua cheia / evento mágico: +3
```

## 6.3 Por preparo do grupo

```txt
Guia local: -2
Mapa confiável: -1
Personagem fazendo vigilância: -1
Grupo ferido/cansado: +2
Grupo carregando item valioso: +2
```

## 6.4 Regra

Modificadores só devem ser aplicados se estiverem registrados ou confirmados pelo mestre.

---

# 7. Estados de Viagem

## 7.1 Estados possíveis

```txt
requested
validating
traveling
encounter_pending
encounter_resolved
arrived
interrupted
cancelled
failed
```

## 7.2 Significado

| Estado | Significado |
|---|---|
| `requested` | jogador solicitou deslocamento |
| `validating` | sistema verifica conexão/permissão |
| `traveling` | deslocamento está em andamento |
| `encounter_pending` | encontro sorteado aguarda resolução |
| `encounter_resolved` | encontro resolvido |
| `arrived` | personagem/grupo chegou ao destino |
| `interrupted` | viagem foi interrompida |
| `cancelled` | mestre ou jogador cancelou |
| `failed` | erro, bloqueio ou condição inválida |

---

# 8. Fluxo Detalhado

## 8.1 Solicitar viagem

Jogador clica:

```txt
Viajar
```

O sistema valida:

```txt
personagem pertence ao usuário?
personagem está no ponto atual?
destino é conhecido?
existe conexão?
conexão está bloqueada?
exige chave?
exige teste?
mestre precisa aprovar?
```

Se falhar, mostrar motivo.

---

## 8.2 Iniciar viagem

Se permitido:

```txt
status = traveling
```

Sistema registra:

```txt
campaign_id
session_id
character_id ou group_id
from_node_id
to_node_id
map_edge_id
started_at
```

---

## 8.3 Rolar encontro

Sistema rola:

```txt
1d20 + modificadores
```

Registrar em:

```txt
dice_rolls
```

Campos importantes:

```txt
roll_type = system
formula = 1d20
reason = travel_encounter
visibility = master_only ou scene
```

---

## 8.4 Exibir overlay

Mostrar overlay com:

```txt
ampulheta arcana
linha de deslocamento
ponto de origem
ponto de destino
resultado oculto ou público conforme configuração
texto de viagem
botões de ação
```

---

## 8.5 Resolver resultado

### Tranquilo

Pode concluir viagem automaticamente, se permitido.

### Diálogo

Criar evento pendente ou cena temporária.

### Item

Criar aprovação pendente de item/recompensa.

### Combate

Criar sugestão de combate e aguardar mestre.

---

# 9. Interface do Modal de Encontro

## 9.1 Título

```txt
Encontro no Caminho
```

## 9.2 Conteúdo

Mostrar:

```txt
resultado narrativo
tipo de encontro
rolagem, se visível
local de origem
destino
estado da viagem
ações disponíveis
```

## 9.3 Botões do Mestre

```txt
Aceitar encontro
Ignorar encontro
Editar encontro
Transformar em cena
Iniciar combate
Enviar item para aprovação
Concluir viagem
Interromper viagem
Cancelar viagem
```

## 9.4 Botões do Jogador

```txt
Ver encontro
Responder
Rolar teste
Aguardar mestre
Continuar viagem, se permitido
Registrar no diário
```

## 9.5 Regras de visibilidade

- mestre pode ver rolagem completa;
- jogador pode ver apenas o que o personagem percebe;
- segredos não aparecem;
- encontro pendente não altera estado crítico.

---

# 10. Integração com Mapa Vivo

## 10.1 Antes da viagem

O Mapa Vivo informa:

```txt
local atual
destino
caminho
tipo de conexão
bloqueios
perigos
status de visibilidade
```

## 10.2 Durante a viagem

O personagem pode ter status:

```txt
traveling
```

Se for grupo:

```txt
todos os personagens envolvidos ficam traveling
```

## 10.3 Depois da viagem

Se viagem tranquila:

```txt
character_positions.node_id = destino
status = active
```

Se interrompida:

```txt
character_positions.node_id = ponto intermediário ou origem
status = active/interrupted
```

## 10.4 Locais secretos

Encontro de viagem não pode revelar local secreto automaticamente.

Só pode revelar se:

```txt
mestre aprovar
teste passar
NPC revelar
item correto for usado
evento canônico permitir
```

---

# 11. Integração com Mesa Viva

O encontro pode gerar mensagem na Mesa Viva.

Tipos possíveis:

```txt
system
narration
dice
action
```

Exemplo:

```txt
A viagem de Gob até o Mercado foi interrompida por um som estranho vindo da viela lateral.
```

Regra:

```txt
A mensagem deve respeitar visibilidade da cena.
```

---

# 12. Integração com Dados

Toda rolagem relevante deve ser registrada em `dice_rolls`.

Campos recomendados:

```txt
campaign_id
session_id
scene_id
user_id
character_id
roll_type = system
formula = 1d20
die_type = d20
raw_result
modifier
total
reason = travel_encounter
visibility
created_at
```

---

# 13. Integração com Inventário

## 13.1 Item encontrado

Quando resultado for item, criar:

```txt
approval_request
```

Tipo:

```txt
item_reward
```

Payload sugerido:

```json
{
  "source": "travel_encounter",
  "suggested_item": {
    "name": "Fragmento de Mapa Manchado",
    "item_type": "map",
    "known_description": "Um pedaço de pergaminho úmido com linhas incompletas.",
    "rarity": "common"
  },
  "assign_to_character_id": "uuid"
}
```

## 13.2 Após aprovação

Só após aprovação do mestre:

```txt
criar item em items
criar posse em character_items
registrar scene_event
registrar activity_log
```

---

# 14. Integração com Combate

## 14.1 Emboscada

Resultado 18-20 gera:

```txt
combat_suggestion
```

Não gera combate automaticamente.

## 14.2 Botão do mestre

```txt
Iniciar Combate
```

Ao clicar:

```txt
criar combat
criar combat_participants
vincular scene_id/map_id/node_id
status = setup ou active
```

## 14.3 IA

A IA pode narrar a abertura, mas não calcular dano, iniciativa ou resultado.

---

# 15. Integração com IA

## 15.1 Modo recomendado

Criar modo:

```txt
travel_encounter_narrator
```

Ou usar `narrator` com instrução específica.

## 15.2 Prompt base

```txt
Você é o Narrador de Encontros de Viagem do Cronofábula.

Sua função é narrar um evento de viagem entre dois pontos do Mapa Vivo com base apenas no contexto autorizado pelo sistema.

Regras:
- Não revele locais secretos sem autorização.
- Não crie NPC oficial sem aprovação do mestre.
- Não conceda item, ouro, XP ou recompensa oficialmente.
- Não inicie combate oficialmente.
- Não mova personagens oficialmente.
- Se o encontro sugerir consequência relevante, marque como pendente de aprovação.
- Narre de forma breve, imersiva e clara.
- Respeite o tom da campanha.
```

## 15.3 Contexto mínimo

```json
{
  "mode": "travel_encounter_narrator",
  "campaign": {
    "id": "uuid",
    "tone": "fantasia sombria"
  },
  "session": {
    "id": "uuid",
    "status": "active"
  },
  "travel": {
    "from_node": "Praça Central",
    "to_node": "Docas Nebulosas",
    "edge_type": "road",
    "danger_level": "medium",
    "time_of_day": "night"
  },
  "characters": ["Gob", "Mira"],
  "visible_context": [],
  "roll": {
    "formula": "1d20",
    "raw": 18,
    "modifier": 0,
    "total": 18,
    "result_type": "combat"
  },
  "instructions": [
    "Sugira emboscada sem iniciar combate oficialmente.",
    "Não revele locais secretos.",
    "Marque consequência como pendente do mestre."
  ]
}
```

---

# 16. Banco de Dados Recomendado

## 16.1 travel_events

Tabela opcional, recomendada se o sistema ficar persistente.

```sql
create table travel_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  map_id uuid references maps(id) on delete set null,
  from_node_id uuid references map_nodes(id) on delete set null,
  to_node_id uuid references map_nodes(id) on delete set null,
  map_edge_id uuid references map_edges(id) on delete set null,
  initiated_by uuid references profiles(id),
  character_id uuid references characters(id),
  group_id uuid,
  status text default 'traveling',
  encounter_type text,
  roll_id uuid references dice_rolls(id),
  ai_summary text,
  resolution text,
  approval_request_id uuid references approval_requests(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

## 16.2 Status

```txt
traveling
encounter_pending
resolved
arrived
interrupted
cancelled
```

## 16.3 encounter_type

```txt
none
peaceful
dialogue
item
combat
custom
```

---

# 17. RLS e Permissões

## 17.1 Leitura

Membros da campanha podem ler eventos autorizados.

Mestre lê todos.

Jogador lê se:

```txt
é dono do personagem envolvido
ou personagem está na cena relacionada
ou evento foi tornado público
```

## 17.2 Escrita

Jogador pode solicitar viagem se:

```txt
controla o personagem
personagem está no local de origem
caminho é conhecido
movimento é permitido
```

Mestre pode:

```txt
resolver encontro
editar encontro
ignorar encontro
iniciar combate
aprovar item
concluir/interromper viagem
```

---

# 18. API / Server Actions

## 18.1 Solicitar viagem

```txt
POST /api/map/travel/request
```

Valida:

```txt
membership
personagem
posição atual
conexão
bloqueios
permissões
```

## 18.2 Resolver encontro

```txt
POST /api/map/travel/resolve
```

Apenas mestre ou permissão equivalente.

## 18.3 Concluir viagem

```txt
POST /api/map/travel/complete
```

Valida se:

```txt
encontro resolvido
destino permitido
estado válido
```

## 18.4 Cancelar viagem

```txt
POST /api/map/travel/cancel
```

---

# 19. Componentes Recomendados

```txt
components/map/travel-button.tsx
components/map/travel-overlay.tsx
components/map/travel-encounter-modal.tsx
components/map/travel-event-card.tsx
components/map/travel-result-actions.tsx
components/map/travel-history-panel.tsx
```

## 19.1 Hooks

```txt
hooks/use-travel-request.ts
hooks/use-travel-event.ts
hooks/use-travel-resolution.ts
```

## 19.2 Libs

```txt
lib/map/travel.ts
lib/map/travel-encounter-table.ts
lib/map/travel-permissions.ts
lib/ai/travel-encounter-prompt.ts
```

---

# 20. Critérios de Pronto

```txt
[ ] Viagem entre pontos conectados funciona.
[ ] Sistema bloqueia viagem sem conexão.
[ ] Sistema registra rolagem em dice_rolls.
[ ] Overlay de viagem aparece.
[ ] Modal de encontro aparece.
[ ] Resultado tranquilo conclui viagem conforme configuração.
[ ] Resultado diálogo não cria NPC oficial automaticamente.
[ ] Resultado item cria aprovação pendente.
[ ] Resultado combate não inicia combate sem mestre.
[ ] Local secreto não aparece sem gatilho.
[ ] Jogador não aprova consequência.
[ ] Mestre consegue resolver encontro.
[ ] Posição final é atualizada corretamente.
[ ] Evento relevante aparece em scene_events ou travel_events.
[ ] IA não recebe contexto indevido.
```

---

# 21. Testes Obrigatórios

## 21.1 Teste 1 — Viagem tranquila

```txt
Forçar rolagem 5.
Esperado:
- modal tranquilo;
- personagem chega ao destino;
- dice_rolls registra rolagem;
- sem item;
- sem combate.
```

## 21.2 Teste 2 — Diálogo

```txt
Forçar rolagem 11.
Esperado:
- evento social narrado;
- nenhum NPC oficial criado;
- mestre pode transformar em cena.
```

## 21.3 Teste 3 — Item

```txt
Forçar rolagem 15.
Esperado:
- item sugerido;
- approval_request criada;
- item não entra no inventário antes da aprovação.
```

## 21.4 Teste 4 — Combate

```txt
Forçar rolagem 19.
Esperado:
- emboscada sugerida;
- combate não inicia sozinho;
- botão de iniciar combate disponível apenas para mestre.
```

## 21.5 Teste 5 — Local secreto

```txt
Criar caminho próximo a local secreto.
Forçar encontro de descoberta.
Esperado:
- local secreto não aparece para jogador sem gatilho/aprovação.
```

## 21.6 Teste 6 — Permissão

```txt
Jogador tenta resolver encontro pendente.
Esperado:
- acesso negado.
```

---

# 22. Registro no Changelog

```md
## Data
2026-06-09

## Módulo
Mapa Vivo / Encontros de Viagem

## Problema
O deslocamento entre pontos estava instantâneo e pouco imersivo.

## Solução
Adicionado sistema de encontros de viagem com rolagem 1d20, overlay arcano e modal narrativo.

## Arquivos alterados
Listar arquivos reais alterados após auditoria.

## Tabelas afetadas
dice_rolls
scene_events
travel_events
approval_requests
items
character_items
combats
combat_participants
character_positions

## Riscos
Aplicação automática de itens, combate, revelações ou NPCs sem aprovação do mestre.

## Como testar
Forçar resultados por faixa de rolagem e validar permissões, logs, aprovação e persistência.
```

---

# 23. Decisão Oficial

```txt
O sistema de Encontros de Viagem está aprovado como recurso de imersão do Mapa Vivo, desde que funcione como evento controlado.

Viagens podem gerar rolagem, narração e sugestões.

Itens, combates, descobertas, NPCs oficiais, recompensas e fatos canônicos exigem validação e/ou aprovação do mestre.

O sistema deve registrar rolagens e eventos relevantes para manter a campanha persistente e auditável.
```
