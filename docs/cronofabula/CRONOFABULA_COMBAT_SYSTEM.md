# CRONOFÁBULA — COMBAT SYSTEM

## 1. Resumo Executivo

O sistema de combate do Cronofábula será chamado de **Mesa de Combate**.

A inspiração visual e de fluxo será semelhante ao estilo de **Knights of Pen & Paper**: combate por turnos, personagens e inimigos representados como cartas/miniaturas em uma cena de mesa, sem grid tático no MVP.

A regra principal é:

> O código calcula a luta. A IA narra a luta.

O sistema controla iniciativa, turnos, PV, CA, dano, condições, alvos e ações. A IA interpreta os inimigos, descreve golpes, cria clima e dá vida à cena.

---

## 2. Objetivo da Mesa de Combate

A Mesa de Combate deve permitir que o grupo jogue batalhas de forma simples, visual e rápida, sem transformar o MVP em um VTT complexo.

O objetivo não é começar com grid, linha de visão e automação total de magia.

O objetivo é entregar:

- turnos claros;
- personagens visíveis;
- inimigos visíveis;
- ações por botão;
- dados físicos ou virtuais;
- cálculo básico por código;
- narração por IA;
- controle final do mestre.

---

## 3. Separação entre Mapa Vivo e Mesa de Combate

O **Mapa Vivo** controla exploração, localização e presença.

A **Mesa de Combate** é ativada quando começa uma luta.

Fluxo:

```txt
Mesa Viva / Mapa Vivo
↓
Iniciar Combate
↓
Mesa de Combate
↓
Encerrar Combate
↓
Voltar para Mesa Viva
```

O combate acontece dentro de um local do Mapa Vivo.

Exemplo:

```txt
Combate atual:
Taverna do Cervo Torto → Salão Principal
```

---

## 4. Entrada no Combate

O combate pode começar de três formas.

### 4.1 Mestre inicia

Botão:

```txt
Iniciar Combate
```

O mestre seleciona:

- local;
- personagens envolvidos;
- inimigos;
- obstáculos;
- distância inicial;
- surpresa;
- narrador: mestre ou IA.

### 4.2 IA sugere combate

A IA pode sugerir:

```txt
A situação escalou. Deseja iniciar combate?
```

Botões:

- Iniciar Combate;
- Continuar Narrando;
- Resolver sem Combate.

A IA não inicia combate sozinha sem aprovação do mestre.

### 4.3 Jogador faz ação hostil

Exemplos:

- atacar NPC;
- sacar arma;
- lançar magia ofensiva;
- emboscar;
- derrubar guarda;
- iniciar briga.

O sistema pergunta ao mestre:

```txt
Essa ação inicia combate?
```

Botões:

- Sim, iniciar combate;
- Não, resolver narrativamente;
- Pedir teste antes.

---

## 5. Estrutura Visual

A Mesa de Combate deve parecer uma mesa encenada.

Exemplo simples:

```txt
Jogadores / Heróis        Inimigos / Criaturas

[Kael] [Mira] [Gob]       [Bandido] [Cultista] [Lobo]
```

Exemplo mais detalhado:

```txt
┌──────────────────────────────────────┐
│ Local: Salão Principal da Taverna    │
│ Clima: chuva, gritos e mesas viradas │
├──────────────────────────────────────┤
│              INIMIGOS                │
│        [Cultista] [Mercenário]       │
│                                      │
│              CENA                    │
│     mesas, fogo, porta, balcão       │
│                                      │
│              HERÓIS                  │
│        [Gob] [Dorgan] [Mira] [Kael]  │
└──────────────────────────────────────┘
```

---

## 6. Layout da Tela

### Topo

- nome da batalha;
- local;
- rodada atual;
- turno atual;
- modo: combate ativo;
- botão de pausa;
- botão de encerrar combate.

### Centro

- heróis;
- inimigos;
- cenário;
- obstáculos;
- efeitos ativos.

### Lateral esquerda

- ordem de iniciativa;
- próximo turno;
- personagens/inimigos atrasados ou caídos.

### Lateral direita

- detalhes do alvo selecionado;
- PV;
- CA;
- condições;
- descrição breve;
- ações recentes.

### Rodapé

- ações disponíveis do personagem no turno.

---

## 7. Zonas Táticas no MVP

O MVP não usará grid.

Usará **zonas táticas**.

### Zonas dos heróis

- Frente;
- Meio;
- Retaguarda;
- Oculto;
- Caído/Incapacitado.

### Zonas dos inimigos

- Próximo;
- Médio alcance;
- Distante;
- Elevado;
- Oculto.

Exemplo:

```txt
Dorgan: Frente
Gob: Oculto atrás das mesas
Mira: Retaguarda
Cultista: Próximo
Arqueiro: Distante
```

Isso permite estratégia sem complexidade de grid.

---

## 8. Botões do Jogador

Os botões aparecem principalmente no turno do personagem.

### Atacar

Ataque com arma equipada.

Fluxo:

```txt
Atacar
→ escolher alvo
→ escolher arma
→ escolher dado físico ou virtual
→ calcular acerto
→ aplicar dano se acertar
→ IA narra resultado
```

