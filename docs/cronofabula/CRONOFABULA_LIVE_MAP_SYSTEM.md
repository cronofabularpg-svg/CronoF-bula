# CRONOFÁBULA — LIVE MAP SYSTEM

## 1. Resumo Executivo

O **Mapa Vivo** é o sistema de localização, presença, visibilidade e exploração do Cronofábula.

Ele não deve começar como um grid tático. No MVP, será um **mapa narrativo por pontos conectados**, estilo árvore/teia de locais, onde cada ponto representa uma área, sala, cidade, região, edifício ou ponto de interesse.

A regra principal é:

> O sistema controla onde todos estão. A IA apenas interpreta e narra o que acontece naquele contexto.

Essa decisão reduz uso de tokens, evita que a IA se perca e mantém a campanha consistente.

---

## 2. Objetivo do Mapa Vivo

O Mapa Vivo deve responder com precisão:

- Onde cada personagem está?
- Quem está junto?
- Quem está separado?
- Quais NPCs estão presentes?
- Quais locais já foram descobertos?
- Quais caminhos existem?
- Quais caminhos estão bloqueados?
- Quais locais são secretos?
- O que cada jogador pode ver?
- O que cada personagem pode anotar?
- Que contexto a IA deve receber?

O mapa funciona como uma camada estruturada de estado do mundo.

---

## 3. Regra Arquitetural

### Sistema/Código controla

- mapa;
- pontos;
- conexões;
- localização dos personagens;
- localização dos NPCs;
- visibilidade;
- locais secretos;
- locais descobertos;
- permissões;
- entrada e saída de edifícios;
- acesso a mapas como itens;
- anotações;
- estado das cenas.

### IA controla

- descrição narrativa do local;
- diálogo de NPC;
- clima da cena;
- sugestões de eventos;
- respostas imersivas;
- resumo narrativo;
- apoio ao mestre na criação de mapas.

A IA não deve decidir sozinha localização, revelar locais ocultos ou criar caminhos oficiais sem aprovação do mestre.

---

## 4. Tipo de Mapa no MVP

O MVP usará:

## Mapa Narrativo por Pontos Conectados

Exemplo:

```txt
Cidade de Arvand
│
├── Praça Central
│   ├── Taverna do Cervo Torto
│   ├── Mercado
│   └── Templo Antigo
│
├── Docas Nebulosas
│   ├── Armazém 7
│   ├── Beco dos Fundos
│   └── Farol Quebrado
│
└── Portão Norte
    └── Estrada da Floresta Cinzenta
```

Cada local é um ponto. Cada caminho entre locais é uma conexão.

---

## 5. Pontos Pré-Programados

No início, os pontos do mapa serão definidos pelo mestre antes da sessão.

Exemplo:

```txt
Mapa: Taverna do Cervo Torto

Pontos:
- Salão Principal
- Balcão
- Cozinha
- Quarto Alugado
- Porão
- Beco dos Fundos

Conexões:
- Salão Principal → Balcão
- Salão Principal → Cozinha
- Cozinha → Porão
- Cozinha → Beco dos Fundos
- Salão Principal → Quarto Alugado
```

O sistema usa esses pontos para controlar:

- movimento;
- presença;
- interação;
- visibilidade;
- contexto enviado à IA.

---

## 6. Imagem com Pontos Clicáveis

O mestre poderá enviar uma imagem pronta e marcar pontos clicáveis.

Fluxo:

```txt
Mestre envia imagem do mapa
↓
Sistema salva no Cloudflare R2
↓
Mestre clica em pontos da imagem
↓
Cada ponto vira um node do mapa
↓
Mestre cria conexões entre pontos
↓
Jogadores veem apenas pontos revelados
```

### Botões do mestre nessa tela

