# CRONOFÁBULA — MVP ROADMAP

## 1. Resumo Executivo

Este documento define o **roadmap oficial do MVP** do Cronofábula.

O objetivo do MVP é provar que um grupo consegue:

```txt
Criar campanha
Criar personagens
Iniciar sessão
Jogar na Mesa Viva
Interagir com NPCs
Rolar dados físicos ou virtuais
Mover-se pelo Mapa Vivo
Registrar diário/inventário
Gerar crônica
Continuar depois
```

A regra central é:

> O MVP deve ser jogável, seguro e persistente antes de ser visualmente complexo ou mecanicamente completo.

---

# 2. Regra de Ouro do MVP

O Cronofábula não deve tentar ser no primeiro lançamento:

```txt
Roll20 completo
D&D Beyond completo
Discord completo
Notion de campanha completo
Gerador universal de aventuras
IA mestre autônoma
VTT com grid e linha de visão
```

O MVP deve ser:

```txt
Mesa narrativa persistente
Com IA auxiliar
Com mestre no controle
Com dados físicos/virtuais
Com mapa por pontos
Com memória de sessão
Com permissões seguras
```

---

# 3. Critério de Sucesso do MVP

O MVP será considerado bem-sucedido quando:

```txt
Um mestre conseguir criar uma campanha, convidar jogadores, aprovar personagens, abrir uma sessão, narrar uma cena, usar NPC com IA, registrar rolagens, mover personagens no Mapa Vivo, encerrar a sessão e gerar uma crônica aprovada para continuar depois.
```

Critério mínimo jogável:

```txt
1 campanha real
1 mestre
2 jogadores
2 personagens
1 sessão
1 cena
1 NPC
1 rolagem
1 movimento no mapa
1 anotação de diário
1 crônica final
```

---

# 4. Princípios de Desenvolvimento

## 4.1 Segurança antes de velocidade

Toda fase deve respeitar:

- Supabase Auth;
- RLS;
- validação server-side;
- isolamento por campanha;
- permissões por papel;
- contexto filtrado para IA.

## 4.2 Persistência antes de beleza

Antes de polir visualmente, garantir que:

- dados salvam;
- dados carregam;
- permissões funcionam;
- estados são preservados;
- histórico existe.

## 4.3 IA como auxiliar

A IA não pode ser fonte principal de verdade.

Ela pode:

- narrar;
- sugerir;
- resumir;
- interpretar NPC;
- ajudar com regras.

Ela não pode:

- mover oficialmente;
- revelar segredo;
- aprovar recompensa;
- alterar inventário;
- criar cânone sozinha.

## 4.4 Mestre como autoridade final

Tudo que muda o mundo de forma relevante deve ter controle do mestre.

---

# 5. Ordem Oficial de Implementação

```txt
Fase 0 — Preparação do Projeto
Fase 1 — Auth, Perfil e Base Visual
Fase 2 — Campanhas e Membros
Fase 3 — Personagens Básicos
Fase 4 — Sessões, Cenas e Mesa Viva
Fase 5 — Dados Físicos e Virtuais
Fase 6 — NPCs e Diálogo com IA
Fase 7 — IA Narradora e Contexto Filtrado
Fase 8 — Mapa Vivo MVP
Fase 9 — Inventário Narrativo e Diário
Fase 10 — Crônicas e Recapitulação
Fase 11 — Aprovações Básicas
Fase 12 — Mesa de Combate MVP
Fase 13 — Polimento Visual e Beta Fechado
```

---

# 6. Fase 0 — Preparação do Projeto

## Objetivo

Criar a base técnica antes de implementar funcionalidades.

## Entregas

- criar projeto Next.js;
- configurar TypeScript;
- configurar Tailwind;
- configurar Supabase;
- configurar variáveis de ambiente;
- configurar estrutura de pastas;
- adicionar documentação;
- criar layout base;
- adicionar tokens visuais;
- configurar lint/build.

## Arquivos esperados

```txt
.env.example
README.md
/docs/CRONOFABULA_*.md
src/lib/supabase
src/lib/permissions
src/styles/tokens.css
```

## Critérios de pronto

```txt
[ ] Projeto roda localmente
[ ] Build inicial passa
[ ] Variáveis documentadas
[ ] Supabase configurado
[ ] Estrutura de pastas criada
[ ] Documentação inicial presente
```

## Não fazer nesta fase

```txt
Não criar telas complexas
Não criar banco inteiro
Não integrar IA ainda
Não criar combate
```

---

# 7. Fase 1 — Auth, Perfil e Base Visual

## Objetivo

