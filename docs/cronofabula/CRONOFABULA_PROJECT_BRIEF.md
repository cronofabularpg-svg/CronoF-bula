# CRONOFÁBULA — PROJECT BRIEF

## 1. Resumo Executivo

O **Cronofábula** é uma plataforma de RPG com IA para campanhas persistentes.

Ele foi pensado para resolver um problema comum em grupos de RPG: a dificuldade de reunir todos os jogadores com frequência. O sistema permite que a campanha continue viva mesmo quando o grupo não consegue se encontrar sempre no mesmo horário.

A proposta é unir:

- RPG de mesa;
- campanhas persistentes;
- IA como narradora auxiliar;
- mestre humano com controle final;
- dados físicos e virtuais;
- mapa narrativo por pontos;
- diário e mapa como itens do personagem;
- combate simples por turnos;
- crônicas e memória da campanha.

Frase central:

```txt
Quando o tempo separa a mesa, a fábula continua.
```

Slogan:

```txt
Sua campanha viva no tempo de cada jogador.
```

---

## 2. Problema que o Produto Resolve

Grupos de RPG frequentemente enfrentam:

- dificuldade de agenda;
- perda de continuidade entre sessões;
- esquecimento de eventos importantes;
- mestre sobrecarregado;
- jogadores que gostariam de interagir com o mundo fora da sessão principal;
- campanhas que morrem por falta de organização;
- dificuldade de jogar remotamente mantendo clima de mesa.

O Cronofábula resolve isso criando uma plataforma onde:

- a campanha fica salva;
- o mundo continua organizado;
- a IA ajuda a narrar e lembrar contexto;
- o mestre continua no controle;
- os jogadores podem jogar presencialmente ou online;
- sessões solo podem existir sem quebrar a campanha;
- a história fica registrada em crônicas.

---

## 3. Conceito do Produto

O Cronofábula é uma **mesa viva de RPG com IA**, onde cada campanha possui:

- personagens;
- sessões;
- cenas;
- NPCs;
- mapas;
- inventários;
- diários;
- crônicas;
- histórico de dados;
- combate;
- memória;
- aprovações do mestre.

A IA não substitui o mestre. Ela auxilia.

A regra central é:

```txt
O sistema controla o estado do mundo.
A IA interpreta o mundo.
O mestre aprova o que vira canônico.
O jogador só acessa o que o personagem pode acessar.
```

---

## 4. Público-Alvo Inicial

O público inicial são:

- grupos de RPG de mesa;
- mestres que querem organizar campanhas;
- jogadores que não conseguem se reunir sempre;
- grupos que jogam online;
- pessoas que querem aventuras solo conectadas à campanha;
- narradores que querem IA como apoio, não como substituição.

---

## 5. Diferenciais do Cronofábula

## 5.1 Campanha Persistente

A campanha não depende apenas da memória dos jogadores.

O sistema salva:

- cenas;
- decisões;
- diálogos importantes;
- mapas;
- NPCs;
- itens;
- rolagens;
- crônicas.

---

## 5.2 IA Contextual e Controlada

A IA recebe apenas o contexto necessário.

Ela não deve saber tudo indiscriminadamente quando responde a um jogador.

Isso reduz:

- metagame;
- vazamento de segredo;
- respostas erradas;
- confusão narrativa.

---

## 5.3 Mestre com Controle Final

O mestre pode:

- aprovar eventos;
- corrigir a IA;
- revelar/ocultar locais;
- controlar NPCs;
- aprovar recompensas;
- validar crônicas;
- decidir o que é canônico.

---

## 5.4 Mapa Vivo

O Mapa Vivo começa simples, por pontos conectados.

Exemplo:

```txt
Cidade
├── Taverna
│   ├── Salão
│   ├── Cozinha
│   └── Porão secreto
└── Docas
    └── Armazém 7
```

Ele controla:

- onde cada personagem está;
- onde cada NPC está;
- quem pode ver quem;
- quais locais são secretos;
- que contexto a IA deve receber.

---

## 5.5 Diário e Mapa como Itens

O diário e o mapa não são apenas funções do sistema.

Eles existem dentro do jogo como itens.

Se o personagem perde o diário, o jogador perde acesso às anotações até recuperar.

Se o personagem não tem mapa, não pode anotar no mapa.

Isso cria imersão e consequência narrativa.

---

## 5.6 Dados Físicos e Virtuais

O jogador pode:

- rolar dado virtual;
- informar resultado de dado físico.

Assim, o sistema preserva a experiência de RPG de mesa.

---

## 5.7 Combate Inspirado em Knights of Pen & Paper

O combate começa como uma **Mesa de Combate** simples:

- personagens em cards;
- inimigos em cards;
- turnos;
- iniciativa;
- PV;
- CA;
- zonas táticas;
- narração por IA.

Não começa como grid tático complexo.

---

## 6. MVP do Produto

O MVP precisa provar que o grupo consegue jogar uma campanha com IA de forma persistente.

## 6.1 Entra no MVP

- autenticação;
- criação de campanha;
- membros;
- personagens básicos;
- Mesa Viva com chat;
- sessões e cenas;
- dados físicos e virtuais;
- NPCs;
- IA para diálogo de NPC;
- IA narradora;
- Mapa Vivo por pontos;
- inventário narrativo básico;
- diário como item;
- recapitulação;
- crônicas;
- aprovações básicas;
- Mesa de Combate simples;
- tema visual base.