- Enviar imagem;
- Adicionar ponto;
- Nomear ponto;
- Editar ponto;
- Conectar pontos;
- Marcar como público;
- Marcar como oculto;
- Marcar como secreto;
- Adicionar NPC;
- Adicionar perigo;
- Adicionar descrição;
- Salvar mapa;
- Mostrar aos jogadores.

---

## 7. Criação de Mapa com IA

O mestre poderá criar mapas com ajuda da IA antes ou durante a sessão.

Exemplo de pedido:

```txt
Crie uma taverna suspeita com 5 áreas, um porão secreto e ligação com as docas.
```

A IA poderá sugerir:

```txt
Taverna do Cervo Torto
- Salão Principal
- Balcão
- Cozinha
- Quarto Alugado
- Porão
- Passagem Secreta para as Docas
```

A IA sugere. O mestre aprova.

O local só entra oficialmente no mapa após:

```txt
Aprovar e Criar no Mapa
```

---

## 8. Entrada em Edifícios

A entrada em edifícios será resolvida por **camadas de mapa**.

Exemplo:

```txt
Mapa Mundo
→ Mapa Região
→ Mapa Cidade
→ Mapa Edifício
→ Mapa Sala/Cena
```

Exemplo prático:

```txt
Costa de Arvand
↓
Cidade de Arvand
↓
Taverna do Cervo Torto
↓
Porão da Taverna
```

### Botões relacionados

- Entrar;
- Sair;
- Criar mapa interno;
- Definir entrada;
- Definir saída;
- Conectar com mapa externo.

Se o personagem está em uma cidade e entra em uma taverna, o sistema abre o mapa interno da taverna.

---

## 9. Locais Secretos

Locais secretos ficam **totalmente invisíveis** até serem descobertos.

Não aparecem como `???`.

Exemplo:

O mestre sabe que existe:

```txt
Passagem Secreta atrás da estante
```

O jogador vê apenas:

```txt
Biblioteca Antiga
```

A passagem só aparece se houver gatilho.

### Gatilhos de descoberta

- teste de Investigação;
- teste de Percepção;
- NPC revela;
- item correto usado;
- evento narrativo;
- decisão do mestre;
- magia ou habilidade adequada.

Exemplo:

```txt
Local secreto:
Passagem para o Armazém 7

Visível para jogadores?
Não.

Como descobrir:
- teste de Investigação CD 15 na parede leste do porão;
- NPC Halvek pode revelar;
- item "Chave de Ferro Enferrujada" abre a passagem.

Contexto para IA:
A IA sabe que a passagem existe, mas não deve revelar sem gatilho.
```

---

## 10. Mapas como Itens do Personagem

Jogadores só podem anotar no mapa se o personagem possuir um mapa, diário, pergaminho, carta ou documento equivalente.

Exemplo de item:

```txt
Mapa Rasgado das Docas
```

Se o personagem possui esse item, ele pode:

- marcar ponto;
- adicionar anotação;
- desenhar rota;
- compartilhar mapa;
- mostrar mapa ao grupo.

Se perder o mapa, perde acesso às marcações daquele mapa até recuperá-lo.

---

## 11. Tipos de Mapa no Jogo

O personagem pode ter mapas diferentes:

- mapa da região;
- mapa da cidade;
- mapa da masmorra;
- mapa do tesouro;
- mapa rabiscado;
- mapa falso;
- mapa incompleto;
- mapa de NPC.

### Qualidade do mapa

- completo;
- parcial;
- antigo;
- impreciso;
- falso;
- danificado.

Isso permite que o mapa seja também uma mecânica narrativa.

---

## 12. Visões Diferentes do Mapa

### Mestre

O mestre vê:

- todos os pontos;
- todos os NPCs;
- locais ocultos;
- passagens secretas;
- cenas privadas;
- inimigos escondidos;
- perigos;
- gatilhos de descoberta.

### Jogador

O jogador vê apenas:

- onde o personagem está;
- quem está com ele;
- locais conhecidos;
- caminhos conhecidos;
- NPCs visíveis;
- marcações feitas em mapas que ele possui;
- localização de aliados apenas quando fizer sentido narrativo.