Permitir login, cadastro e criação de perfil.

## Entregas

- login;
- cadastro;
- recuperação de senha;
- logout;
- rota protegida;
- criação automática de profile;
- preferências básicas;
- tela de dashboard vazio;
- aplicação dos tokens visuais.

## Tabelas

```txt
profiles
player_preferences
```

## Rotas

```txt
/login
/signup
/forgot-password
/dashboard
```

## Critérios de pronto

```txt
[ ] Usuário cria conta
[ ] Usuário faz login
[ ] Usuário faz logout
[ ] Profile é criado
[ ] Dashboard protegido funciona
[ ] Usuário sem login é redirecionado
[ ] RLS ativado
```

## Riscos

- profile não ser criado após signup;
- rota protegida falhar;
- RLS bloquear leitura legítima.

---

# 8. Fase 2 — Campanhas e Membros

## Objetivo

Permitir criar campanha e gerenciar membros.

## Entregas

- criar campanha;
- listar campanhas do usuário;
- abrir campanha;
- gerar código de convite;
- entrar por código;
- listar membros;
- definir papel básico;
- configurações iniciais da campanha.

## Tabelas

```txt
campaigns
campaign_members
campaign_settings
```

## Rotas

```txt
/campaigns
/campaigns/[id]/overview
/campaigns/[id]/settings
```

## Critérios de pronto

```txt
[ ] Mestre cria campanha
[ ] Dono entra como owner/master
[ ] Campanha aparece no dashboard
[ ] Usuário entra por convite
[ ] Apenas membros veem campanha
[ ] Apenas mestre edita campanha
[ ] RLS protege campanhas
```

## Riscos

- usuário ver campanha de outro;
- convite permitir acesso indevido;
- owner não ser criado como membro.

---

# 9. Fase 3 — Personagens Básicos

## Objetivo

Permitir criar personagem e vincular à campanha.

## Entregas

- criar personagem;
- listar personagens;
- vincular personagem à campanha;
- aprovar personagem;
- editar ficha básica;
- status do personagem;
- tema visual básico por classe/raça.

## Tabelas

```txt
characters
character_stats
character_conditions
```

## Campos mínimos

```txt
nome
raça
classe
nível
PV
CA
atributos
status
campanha
dono
aprovação
```

## Critérios de pronto

```txt
[ ] Jogador cria personagem
[ ] Personagem aparece para o dono
[ ] Mestre vê personagens da campanha
[ ] Mestre aprova personagem
[ ] Jogador não edita personagem de outro
[ ] Status de aprovação funciona
```

## Não fazer nesta fase

```txt
Não automatizar ficha completa de D&D
Não criar todas as classes
Não criar inventário avançado
Não criar subida de nível complexa
```

---

# 10. Fase 4 — Sessões, Cenas e Mesa Viva

## Objetivo

Criar o centro jogável do MVP.

## Entregas

- criar sessão;
- iniciar sessão;
- criar cena;
- adicionar participantes;
- chat da cena;
- mensagens por tipo;
- visibilidade básica;
- mestre narrar;
- jogador falar/agir;
- realtime básico.

## Tabelas

```txt
sessions
scenes
scene_participants
scene_messages
scene_events
```

## Rotas

```txt
/campaigns/[id]/mesa-viva
```

## Tipos de mensagem MVP

```txt
speech
action
narration
dice
system
off
```

## Visibilidade MVP

```txt
scene
private
public
master_only
off
```

## Critérios de pronto

```txt
[ ] Mestre cria sessão
[ ] Mestre cria cena
[ ] Personagem entra na cena
[ ] Jogador envia fala
[ ] Jogador envia ação
[ ] Mestre narra
[ ] Mensagens persistem
[ ] Jogador só vê cena permitida
[ ] Chat off não vira conhecimento
```

## Riscos

- cenas privadas vazarem;
- chat virar bagunça;
- mensagens sem campaign_id;
- realtime duplicar mensagens.

---

# 11. Fase 5 — Dados Físicos e Virtuais

## Objetivo

Permitir rolagem virtual e registro de dado físico.

## Entregas

- rolar dado virtual;
- informar dado físico;
- salvar histórico;
- mostrar rolagem na cena;
- filtrar por sessão/personagem;
- motivo da rolagem.

## Tabela

```txt
dice_rolls
```

## Fórmulas MVP

```txt
1d20
1d20+mod
1d20 adv
1d20 dis
XdY+mod
```

## Critérios de pronto

```txt
[ ] Jogador rola dado virtual
[ ] Jogador informa dado físico
[ ] Resultado aparece na Mesa Viva
[ ] Histórico salva
[ ] Mestre vê rolagens da sessão
[ ] Rolagem tem motivo quando exigido
```

