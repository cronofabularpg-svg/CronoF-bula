# CRONOFÁBULA — VISUAL DIRECTION

## 1. Resumo Executivo

Este documento define a direção visual fantasiosa oficial do **Cronofábula**.

O objetivo é evoluir o layout atual para uma experiência mais imersiva, com identidade de fantasia arcana, sem perder clareza, acessibilidade e usabilidade.

A decisão oficial é:

> O Cronofábula não deve parecer apenas um dashboard escuro com tema RPG.  
> Deve parecer um grimório vivo, uma mesa arcana e um arquivo de crônicas persistentes.

A fantasia deve reforçar a experiência, não atrapalhar o uso.

---

# 2. Princípio Visual Central

```txt
Interface de produto digital + atmosfera de alta fantasia + clareza de mesa de RPG.
```

O sistema deve transmitir:

- tempo;
- magia;
- crônicas antigas;
- mapa vivo;
- mesa narrativa;
- personagens persistentes;
- mestre no controle;
- IA como oráculo auxiliar.

---

# 3. Sensação Desejada

Quando o usuário abre o Cronofábula, deve sentir:

```txt
Estou entrando no arquivo vivo da minha campanha.
```

Não deve sentir:

```txt
Estou usando um painel administrativo com cores roxas.
```

---

# 4. Palavras-Chave Visuais

```txt
grimório
ampulheta
mesa arcana
pergaminho
selo mágico
runas
mapa antigo
crônica
oráculo
círculo ritual
dado d20
velas
ouro envelhecido
noite profunda
névoa
atlas
relicário
biblioteca antiga
```

---

# 5. Paleta Base

A paleta oficial continua:

```css
--color-midnight-blue: #111936;
--color-arcane-purple: #3A1F5D;
--color-antique-gold: #C8A24A;
--color-graphite: #17171C;
--color-parchment: #F3E7CF;
```

## 5.1 Ajuste para visual mais fantasioso

Adicionar camadas atmosféricas:

```css
--fantasy-void: #050711;
--fantasy-deep-violet: #190A2A;
--fantasy-magic-glow: #7B4FB3;
--fantasy-candle-light: #F0D484;
--fantasy-aged-ink: #2A2118;
--fantasy-blood-rune: #8E2F3F;
--fantasy-mist: rgba(255, 246, 229, 0.08);
--fantasy-gold-glow: rgba(200, 162, 74, 0.35);
--fantasy-purple-glow: rgba(123, 79, 179, 0.35);
```

---

# 6. Tipografia

## 6.1 Uso oficial