---

## 13. Botões do Jogador

### Ver Minha Localização

Centraliza o mapa no personagem ativo.

### Ver Cena Atual

Abre a cena/chat ligada ao local atual.

### Mover-se

Solicita deslocamento para outro ponto conhecido.

O sistema verifica:

- existe conexão?
- está bloqueada?
- exige chave?
- exige teste?
- mestre precisa aprovar?

### Entrar

Aparece quando o ponto possui mapa interno.

Exemplo:

- Entrar na Taverna;
- Entrar no Armazém;
- Entrar na Caverna.

### Sair

Volta para o mapa externo.

### Observar Local

Pede descrição do local atual.

A IA pode narrar usando contexto filtrado.

### Investigar Área

Procura detalhes, pistas, passagens ou objetos.

Pode gerar teste.

### Procurar Saídas

Busca conexões disponíveis ou ocultas.

### Chamar Aliado

Chama personagem próximo.

### Marcar no Mapa

Disponível se o personagem tiver um mapa.

### Anotar no Mapa

Adiciona texto em um ponto do mapa.

### Compartilhar Mapa

Permite mostrar marcações a personagens presentes.

### Mostrar ao Grupo

Mostra o mapa ou parte dele na Mesa Viva.

### Guardar Mapa

Fecha o mapa ou remove da tela ativa.

---

## 14. Botões do Mestre

### Criar Mapa

Cria novo mapa narrativo.

### Enviar Imagem Base

Importa imagem para usar como mapa marcado.

### Adicionar Ponto

Cria ponto clicável no mapa.

### Editar Ponto

Altera nome, descrição, status e tipo.

### Conectar Pontos

Cria caminho entre dois locais.

### Criar Mapa Interno

Cria camada interna para edifício, caverna, dungeon ou sala.

### Definir Entrada/Saída

Liga mapa externo ao interno.

Exemplo:

```txt
Cidade → Taverna → Salão Principal
```

### Marcar como Visível

Jogadores podem ver.

### Marcar como Oculto

O local existe, mas ainda não aparece.

### Definir Condição de Descoberta

Exemplos:

- teste de Investigação CD 15;
- NPC revela;
- item necessário;
- evento da história.

### Adicionar NPC ao Ponto

Coloca NPC naquele local.

### Adicionar Perigo

Armadilha, inimigo, obstáculo ou maldição.

### Mover Personagem

Move personagem manualmente.

### Mover Grupo

Move todos os personagens de uma cena.

### Mostrar Mapa aos Jogadores

Exibe o mapa na Mesa Viva.

### Gerar com IA

Pede à IA uma sugestão de pontos, conexões e locais secretos.

### Aprovar Sugestão da IA

Cria oficialmente os pontos sugeridos.

---

## 15. Integração com a Mesa Viva

A Mesa Viva deve ter o Mapa Vivo como painel integrado.

Layout sugerido:

```txt
Centro:
Chat da cena

Direita superior:
Mapa Vivo mini

Direita inferior:
NPCs e objetos presentes

Esquerda:
Personagens na cena

Rodapé:
Falar / Agir / Rolar / Diário / Mover
```

Botão importante:

```txt
Expandir Mapa
```

---

## 16. Recapitulação Usando o Mapa

No início de cada sessão, o resumo deve ser gerado a partir do estado do mapa.

Exemplo:

```txt
Onde vocês estão:
Taverna do Cervo Torto, região das Docas Nebulosas.

Divisão atual:
- Kael e Mira estão no salão principal.
- Gob está no beco dos fundos.
- Dorgan está no quarto alugado.

NPCs conhecidos no local:
- Mirna está no salão.
- Halvek foi visto próximo ao beco.

Objetivo imediato:
Descobrir quem está levando cargas para o Armazém 7.
```

O sistema gera a base com dados estruturados.