## Não fazer nesta fase

```txt
Não automatizar todas as regras
Não criar ficha calculada completa
Não criar motor universal de dados complexo
```

---

# 12. Fase 6 — NPCs e Diálogo com IA

## Objetivo

Permitir criar NPCs e usar IA para diálogo controlado.

## Entregas

- criar NPC;
- listar NPCs;
- adicionar NPC à cena;
- mestre assumir NPC;
- IA responder como NPC;
- personalidade, objetivos e conhecimento básico;
- logs de interação.

## Tabelas

```txt
npcs
npc_positions opcional nesta fase
ai_messages
ai_context_snapshots
```

## Critérios de pronto

```txt
[ ] Mestre cria NPC
[ ] NPC aparece na cena
[ ] Jogador interage com NPC presente
[ ] IA responde como NPC
[ ] IA não revela segredo fora do contexto
[ ] Mestre pode assumir fala do NPC
```

## Riscos

- IA revelar segredo;
- NPC responder sem estar presente;
- IA inventar fatos canônicos.

---

# 13. Fase 7 — IA Narradora e Contexto Filtrado

## Objetivo

Centralizar o uso de IA com segurança.

## Entregas

- função `buildAIContext`;
- modos de IA MVP;
- narrador de cena;
- assistente de regras;
- resumo simples;
- logs;
- snapshots de contexto;
- botão “Ver contexto da IA” para mestre.

## Modos MVP

```txt
narrator
npc_dialogue
rules_helper
session_summary
```

## Tabelas

```txt
ai_tasks
ai_messages
ai_generated_suggestions
ai_context_snapshots
```

## Critérios de pronto

```txt
[ ] Toda chamada IA passa por buildAIContext
[ ] Contexto é filtrado por permissão
[ ] Jogador não recebe segredo
[ ] Mestre pode ver contexto enviado
[ ] IA registra logs
[ ] Sugestões não viram cânone sozinhas
```

## Regra crítica

```txt
Nunca enviar campanha inteira para IA.
```

---

# 14. Fase 8 — Mapa Vivo MVP

## Objetivo

Controlar localização e movimento por pontos conectados.

## Entregas

- criar mapa;
- criar pontos;
- conectar pontos;
- mover personagem;
- posição atual;
- NPC em ponto;
- local visível/oculto/secreto;
- mini mapa na Mesa Viva;
- descrição de local com IA.

## Tabelas

```txt
maps
map_nodes
map_edges
character_positions
npc_positions
```

## Critérios de pronto

```txt
[ ] Mestre cria mapa
[ ] Mestre cria pontos
[ ] Mestre conecta pontos
[ ] Personagem tem posição
[ ] Jogador vê localização
[ ] Jogador solicita movimento
[ ] Mestre pode mover personagem
[ ] Local secreto não aparece para jogador
[ ] IA respeita localização
```

## Não fazer nesta fase

```txt
Não criar grid
Não criar linha de visão
Não criar iluminação dinâmica
Não criar medição tática complexa
```

---

# 15. Fase 9 — Inventário Narrativo e Diário

## Objetivo

Implementar itens, diário e mapa como objetos narrativos.

## Entregas

- criar item;
- dar item a personagem;
- ver inventário;
- criar diário como item;
- criar entrada de diário;
- bloquear diário perdido;
- criar item de mapa;
- anotar no mapa se possuir mapa;
- transferir item básico.

## Tabelas

```txt
items
character_items
journals
journal_entries
player_map_items
map_annotations
```

## Critérios de pronto

```txt
[ ] Mestre cria item
[ ] Personagem recebe item
[ ] Jogador vê inventário próprio
[ ] Diário existe como item
[ ] Jogador anota no diário
[ ] Diário perdido bloqueia acesso
[ ] Mapa como item permite anotação
[ ] Sem mapa, jogador não anota no mapa
```

## Riscos

- diário virar botão sempre disponível;
- jogador ver propriedades ocultas;
- mapa funcionar sem item.

---

# 16. Fase 10 — Crônicas e Recapitulação

## Objetivo

Transformar sessão em memória aprovada.

## Entregas

- gerar resumo da sessão;
- editar resumo;
- aprovar crônica;
- listar crônicas;
- recapitulação inicial;
- eventos canônicos;
- memória básica da campanha.

## Tabelas

```txt
chronicles
canon_events
campaign_memory
```

## Critérios de pronto

