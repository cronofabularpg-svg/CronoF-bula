# CRONOFÁBULA — PROGRAM GUIDE

## 1. Resumo Executivo

Este é o **guia mestre de desenvolvimento** do projeto **Cronofábula**.

Ele deve ser lido antes de qualquer alteração no sistema.

O objetivo deste documento é orientar qualquer IA, programador ou colaborador a desenvolver o Cronofábula sem quebrar:

- segurança;
- permissões;
- banco de dados;
- experiência de jogo;
- contexto da IA;
- separação entre sistema e IA;
- lógica de cena;
- Mapa Vivo;
- Mesa de Combate;
- diário e mapa como itens;
- conhecimento limitado por personagem.

A regra principal do projeto é:

> O sistema controla o estado do mundo.  
> A IA interpreta o mundo.  
> O mestre aprova o que vira canônico.  
> O jogador só acessa o que o personagem pode acessar.

---

## 2. Identidade do Projeto

## 2.1 Nome

```txt
Cronofábula
```

## 2.2 Slogan

```txt
Sua campanha viva no tempo de cada jogador.
```

## 2.3 Conceito

Cronofábula é uma plataforma de RPG com IA para campanhas persistentes.

Ela foi criada para grupos que não conseguem se reunir com frequência, permitindo:

- jogar à distância;
- salvar a história;
- manter campanhas vivas;
- permitir que o mestre jogue com auxílio da IA;
- usar dados físicos ou virtuais;
- controlar mapa, cenas, NPCs, inventário e crônicas;
- permitir aventuras solo controladas;
- respeitar conhecimento limitado por personagem.

---

## 3. Documentos Oficiais do Projeto

Antes de programar, consulte estes arquivos:

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
```

## Função de cada documento

### CRONOFABULA_THEME_SYSTEM.md

Define:

- identidade visual;
- paleta;
- logo;
- tipografia;
- temas por classe;
- temas por raça;
- tema Goblin;
- combinações especiais.

### CRONOFABULA_LIVE_MAP_SYSTEM.md

Define:

- Mapa Vivo;
- pontos conectados;
- mapas internos;
- locais secretos;
- anotações em mapa;
- imagem com pontos clicáveis;
- mapa como item.

### CRONOFABULA_COMBAT_SYSTEM.md

Define:

- Mesa de Combate;
- inspiração em Knights of Pen & Paper;
- turnos;
- zonas;
- dados;
- ações;
- mestre;
- IA narrando combate.

### CRONOFABULA_NAVIGATION_AND_ACTIONS.md

Define:

- abas;
- botões;
- fluxos;
- ações do jogador;
- ações do mestre;
- integração entre módulos.

### CRONOFABULA_DATABASE_SCHEMA.md

Define:

- tabelas;
- relações;
- campos;
- estrutura Supabase/Postgres;
- fases do banco;
- RLS base.

### CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md

Define:

- papéis da IA;
- prompts internos;
- contexto filtrado;
- regras anti-metagame;
- diálogo de NPC;
- narração;
- combate;
- resumos.

### CRONOFABULA_MVP_ROADMAP.md

Define:

- fases do MVP;
- ordem de desenvolvimento;
- validação;
- escopo;
- o que entra e o que não entra.

### CRONOFABULA_PERMISSION_SYSTEM.md

Define:

- papéis;
- permissões;
- visibilidade;
- acesso por cena;
- acesso por item;
- acesso por conhecimento;
- RLS e validações server-side.

---

# 4. Regra de Ouro do Desenvolvimento

Antes de criar ou alterar qualquer funcionalidade, responda:

```txt
1. Isso respeita as permissões?
2. Isso respeita o conhecimento limitado do personagem?
3. Isso respeita o Mapa Vivo?
4. Isso respeita a cena atual?
5. Isso impede a IA de revelar segredos?
6. Isso mantém o mestre como autoridade final?
7. Isso salva estado no banco?
8. Isso é necessário para o MVP ou pode ficar para depois?
```

Se qualquer resposta for incerta, não implemente sem revisar a documentação.

---

# 5. Separação Obrigatória entre Sistema e IA

## 5.1 Sistema/Código controla

- autenticação;
- permissões;
- campanhas;
- membros;
- personagens;
- cenas;
- mapa;
- posições;
- mensagens;
- dados;
- inventário;
- diário;
- conhecimento;
- combate;
- PV;
- CA;
- dano;
- condições;
- crônicas;
- aprovações;
- mídias;
- logs.

## 5.2 IA controla

- narração;
- diálogo;
- descrição sensorial;
- sugestões;
- resumos;
- clima;
- interpretação de NPC;
- geração de propostas.

## 5.3 A IA não pode

- mover personagem oficialmente;
- revelar local secreto;
- criar item oficial;
- aprovar recompensa;
- alterar PV oficialmente;
- alterar dano oficialmente;
- transformar fato em canônico;
- acessar contexto sem filtro;
- ignorar conhecimento limitado;
- ignorar diário/mapa como item.

---

# 6. Stack Oficial Recomendada

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

# 7. Estrutura de Pastas Recomendada

```txt
/app
  /login
  /signup
  /dashboard
  /campaigns
  /characters
  /settings