### Magia

Abre magias disponíveis.

Fluxo:

```txt
Magia
→ escolher magia
→ escolher alvo/área
→ confirmar gasto
→ rolar ataque ou salvaguarda
→ aplicar efeito
→ IA narra
```

No MVP, magia pode ser semiautomática.

### Habilidade

Usa habilidade de classe, raça ou especial.

Exemplos:

- Fúria;
- Ataque Furtivo;
- Canalizar Divindade;
- Inspiração Bárdica;
- Forma Selvagem;
- habilidade racial.

No MVP, pode exigir confirmação do mestre.

### Item

Usa item do inventário.

Exemplos:

- poção de cura;
- bomba goblin improvisada;
- pergaminho;
- corda;
- óleo;
- item mágico.

### Mover-se

Movimento por posição tática.

Opções:

- ir para frente;
- recuar;
- proteger aliado;
- se esconder;
- aproximar do alvo;
- afastar do alvo;
- ir até objeto/cenário.

### Defender

Ação defensiva.

Pode aplicar bônus ou condição temporária conforme regra da mesa.

### Ajudar

Ajuda outro personagem.

Exemplos:

- dar vantagem;
- distrair inimigo;
- puxar aliado ferido;
- abrir caminho.

### Preparar Ação

Define uma condição.

Exemplo:

```txt
Se o cultista tentar fugir, eu ataco.
```

### Interagir com Cenário

Usa elemento do ambiente.

Exemplos:

- virar mesa;
- apagar tocha;
- quebrar janela;
- chutar barril;
- derrubar estante;
- puxar cortina;
- fechar porta.

### Falar

Permite fala curta durante o combate.

Exemplo:

```txt
“Gob, joga essa bomba agora!”
```

### Rolar Dado

Abre rolagem manual/virtual.

### Informar Dado Físico

Registra rolagem feita na vida real.

### Encerrar Turno

Finaliza o turno do jogador.

---

## 9. Botões do Mestre

### Adicionar Inimigo

Coloca criatura nova na luta.

### Remover Inimigo

Remove inimigo morto, fugido ou rendido.

### Editar PV

Ajusta pontos de vida manualmente.

### Editar CA

Ajusta classe de armadura.

### Aplicar Condição

Exemplos:

- Caído;
- Agarrado;
- Envenenado;
- Atordoado;
- Inconsciente;
- Assustado;
- Queimando;
- Oculto.

### Remover Condição

Remove condição ativa.

### Pedir Rolagem

Solicita teste, ataque ou salvaguarda.

### Forçar Evento

Insere evento de batalha.

Exemplos:

- o teto começa a desabar;
- a guarda chega;
- a taverna pega fogo;
- o inimigo tenta fugir;
- reforços entram pela porta.

### Assumir Inimigo

Mestre controla fala e ação do inimigo.

### Devolver Inimigo para IA

IA volta a sugerir falas ou ações narrativas.

### Pausar Combate

Congela turnos temporariamente.

### Reordenar Iniciativa

Ajusta ordem manualmente.

### Encerrar Combate

Finaliza batalha e abre tela de resultado.

---

## 10. Iniciativa

Botão:

```txt
Rolar Iniciativa
```

Opções:

- todos com dado virtual;
- cada jogador informa dado físico;
- mestre rola inimigos;
- mestre edita ordem;
- IA pode sugerir descrição narrativa da abertura, mas não define regra.

Recomendação:

- jogadores podem rolar físico ou virtual;
- inimigos podem ser rolados pelo sistema;
- mestre pode editar ordem.

---

## 11. Dados Físicos e Virtuais

O Cronofábula mantém a experiência de rolar dado real.

Em qualquer rolagem relevante, o jogador escolhe:

- rolar dado virtual;
- informar dado físico.

### Dado físico

Campos:

```txt
tipo de dado
resultado bruto
bônus
total
motivo
personagem
visibilidade
```

### Dado virtual

O sistema gera resultado e registra histórico.

### Histórico obrigatório

Toda rolagem deve salvar:

- personagem;
- jogador;
- sessão;
- combate;
- tipo de dado;
- resultado bruto;
- bônus;
- total;
- motivo;
- virtual ou físico;
- data/hora.

---

## 12. Cálculo por Código

O sistema deve controlar:

- iniciativa;
- turno atual;
- rodada;
- PV;
- CA;
- ataque;
- dano;
- condições;
- vantagem/desvantagem;
- morte/inconsciência;
- alvos válidos;
- distância aproximada por zona;
- ações usadas no turno;
- recursos consumidos.

A IA não deve decidir acerto/erro quando o sistema consegue calcular.

Exemplo:

```txt
Gob atacou o cultista.
Resultado do ataque: 18.
CA do cultista: 14.
Acertou.
Dano: 7.
Cultista ficou com 3 PV.
```

A IA recebe isso e narra:

```txt
Gob salta por cima da mesa com uma risada torta. A lâmina curta encontra uma brecha na armadura do cultista, que cambaleia, ainda de pé, mas visivelmente ferido.
```