---

## 6.2 Não entra no MVP

- grid tático completo;
- linha de visão;
- iluminação;
- magias totalmente automatizadas;
- app mobile nativo;
- marketplace;
- exportação em livro/PDF;
- integração com Discord/WhatsApp;
- geração de imagens dentro do sistema;
- todas as combinações visuais de classe + raça;
- automação completa de D&D.

---

## 7. Stack Recomendada

```txt
Frontend: Next.js
Backend: Next.js API Routes / Server Actions
Banco: Supabase Postgres
Auth: Supabase Auth
Realtime: Supabase Realtime
Storage de mídia: Cloudflare R2
IA inicial: Groq
Deploy: Vercel
Estilo: Tailwind
```

---

## 8. Módulos Principais

## 8.1 Área Global

- Dashboard;
- Campanhas;
- Personagens;
- Jornada Solo;
- Biblioteca;
- Convites;
- Perfil;
- Configurações.

---

## 8.2 Área da Campanha

- Visão Geral;
- Mesa Viva;
- Mapa Vivo;
- Mesa de Combate;
- Personagens;
- NPCs;
- Locais;
- Missões;
- Inventário;
- Diário;
- Mídias;
- Crônicas;
- Dados;
- IA Mestre;
- Aprovações;
- Configurações.

---

## 9. Ordem Recomendada de Desenvolvimento

```txt
0. Preparação do projeto
1. Auth e perfil
2. Campanhas e membros
3. Personagens básicos
4. Mesa Viva básica
5. Dados físicos e virtuais
6. NPCs básicos e diálogo com IA
7. IA narradora básica
8. Mapa Vivo MVP
9. Inventário narrativo e diário
10. Recapitulação e crônicas
11. Aprovações básicas
12. Mesa de Combate MVP
13. Polimento visual MVP
```

---

## 10. Documentos Técnicos Oficiais

O projeto possui os seguintes documentos oficiais:

```txt
CRONOFABULA_THEME_SYSTEM.md
CRONOFABULA_LIVE_MAP_SYSTEM.md
CRONOFABULA_COMBAT_SYSTEM.md
CRONOFABULA_NAVIGATION_AND_ACTIONS.md
CRONOFABULA_DATABASE_SCHEMA.md
CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
CRONOFABULA_MVP_ROADMAP.md
CRONOFABULA_PERMISSION_SYSTEM.md
CRONOFABULA_PROGRAM_GUIDE.md
CRONOFABULA_PROJECT_BRIEF.md
```

---

## 11. Como Usar a Documentação

Para entender o produto:

```txt
CRONOFABULA_PROJECT_BRIEF.md
```

Para desenvolver sem quebrar o projeto:

```txt
CRONOFABULA_PROGRAM_GUIDE.md
```

Para entender telas e botões:

```txt
CRONOFABULA_NAVIGATION_AND_ACTIONS.md
```

Para banco de dados:

```txt
CRONOFABULA_DATABASE_SCHEMA.md
```

Para IA e prompts:

```txt
CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
```

Para permissões:

```txt
CRONOFABULA_PERMISSION_SYSTEM.md
```

Para roadmap:

```txt
CRONOFABULA_MVP_ROADMAP.md
```

Para identidade visual:

```txt
CRONOFABULA_THEME_SYSTEM.md
```

---

## 12. Critério de Sucesso do MVP

O MVP será considerado bem-sucedido se:

```txt
Um grupo conseguir criar uma campanha, criar personagens, iniciar uma sessão, jogar em uma Mesa Viva, interagir com NPCs via IA, rolar dados, se mover pelo Mapa Vivo, registrar anotações no diário, encerrar a sessão e gerar uma crônica para continuar depois.
```

---

## 13. Riscos Principais

## 13.1 Escopo grande demais

Risco:

```txt
Tentar criar um Roll20 + D&D Beyond + IA completa logo no início.
```

Mitigação:

```txt
MVP simples, por fases.
```

---

## 13.2 IA revelar segredo

Risco:

```txt
IA receber contexto demais e entregar informação que o jogador não deveria saber.
```

Mitigação:

```txt
buildAIContext com filtros rígidos.
```

---

## 13.3 Banco complexo demais

Risco:

```txt
Criar todas as tabelas e regras antes de validar a experiência.
```

Mitigação:

```txt
Migrations por fase.
```

---

## 13.4 Mestre perder controle

Risco:

```txt
IA ou jogadores mudarem o mundo sem aprovação.
```

Mitigação:

```txt
Sistema de aprovações e mestre como autoridade final.
```

---

## 13.5 Combate atrasar o MVP

Risco:

```txt
Automatizar combate demais.
```

Mitigação:

```txt
Combate por cards e zonas, sem grid no início.
```

---

## 14. Decisão Oficial do Produto

```txt
Cronofábula será uma plataforma independente, com IA contextual e campanhas persistentes.

O foco inicial não é substituir o RPG de mesa, mas prolongar a mesa no tempo de cada jogador.

A primeira versão deve ser jogável, segura e persistente antes de ser visualmente complexa ou mecanicamente completa.
```

---

## 15. Próximo Passo Técnico

Depois deste brief, o próximo passo prático é criar:

```txt
CRONOFABULA_SQL_MIGRATIONS_PLAN.md
```

Esse arquivo deve transformar o schema em uma sequência segura de migrations para Supabase.