/app/campaigns/[id]
  /overview
  /mesa-viva
  /mapa-vivo
  /characters
  /npcs
  /locations
  /inventory
  /journal
  /media
  /chronicles
  /dice
  /ai-master
  /approvals
  /settings

/components
  /ui
  /layout
  /campaign
  /session
  /scene
  /map
  /combat
  /character
  /npc
  /inventory
  /journal
  /ai
  /dice
  /media

/lib
  /supabase
  /permissions
  /ai
  /r2
  /dice
  /rules
  /map
  /combat
  /campaign
  /journal
  /inventory
  /chronicles

/docs
  CRONOFABULA_*.md
```

---

# 8. Ordem Oficial de Implementação

Seguir a ordem do MVP:

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

Não pular para combate, temas avançados ou automação complexa antes da Mesa Viva e Mapa Vivo funcionarem.

---

# 9. Regras de Banco de Dados

## 9.1 Todo dado de campanha deve ter campaign_id

Sempre que uma tabela pertence à campanha, incluir:

```sql
campaign_id uuid not null references campaigns(id)
```

## 9.2 Usar UUID

Todas as tabelas principais devem usar:

```sql
id uuid primary key default gen_random_uuid()
```

## 9.3 Usar timestamps

Tabelas principais devem conter:

```sql
created_at timestamptz default now()
updated_at timestamptz default now()
```

## 9.4 Não excluir dados narrativos sem cuidado

Preferir:

```txt
status = archived
status = deleted
```

Em vez de apagar permanentemente.

Exceção: dados temporários sem relevância narrativa.

---

# 10. Regras de Permissão

## 10.1 Nunca confiar apenas no frontend

Toda ação sensível deve ser validada no servidor.

## 10.2 RLS é obrigatório

Todas as tabelas principais devem ter RLS.

## 10.3 Funções base

Usar:

```sql
is_campaign_member(campaign_id)
is_campaign_master(campaign_id)
is_campaign_owner(campaign_id)
owns_character(character_id)
```

## 10.4 Validações server-side obrigatórias

Validar no servidor:

- abrir cena;
- enviar mensagem;
- mover personagem;
- acessar diário;
- anotar mapa;
- chamar IA;
- revelar local secreto;
- iniciar combate;
- aplicar dano;
- aprovar item;
- aprovar crônica;
- compartilhar conhecimento.

---

# 11. Regras da Mesa Viva

A Mesa Viva é o centro do jogo.

Obrigatório:

- toda mensagem tem `campaign_id`;
- toda mensagem tem `session_id`;
- toda mensagem deve ter visibilidade;
- cenas privadas não aparecem para personagens ausentes;
- mestre vê todas as cenas;
- jogador vê apenas sua cena;
- chat off não vira conhecimento do personagem;
- sussurro só aparece para remetente, destinatário e mestre.

---

# 12. Regras do Mapa Vivo

O Mapa Vivo controla localização.

Obrigatório:

- personagem tem posição;
- NPC tem posição;
- cena pode estar ligada a mapa/node;
- local secreto é invisível;
- jogador só anota em mapa se tiver item mapa;
- IA não revela local secreto sem gatilho;
- edifícios usam mapas internos;
- mapa de combate é separado.

---

# 13. Regras do Diário

O diário é item narrativo.

Obrigatório:

- diário deve existir como item;
- entradas pertencem ao diário;
- se diário está perdido/roubado/destruído, jogador não acessa;
- mestre pode acessar por segurança narrativa;
- IA não deve usar diário inacessível como contexto de jogador.

Mensagem recomendada quando bloqueado:

```txt
Você não está com seu diário. Última vez visto: [local conhecido].
```

---

# 14. Regras do Inventário Narrativo

Itens importantes devem ter:

- aparência;
- descrição conhecida;
- como foi obtido;
- propriedades conhecidas;
- propriedades ocultas;
- origem;
- status;
- aprovação, quando necessário.

O jogador vê apenas o que o personagem sabe.

O mestre vê tudo.

---

# 15. Regras da IA

## 15.1 buildAIContext é obrigatório

Toda chamada IA deve passar por função central:

```ts
buildAIContext({
  campaignId,
  sessionId,
  sceneId,
  activeCharacterId,
  mode
})
```

Essa função deve:

1. validar permissão;
2. buscar campanha;
3. buscar cena;
4. buscar localização;
5. buscar personagens presentes;
6. buscar NPCs presentes;
7. buscar conhecimento permitido;
8. buscar memória relevante;
9. remover segredos não autorizados;
10. montar contexto final.

## 15.2 Nunca mandar campanha inteira

Enviar apenas:

- cena atual;
- local atual;
- presentes;
- NPCs presentes;
- objetos visíveis;
- conhecimento permitido;
- memória relevante;
- instruções.

## 15.3 Logar chamadas relevantes

Salvar:

- modo;
- input resumido;
- output;
- usuário;
- contexto snapshot;
- status;
- estimativa de tokens.

---

# 16. Regras da Mesa de Combate

Combate é separado da exploração.

Obrigatório no MVP:

- iniciar combate;
- participantes;
- iniciativa;
- turnos;
- rodadas;
- PV;
- CA;
- zonas;
- ataque;
- dano;
- condições;
- dados físicos/virtuais;
- IA apenas narra resultado.

A IA não calcula resultado oficial se o sistema pode calcular.

---

# 17. Regras de Mídia

Mídias ficam no Cloudflare R2.

Supabase guarda apenas metadados:

- nome;
- tipo;
- r2_key;
- public_url;
- campanha;
- visibilidade;
- vínculo com entidade.

Nunca salvar arquivos pesados diretamente no Postgres.

---

# 18. Regras de Estilo Visual

O visual deve seguir o Cronofábula:

- azul meia-noite;
- roxo arcano;
- dourado antigo;
- grafite;
- pergaminho claro;
- letras com inspiração arcana/nórdica;
- temas por classe/raça;
- tema Goblin: Toca das Bugigangas.

No MVP, implementar apenas:

- tema base;
- Mago básico;
- Guerreiro básico;
- Goblin básico.

Não criar todas as combinações no início.

---

# 19. Critérios de Pronto por Módulo

## Auth

- login funciona;
- logout funciona;
- rota protegida;
- profile criado.

## Campanhas

- criar campanha;
- entrar por convite/código;
- membros com papel.

## Personagens

- criar personagem;
- vincular campanha;
- aprovar.

## Mesa Viva

- sessão;
- cena;
- chat;
- mensagens persistidas;
- realtime.

## Dados

- virtual;
- físico;
- histórico.

## NPC + IA

- NPC presente;
- IA responde como NPC;
- contexto filtrado.

## Mapa Vivo

- pontos;
- conexões;
- posição;
- local secreto invisível.

## Diário

- diário como item;
- anotar;
- bloquear se perdido.

## Crônicas

- resumo;
- aprovação;
- canônico.

## Combate

- iniciativa;
- turno;
- ataque;
- dano;
- IA narra.

---

# 20. Checklist Antes de Cada Commit

Antes de commitar, verificar:

```txt
[ ] Build passa
[ ] Lint passa
[ ] Não quebrou autenticação
[ ] Não expôs dados de outra campanha
[ ] Não removeu campaign_id
[ ] Não ignorou RLS
[ ] Não mandou segredo para IA
[ ] Não colocou regra crítica só no frontend
[ ] Não quebrou Mesa Viva
[ ] Não quebrou Mapa Vivo
[ ] Não quebrou permissões de mestre/jogador
[ ] Documentação foi atualizada, se necessário
```

---

# 21. Checklist de Segurança

```txt
[ ] Todas as tabelas sensíveis têm RLS
[ ] APIs validam membership
[ ] APIs validam papel
[ ] APIs validam personagem ativo
[ ] IA recebe contexto filtrado
[ ] Mensagens privadas são filtradas
[ ] Diário perdido bloqueia acesso
[ ] Locais secretos não aparecem
[ ] Master-only não aparece para jogador
[ ] Arquivos R2 respeitam visibilidade
```

---

# 22. Checklist de Experiência

```txt
[ ] Jogador entende onde está
[ ] Jogador sabe quem está na cena
[ ] Jogador consegue agir rápido
[ ] Jogador consegue rolar dado rápido
[ ] Mestre consegue corrigir IA
[ ] Mestre consegue mover personagem
[ ] Mestre consegue revelar local
[ ] Mestre consegue encerrar sessão
[ ] Resumo final ajuda próxima sessão
```

---

# 23. Padrão de Commits

Usar commits claros:

```txt
feat: add live table scene chat
fix: prevent players from seeing private scenes
refactor: centralize ai context builder
docs: update combat system guide
style: apply cronofabula base theme
chore: configure supabase client
```

---

# 24. O que Evitar

Não fazer:

- recriar Roll20 completo no MVP;
- automatizar todas as regras de D&D cedo;
- liberar IA sem filtro;
- criar temas demais antes do jogo funcionar;
- misturar domínio do Cronofábula com Agora Cortex;
- salvar mídia pesada no banco;
- deixar permissões só no frontend;
- permitir que jogador veja diário perdido;
- revelar `???` para locais secretos;
- transformar sugestão da IA em fato automaticamente.

---

# 25. Decisão Oficial

```txt
Cronofábula será desenvolvido como produto separado, usando padrões técnicos já conhecidos pela Agora Digital, mas sem misturar código/domínio com Agora Cortex.