```txt
[ ] Mestre gera resumo
[ ] Mestre edita resumo
[ ] Mestre aprova crônica
[ ] Jogadores veem crônicas aprovadas
[ ] Segredos não descobertos não aparecem para jogadores
[ ] Próxima sessão usa recapitulação
```

## Riscos

- IA transformar rumor em fato;
- crônica revelar segredo;
- resumo não separar público/privado.

---

# 17. Fase 11 — Aprovações Básicas

## Objetivo

Criar central para validar mudanças importantes.

## Entregas

- listar aprovações;
- aprovar/rejeitar;
- aprovar personagem;
- aprovar item;
- aprovar recompensa;
- aprovar crônica;
- comentários básicos.

## Tabelas

```txt
approval_requests
approval_comments
```

## Tipos MVP

```txt
character_approval
item_reward
chronicle_approval
solo_event
map_discovery
canon_event
```

## Critérios de pronto

```txt
[ ] Jogador envia solicitação
[ ] Mestre vê pendências
[ ] Mestre aprova
[ ] Mestre rejeita
[ ] Status muda corretamente
[ ] Ação aprovada aplica efeito
```

## Riscos

- aprovação aplicar efeito duas vezes;
- jogador aprovar própria solicitação;
- efeito ocorrer antes da aprovação.

---

# 18. Fase 12 — Mesa de Combate MVP

## Objetivo

Criar combate simples por turnos, sem grid.

## Entregas

- iniciar combate a partir de cena;
- adicionar participantes;
- rolar iniciativa;
- ordem de turno;
- PV;
- CA;
- ataque básico;
- dano;
- condições básicas;
- zonas;
- encerrar combate;
- IA narrar resultado calculado.

## Tabelas

```txt
combats
combat_participants
combat_turns
combat_actions
combat_conditions
combat_rewards
```

## Ações MVP

```txt
Atacar
Mover-se por zona
Defender
Ajudar
Usar item
Falar
Rolar dado
Encerrar turno
```

## Critérios de pronto

```txt
[ ] Mestre inicia combate
[ ] Participantes aparecem
[ ] Iniciativa funciona
[ ] Turno ativo é claro
[ ] Jogador age no próprio turno
[ ] Sistema calcula acerto/dano básico
[ ] IA apenas narra resultado
[ ] Mestre encerra combate
[ ] Recompensas ficam pendentes
```

## Não fazer nesta fase

```txt
Não criar grid
Não automatizar todas as magias
Não criar IA controlando combate sozinha
Não criar balanceamento automático complexo
```

---

# 19. Fase 13 — Polimento Visual e Beta Fechado

## Objetivo

Preparar o MVP para teste com grupo real.

## Entregas

- aplicar tokens visuais;
- melhorar responsividade;
- corrigir fluxos confusos;
- mensagens de erro;
- loading states;
- empty states;
- logs;
- checklist de segurança;
- beta fechado.

## Critérios de pronto

```txt
[ ] Mobile aceitável
[ ] Mesa Viva usável
[ ] Mapa Vivo compreensível
[ ] IA não vaza contexto
[ ] Mestre entende controles
[ ] Jogador entende ações
[ ] Build passa
[ ] Erros críticos corrigidos
```

---

# 20. O Que Não Entra no MVP

```txt
Grid tático completo
Linha de visão
Iluminação dinâmica
Automação completa de magias
Marketplace
Sistema público de campanhas
App mobile nativo
Integração com Discord
Integração com WhatsApp
Exportação para PDF/livro
Geração de imagem dentro do app
Todas as raças e classes estilizadas
Sistema econômico complexo
Múltiplos sistemas de RPG totalmente automatizados
Campanhas públicas ranqueadas
Assinaturas e billing
```

---

# 21. Migrations por Fase

## Ordem recomendada

```txt
0001_extensions_and_helpers.sql
0002_profiles_and_preferences.sql
0003_campaigns_and_members.sql
0004_campaign_settings_and_rls.sql
0005_characters_core.sql
0006_sessions_and_scenes.sql
0007_scene_messages_and_events.sql
0008_dice_rolls.sql
0009_npcs_and_locations.sql
0010_ai_core.sql
0011_live_map.sql
0012_inventory_and_journals.sql
0013_chronicles_and_memory.sql
0014_approvals.sql
0015_combat_core.sql
0016_media_assets.sql
0017_activity_log.sql
0018_indexes_and_constraints.sql
0019_seed_ai_tasks.sql
0020_mvp_validation_views.sql
```

Regra:

```txt
Não criar migrations futuras antes de validar a fase atual, salvo quando a dependência for obrigatória.
```

---

# 22. Checklist Antes de Avançar de Fase