A IA apenas transforma em texto narrativo.

---

## 17. Contexto Enviado para a IA

A IA deve receber apenas o contexto filtrado.

Exemplo:

```txt
Cena: Beco dos Fundos
Local: atrás da Taverna do Cervo Torto
Personagem ativo: Gob
NPC presente: Mercador Halvek
Outros jogadores presentes: nenhum
Gob sabe: Mirna citou uma chave escondida
Halvek sabe: existe uma passagem no Armazém 7
Visibilidade: cena privada
Objetivo do jogador: negociar informação
Instrução: responda apenas como Halvek, sem revelar informações que ele não diria naturalmente.
```

Isso reduz tokens e evita alucinação.

---

## 18. Regras da IA no Mapa Vivo

A IA não pode:

- mover personagem oficialmente;
- revelar local oculto sem gatilho;
- criar caminho definitivo sem aprovação;
- mostrar NPC inexistente;
- ignorar posição dos personagens;
- narrar como se todos estivessem juntos quando estão separados;
- entregar conhecimento que o personagem não possui.

A IA pode:

- descrever local conhecido;
- interpretar NPC presente;
- sugerir caminho;
- sugerir evento;
- sugerir perigo;
- gerar mapa para aprovação do mestre;
- narrar descoberta quando o sistema autorizar.

---

## 19. Banco de Dados Sugerido

### maps

```txt
id
campaign_id
name
type
image_url
description
created_by
created_at
```

Tipos:

```txt
world
region
city
building
dungeon
scene
```

### map_nodes

```txt
id
campaign_id
map_id
name
type
description
x
y
visibility_status
is_known
is_secret
discovery_condition
created_at
```

### map_edges

```txt
id
campaign_id
from_node_id
to_node_id
travel_type
is_locked
requires_check
required_key_item_id
description
created_at
```

Tipos de viagem:

```txt
walk
door
secret_passage
road
stairs
portal
boat
tunnel
```

### character_positions

```txt
id
campaign_id
session_id
character_id
map_id
node_id
scene_id
status
updated_at
```

### npc_positions

```txt
id
campaign_id
npc_id
map_id
node_id
scene_id
visibility
status
updated_at
```

### player_map_items

```txt
id
campaign_id
character_id
item_id
map_id
access_status
created_at
```

### map_annotations

```txt
id
campaign_id
map_id
node_id
character_id
created_by
title
content
visibility
requires_item_id
created_at
```

---

## 20. MVP

O MVP deve incluir:

- mapa narrativo simples;
- pontos e conexões;
- locais visíveis/invisíveis;
- mapa interno para edifícios;
- posição dos personagens;
- posição dos NPCs;
- anotações se o personagem tiver mapa;
- IA ajudando mestre a criar pontos;
- contexto filtrado para IA;
- painel de Mapa Vivo dentro da Mesa Viva.

Fica para fase posterior:

- grid de combate;
- linha de visão real;
- distância exata;
- iluminação;
- desenho livre avançado;
- mapas 3D;
- automação complexa de armadilhas.

---

## 21. Decisão Oficial

```txt
Cronofábula terá um Mapa Vivo narrativo por pontos conectados.
Os pontos serão pré-programados pelo mestre, podendo ser criados com ajuda da IA.
O mestre poderá importar imagens e marcar pontos clicáveis.
Jogadores só podem anotar no mapa se seus personagens possuírem mapa físico/digital dentro do jogo.
Locais secretos ficam invisíveis até serem descobertos.
Edifícios funcionam como mapas internos ligados ao mapa externo.
Combate tático será um módulo separado, ativado apenas quando houver luta.
```

---

## 22. Próximos Passos

- Criar protótipo do Mapa Vivo.
- Definir schema final no Supabase.
- Definir APIs de criação/edição de mapa.
- Definir componente visual de mapa por pontos.
- Criar integração com Mesa Viva.
- Criar gerador de mapa com IA controlado pelo mestre.