O projeto seguirá documentação modular, MVP por fases, Supabase/Postgres, Cloudflare R2 e IA contextual.

A prioridade é criar uma mesa remota jogável, persistente e segura antes de evoluir para automações avançadas.
```

---

# 26. Próximos Passos Técnicos

Após este guia:

1. Criar projeto/repositório.
2. Criar Supabase project.
3. Criar migrations SQL em fases.
4. Implementar Auth.
5. Implementar campanhas.
6. Implementar personagens.
7. Implementar Mesa Viva.
8. Implementar dados.
9. Implementar NPC + IA.
10. Implementar Mapa Vivo.
11. Implementar diário.
12. Implementar crônicas.
13. Implementar combate.
14. Aplicar identidade visual.

---

# 27. Arquivos que Devem Existir no Repositório

```txt
/docs/CRONOFABULA_THEME_SYSTEM.md
/docs/CRONOFABULA_LIVE_MAP_SYSTEM.md
/docs/CRONOFABULA_COMBAT_SYSTEM.md
/docs/CRONOFABULA_NAVIGATION_AND_ACTIONS.md
/docs/CRONOFABULA_DATABASE_SCHEMA.md
/docs/CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
/docs/CRONOFABULA_MVP_ROADMAP.md
/docs/CRONOFABULA_PERMISSION_SYSTEM.md
/docs/CRONOFABULA_PROGRAM_GUIDE.md
```

---

# 28. Frase Final de Orientação

```txt
Antes de criar uma funcionalidade bonita, garanta que ela respeita campanha, cena, mapa, personagem, item, conhecimento e mestre.
```