```css
--font-display: "Cinzel", "Cormorant Garamond", serif;
--font-heading: "Cormorant Garamond", "Georgia", serif;
--font-body: "Inter", "Source Sans 3", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

## 6.2 Regra de fantasia

Usar tipografia épica em:

- títulos;
- nomes de campanha;
- crônicas;
- abertura de sessão;
- cabeçalhos de mapa;
- nomes de NPCs;
- botões especiais.

Usar tipografia simples em:

- formulários;
- listas;
- configurações;
- mensagens técnicas;
- texto de ajuda;
- erros;
- tabelas.

## 6.3 Não fazer

```txt
Não usar fonte decorativa em tudo.
Não prejudicar leitura do chat.
Não usar letras rúnicas reais para texto funcional.
Não colocar todo botão em caixa alta se prejudicar compreensão.
```

---

# 7. Direção de Layout

## 7.1 Estrutura geral

A interface deve parecer composta por:

```txt
painéis de grimório
cartas de campanha
mapas antigos
selos de aprovação
pergaminhos de diário
orbes/portais de IA
relicários de inventário
```

## 7.2 Componentes devem ter nomes visuais

Criar componentes reutilizáveis:

```txt
ArcanePanel
GrimoireCard
ChronicleCard
RitualButton
OracleMessage
MapRuneNode
ParchmentSheet
RelicItemCard
CanonSeal
TravelEncounterModal
MasterApprovalSeal
```

---

# 8. Fundos

## 8.1 Fundo principal

O fundo deve misturar:

- azul noturno;
- violeta profundo;
- textura quase invisível;
- névoa sutil;
- pontos/estrelas discretos;
- gradiente radial leve.

Exemplo:

```css
background:
  radial-gradient(circle at 20% 10%, rgba(123, 79, 179, 0.16), transparent 30%),
  radial-gradient(circle at 80% 30%, rgba(200, 162, 74, 0.08), transparent 25%),
  linear-gradient(180deg, #080B18 0%, #050711 100%);
```

## 8.2 Texturas permitidas

```txt
pergaminho
papel envelhecido
couro escuro
metal antigo
poeira de estrelas
névoa
linhas de mapa
runas sutis
```

## 8.3 Texturas proibidas no MVP

```txt
texturas pesadas demais
fundos com alto contraste
imagens que atrapalham leitura
animações constantes no fundo
```

---

# 9. Botões

## 9.1 Botão principal

Deve parecer um botão de decisão importante, como um selo ou placa dourada.

Uso:

```txt
Criar Campanha
Entrar na Mesa
Iniciar Sessão
Salvar Crônica
Aprovar
```

Visual:

```txt
dourado antigo
borda clara
sombra suave
hover com brilho
ícone pequeno
```

## 9.2 Botão arcano

Uso:

```txt
Gerar com IA
Consultar Oráculo
Narrar
Gerar Cena
Resumir Sessão
```

Visual:

```txt
gradiente roxo profundo
borda dourada
brilho arcano
ícone de estrela/runa/orbe
```

Regra:

```txt
Botão arcano nunca executa ação destrutiva.
```

## 9.3 Botão destrutivo

Uso:

```txt
Excluir
Encerrar combate
Cancelar campanha
Destruir item
```

Visual:

```txt
vermelho escuro
borda discreta
sem brilho bonito demais
confirmação forte
```

---

# 10. Cards

## 10.1 Card de Campanha

Deve parecer um capítulo ou tomo.

Elementos:

```txt
capa/imagem
nome da campanha
sistema
mestre
última sessão
status
selo ativo
botão entrar
```

Visual:

```txt
borda dourada sutil
fundo escuro ou pergaminho escuro
título épico
selo/status
hover com brilho leve
```

## 10.2 Card de Personagem

Deve parecer uma ficha de aventureiro.

Elementos:

```txt
nome
classe
raça
nível
retrato
status do diário
status do mapa
campanha vinculada
```

Visual:

```txt
moldura temática
ícone de classe/raça
borda por tema
microfrase
```

## 10.3 Card de Item

Deve parecer um relicário.

Elementos:

```txt
ícone
nome
tipo
aparência
propriedades conhecidas
posse atual
status
```

Estados:

```txt
em posse
perdido
roubado
com NPC
destruído
pendente
```

---

# 11. Landing Page

## Direção

A landing page deve parecer a abertura de um livro mágico.

Seções:

```txt
Header como barra de tomo
Hero como portal arcano
Recursos como cartas mágicas
Mestre no Controle como selo de autoridade
Mapa Vivo como atlas
Crônicas como arquivo histórico
CTA final como juramento de campanha
```

## Hero recomendado

Elementos:

- logo/símbolo da ampulheta;
- título grande;
- frase “Quando o tempo separa a mesa, a fábula continua”;
- CTA dourado;
- CTA secundário escuro;
- fundo com partículas e luz suave.

---

# 12. Login e Cadastro

## Direção

Login deve parecer entrada em um grimório.

Elementos:

```txt
símbolo da ampulheta
card central como folha escura
campos simples
botão dourado
botão Google discreto
modo demo claramente marcado
```

## Cuidado

O modo demo deve mostrar:

```txt
Modo de demonstração — dados fictícios e isolados.
```

---

# 13. Dashboard

## Direção

Dashboard deve parecer:

```txt
Salão das Crônicas
Arquivo de Campanhas
Biblioteca de Tomos
```

Substituir sensação de painel administrativo por sensação de coleção de campanhas.

Texto sugerido:

```txt
Minhas Crônicas
Campanhas Ativas
Última Mesa
Convites Pendentes
Personagens Recentes
```

Visual:

- cards como livros/mapas;
- selos de status;
- CTA “Nova Campanha” como lacre dourado;
- empty state narrativo.

---

# 14. Mesa Viva

## Direção

A Mesa Viva é o coração visual do produto.

Ela deve parecer:

```txt
mesa ritual
chat de crônica viva
oráculo narrando a cena
personagens em torno da mesa
```

## Layout

```txt
Topo: sessão, cena, local, narrador ativo
Esquerda: personagens presentes
Centro: chat/narração
Direita: mapa mini, NPCs e objetos
Rodapé: campo de ação
```

## Estilo das mensagens

### Fala

```txt
balão limpo
nome do personagem
aspas
```

### Ação

```txt
itálico
tom narrativo
ícone de movimento/ação
```

### Narração

```txt
painel oracular
borda roxa/dourada
ícone arcano
```

### Rolagem

```txt
selo de dado
fórmula
resultado grande
tipo físico/virtual
motivo
```

### Sistema

```txt
pequeno
neutro
não competir com narração
```

---

# 15. Mapa Vivo

## Direção

O Mapa Vivo deve parecer um atlas mágico.

Elementos:

```txt
nós como runas
linhas como rotas pontilhadas
local atual com brilho dourado
local descoberto com marcador claro
local oculto só para mestre
local secreto invisível para jogador
```

## Painel lateral de local

Deve parecer uma ficha de local:

```txt
imagem/cena
nome
descrição
pontos de interesse
NPCs presentes
botão viajar
botão investigar
```

## Encontros de Viagem

Modal deve parecer:

```txt
ampulheta girando
estrada em névoa
resultado de dado
narração curta
decisão do mestre
```

Botões:

```txt
Concluir Viagem
Transformar em Cena
Enviar Item para Aprovação
Iniciar Combate
Ignorar
Cancelar
```

---

# 16. Mesa de Combate

## Direção

A Mesa de Combate deve parecer uma arena ritual/tática.

Elementos:

```txt
ordem de iniciativa como estandartes
cards de participantes como placas de batalha
ações como runas de combate
zona central escura
resultado narrado pela IA
```

## Não fazer

```txt
Não virar grid tático no MVP.
Não poluir com muitas animações.
Não esconder PV/CA.
Não sacrificar clareza por fantasia.
```

---

# 17. Inventário

## Direção

Inventário deve parecer:

```txt
bolsa de aventureiro
relicário de itens
arquivo de objetos com história
```

Cada item deve mostrar:

- aparência;
- como foi obtido;
- propriedades conhecidas;
- posse atual;
- status narrativo.

## Estados visuais

```txt
Em posse: normal
Com NPC: ícone de mão/mascara
Perdido: opacidade baixa
Roubado: selo vermelho
Destruído: textura queimada
Pendente: selo dourado fosco
```

---

# 18. Diário

## Direção

Diário deve parecer um objeto real.

Visual:

```txt
página de pergaminho
margem envelhecida
título escrito
data da anotação
selo do personagem
```

## Bloqueio

Quando personagem não tem o diário:

```txt
Você não está com seu diário.
Última vez visto: [local conhecido].
```

Visual:

```txt
cadeado
página escurecida
selo quebrado
textura rasgada
```

---

# 19. Crônicas

## Direção

Crônicas devem parecer o arquivo histórico oficial.

Visual:

```txt
capítulos
selos canônicos
linha do tempo
resumos aprovados
eventos importantes
```

Estados:

```txt
draft: cinza/pergaminho apagado
pending: dourado fosco
approved: selo dourado forte
secret/master-only: roxo escuro
```

---

# 20. Portal do Mestre

## Direção

Portal do Mestre deve parecer uma mesa de controle arcana.

Módulos:

```txt
Pendências
Sessões
Memória da IA
Aprovações
Sugestões da IA
Mapa
NPCs
Crônicas
```

Visual:

- painéis escuros;
- selos de aprovação;
- alertas claros;
- ações de mestre em destaque.

---

# 21. IA Mestre

## Direção

A IA deve parecer um oráculo contido.

Ela é poderosa, mas subordinada.

Visual:

```txt
orbe
runa
brilho roxo
painel escuro
borda dourada
indicador de contexto
```

Textos de estado:

```txt
O Oráculo observa...
A IA Mestre está consultando a crônica...
Sugestão pendente do mestre.
Contexto filtrado aplicado.
```

Regra visual:

```txt
IA nunca deve parecer autoridade final.
```

---

# 22. Animações

## Permitidas

```txt
fade leve
brilho de botão arcano
pulso sutil da IA pensando
dado aparecendo
selo de aprovação surgindo
linha do mapa acendendo
modal de encontro emergindo
```

## Evitar

```txt
partículas demais
piscadas constantes
animações longas
fundo em movimento pesado
efeitos que atrapalham leitura
```

---

# 23. Acessibilidade

A fantasia deve respeitar:

```txt
contraste
legibilidade
texto + ícone para estados
modo reduzir animações
mobile
teclado
foco visível
```

Regra:

```txt
Bonito não vale se o jogador não consegue agir rápido.
```

---

# 24. Mobile

No mobile:

- manter bottom navigation;
- reduzir ornamentos;
- priorizar ações principais;
- chat da Mesa Viva deve ser legível;
- mapa pode abrir em tela cheia;
- ações de combate devem ser botões grandes.

---

# 25. Níveis de Fantasia por Tela

Nem toda tela deve ter o mesmo nível de fantasia.

| Tela | Nível |
|---|---|
| Landing page | Alto |
| Login | Médio/alto |
| Dashboard | Médio |
| Mesa Viva | Alto controlado |
| Mapa Vivo | Alto controlado |
| Combate | Médio/alto |
| Inventário | Médio |
| Diário | Alto |
| Crônicas | Alto |
| Configurações | Baixo/médio |
| Admin técnico | Baixo |

---

# 26. Prompt para IA de UI

Use este prompt para pedir ajustes visuais:

```txt
Você é a IA de UI/UX do Cronofábula.

Sua tarefa é tornar o layout mais fantasioso, arcano e imersivo, sem prejudicar usabilidade.

Preserve:
- estrutura das telas;
- navegação;
- permissões;
- fluxos;
- legibilidade;
- responsividade.

Aplique:
- visual de grimório vivo;
- fundo noturno com névoa sutil;
- bordas douradas envelhecidas;
- painéis como pergaminhos escuros;
- botões como selos/rituais;
- ícones de ampulheta, d20, runas, grimórios e mapas;
- mensagens da IA como oráculo;
- mapas como atlas arcano;
- crônicas como capítulos oficiais.

Não faça:
- animações pesadas;
- fontes ilegíveis;
- excesso de partículas;
- alterar lógica;
- esconder botões importantes;
- trocar estrutura da navegação;
- criar dados mock reais;
- adicionar dependências desnecessárias.

Antes de alterar, liste:
1. telas afetadas;
2. componentes reutilizáveis criados;
3. riscos de legibilidade;
4. como testar mobile.
```

---

# 27. Componentes Prioritários para Refatorar

```txt
Button → RitualButton / ArcaneButton
Card → GrimoireCard / ChronicleCard
Modal → ArcaneModal
Badge → RuneBadge / CanonSeal
Sidebar → CampaignTomeSidebar
ChatMessage → OracleMessage / CharacterSpeech / ActionNarration
MapNode → MapRuneNode
InventoryItem → RelicItemCard
JournalEntry → ParchmentEntry
ApprovalItem → MasterApprovalSeal
```

---

# 28. Checklist Visual

```txt
[ ] Parece Cronofábula, não SaaS genérico
[ ] Usa paleta oficial
[ ] Usa tipografia épica apenas onde faz sentido
[ ] Mantém legibilidade no chat
[ ] Mantém botões principais claros
[ ] Mobile continua usável
[ ] IA parece auxiliar, não dona da tela
[ ] Mestre mantém controle visual
[ ] Estados críticos têm texto + ícone
[ ] Modo demo é claramente identificado
[ ] Animações são leves
```

---

# 29. Decisão Oficial

```txt
O layout do Cronofábula será elevado para uma direção mais fantasiosa, arcana e imersiva.

A estética deve se inspirar em grimórios, crônicas antigas, mapas mágicos, selos, runas, ampulhetas e mesas de RPG.

A fantasia não pode prejudicar usabilidade, acessibilidade, permissões ou clareza operacional.

O objetivo é que o usuário sinta que entrou em uma campanha viva, não apenas em um dashboard temático.
```