```txt
[ ] Build passa
[ ] Lint passa
[ ] RLS ativado nas tabelas da fase
[ ] APIs validam membership
[ ] APIs validam papel
[ ] Dados têm campaign_id quando necessário
[ ] Não há mock em tabela real
[ ] IA não recebe contexto indevido
[ ] Logs úteis existem
[ ] Documentação atualizada
[ ] Teste manual feito com usuário mestre
[ ] Teste manual feito com usuário jogador
```

---

# 23. Riscos Gerais

## 23.1 Escopo crescer demais

Mitigação:

```txt
Seguir fases. Não antecipar combate avançado, temas avançados ou automações complexas.
```

## 23.2 IA revelar segredo

Mitigação:

```txt
buildAIContext obrigatório, snapshots de contexto e botão Ver Contexto da IA para mestre.
```

## 23.3 Permissões frágeis

Mitigação:

```txt
RLS + validação server-side. Nunca confiar apenas no frontend.
```

## 23.4 Banco complexo demais

Mitigação:

```txt
Migrations pequenas por fase.
```

## 23.5 Mestre perder controle

Mitigação:

```txt
Aprovações, correção de IA e autoridade final do mestre em todas as mudanças canônicas.
```

---

# 24. Plano de Teste do MVP

## Cenário 1 — Mestre cria campanha

```txt
Criar conta
Criar campanha
Configurar IA
Criar sessão
Abrir Mesa Viva
```

## Cenário 2 — Jogador entra

```txt
Criar conta
Inserir convite
Criar personagem
Enviar para aprovação
Mestre aprova
Jogador entra na Mesa Viva
```

## Cenário 3 — Cena narrativa

```txt
Mestre cria cena
Adiciona personagens
Adiciona NPC
Jogador fala
Jogador age
IA narra
Mestre corrige se necessário
```

## Cenário 4 — Dados

```txt
Jogador rola 1d20 virtual
Jogador informa dado físico
Mestre vê histórico
Rolagem aparece na cena
```

## Cenário 5 — Mapa Vivo

```txt
Mestre cria mapa
Cria pontos
Move personagem
Jogador vê local atual
Local secreto permanece invisível
```

## Cenário 6 — Diário

```txt
Jogador anota no diário
Mestre marca diário como perdido
Jogador tenta abrir diário
Sistema bloqueia acesso
```

## Cenário 7 — Crônica

```txt
Mestre encerra sessão
IA gera resumo
Mestre edita
Mestre aprova
Jogadores veem crônica pública
```

## Cenário 8 — Combate MVP

```txt
Mestre inicia combate
Adiciona inimigo
Rola iniciativa
Jogador ataca
Sistema calcula
IA narra
Mestre encerra combate
Recompensa fica pendente
```

---

# 25. Marcos do MVP

## Marco 1 — Base Segura

Inclui:

```txt
Auth
Perfil
Campanhas
Membros
Personagens
```

Resultado:

```txt
Usuários conseguem entrar, criar campanha e personagens.
```

## Marco 2 — Mesa Jogável

Inclui:

```txt
Sessões
Cenas
Mesa Viva
Mensagens
Dados
NPCs básicos
```

Resultado:

```txt
Grupo consegue jogar uma cena.
```

## Marco 3 — IA Controlada

Inclui:

```txt
buildAIContext
NPC com IA
Narrador
Regras
Resumo
Logs
```

Resultado:

```txt
IA auxilia sem virar dona da campanha.
```

## Marco 4 — Mundo Persistente

Inclui:

```txt
Mapa Vivo
Inventário
Diário
Crônicas
Aprovações
```

Resultado:

```txt
Campanha continua entre sessões.
```

## Marco 5 — Combate MVP

Inclui:

```txt
Mesa de Combate
Turnos
PV/CA
Ataque/dano
Zonas
IA narrando
```

Resultado:

```txt
Grupo resolve combate simples no sistema.
```

## Marco 6 — Beta Fechado

Inclui:

```txt
Polimento
Correções
Responsividade
Logs
Validação com grupo real
```

Resultado:

```txt
MVP pronto para uso controlado.
```

---

# 26. Decisão Oficial

```txt
O desenvolvimento do Cronofábula seguirá fases pequenas, seguras e testáveis.

A Mesa Viva, o Mapa Vivo e o controle de permissões são mais importantes que estética avançada ou combate complexo no início.

A IA só será implementada com contexto filtrado, logs e autoridade final do mestre.

O MVP será lançado quando for possível jogar uma campanha curta de ponta a ponta, com persistência, crônica e continuidade.
```