---

## 13. Papel da IA no Combate

A IA pode:

- narrar golpes;
- interpretar inimigos;
- sugerir falas de inimigos;
- descrever ambiente;
- descrever consequências;
- sugerir eventos dramáticos;
- resumir a batalha;
- ajudar o mestre a criar inimigos simples.

A IA não pode:

- alterar PV oficialmente sem sistema/mestre;
- criar inimigo oficial sem aprovação;
- matar personagem sem regra/decisão do mestre;
- ignorar turno;
- ignorar iniciativa;
- decidir acerto se o sistema pode calcular;
- revelar informação oculta fora da percepção.

---

## 14. Fim do Combate

Quando inimigos são derrotados, fogem, se rendem ou a cena muda, o mestre clica:

```txt
Encerrar Combate
```

O sistema abre:

# Resultado da Batalha

Mostra:

- inimigos derrotados;
- inimigos fugidos;
- personagens feridos;
- personagens caídos;
- itens encontrados;
- XP ou marco pendente;
- recompensas pendentes;
- condições restantes;
- eventos importantes;
- dano ao ambiente;
- consequências narrativas.

### Botões

- Gerar Resumo da Batalha;
- Adicionar Recompensa;
- Criar Item;
- Atualizar Crônica;
- Marcar Consequência;
- Voltar para Mesa Viva.

A IA ajuda a narrar o encerramento, mas o mestre aprova recompensas.

---

## 15. Recompensas Pós-Combate

As recompensas não devem ser automáticas sem controle.

Tipos:

- ouro;
- item;
- pista;
- documento;
- favor;
- XP;
- marco narrativo;
- acesso a novo local;
- consequência de facção.

O mestre aprova.

Itens importantes devem usar o sistema de **inventário narrativo**, com descrição baseada em como foram obtidos.

Exemplo:

```txt
Adaga Curva do Cultista

Descrição conhecida:
Uma adaga escura retirada do cultista derrotado no salão da Taverna do Cervo Torto.

O que você sabe:
A lâmina tem marcas de fuligem e um símbolo que lembra uma coroa partida.
```

---

## 16. Integração com Mapa Vivo

A Mesa de Combate sempre nasce de um local do Mapa Vivo.

Campos necessários:

```txt
campaign_id
session_id
map_id
node_id
scene_id
combat_id
```

Quando combate termina, o sistema atualiza:

- posição dos personagens;
- status dos NPCs;
- inimigos mortos/fugidos;
- objetos no local;
- locais destruídos ou alterados;
- crônica da sessão;
- possíveis novos caminhos.

---

## 17. Banco de Dados Sugerido

### combats

```txt
id
campaign_id
session_id
scene_id
map_id
node_id
title
status
round_number
current_turn_entity_id
created_by
created_at
ended_at
```

### combat_participants

```txt
id
combat_id
entity_type
character_id
npc_id
enemy_id
display_name
initiative
current_hp
max_hp
armor_class
zone
status
is_player_controlled
is_ai_controlled
created_at
```

### combat_turns

```txt
id
combat_id
round_number
participant_id
turn_order
started_at
ended_at
status
```

### combat_actions

```txt
id
combat_id
turn_id
actor_participant_id
action_type
target_participant_id
description
roll_id
result
damage
created_at
```

### combat_conditions

```txt
id
combat_id
participant_id
condition_name
description
duration_type
remaining_rounds
applied_by
created_at
```

### combat_rewards

```txt
id
combat_id
campaign_id
type
name
description
assigned_to_character_id
approval_status
created_at
```

---

## 18. MVP da Mesa de Combate

O MVP deve incluir:

- iniciar combate;
- encerrar combate;
- iniciativa;
- rodadas;
- turnos;
- personagens em cards;
- inimigos em cards;
- PV;
- CA;
- ataque;
- dano;
- dados físicos/virtuais;
- condições básicas;
- zonas táticas simples;
- IA narrando resultado;
- mestre controlando exceções;
- resultado da batalha.

Fica para fase posterior:

- grid tático;
- linha de visão;
- alcance exato;
- área de magia;
- cobertura;
- iluminação;
- terreno difícil;
- automação completa de magias;
- animações avançadas.

---

## 19. Decisão Oficial

```txt
Cronofábula terá uma Mesa de Combate separada do Mapa Vivo.
A inspiração será Knights of Pen & Paper: combate por turnos, visual de mesa, personagens e inimigos em cards.
No MVP, não haverá grid tático. O sistema usará zonas táticas simples.
O código calculará regra, turno, PV, CA e dano.
A IA será responsável por narração, diálogos de inimigos e clima da batalha.
O mestre terá controle final para ajustar, aprovar e encerrar a luta.
```

---

## 20. Próximos Passos

- Criar protótipo da tela Mesa de Combate.
- Definir schema final no Supabase.
- Criar APIs de combate.
- Criar componente de cards de personagens/inimigos.
- Criar painel de iniciativa.
- Criar registro de rolagens.
- Criar integração com Mesa Viva e Mapa Vivo.
- Criar prompt interno de narração de combate para IA.
