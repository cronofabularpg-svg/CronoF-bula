# CRONOFÁBULA — DESIGN TOKENS

## 1. Resumo Executivo

Este documento define os **tokens visuais oficiais** do Cronofábula.

Os tokens são a base técnica para transformar a identidade visual aprovada em interface real, mantendo consistência entre:

- landing page;
- login;
- dashboard;
- área da campanha;
- Mesa Viva;
- Mapa Vivo;
- Mesa de Combate;
- Diário;
- Inventário;
- IA Mestre;
- temas de classe e raça.

A regra central é:

> A marca do Cronofábula permanece fixa.  
> Os temas mudam a aparência do personagem, mas não mudam a estrutura, permissões ou fluxos do sistema.

---

# 2. Identidade Visual Oficial

## Nome

```txt
Cronofábula
```

## Slogan

```txt
Sua campanha viva no tempo de cada jogador.
```

## Conceito visual

```txt
Ampulheta arcana + círculo de jogadores + livro aberto + d20 + crônica viva.
```

## Tema base

```txt
Cronofábula — Arcano do Tempo
```

## Sensação desejada

```txt
Fantasia antiga
Mesa de RPG viva
Grimório organizado
Tempo preservado
Magia controlada
Crônica persistente
```

---

# 3. Paleta Oficial da Marca

## 3.1 Cores primárias

```css
--color-midnight-blue: #111936;
--color-arcane-purple: #3A1F5D;
--color-antique-gold: #C8A24A;
--color-graphite: #17171C;
--color-parchment: #F3E7CF;
```

## 3.2 Cores secundárias

```css
--color-deep-night: #080B18;
--color-royal-navy: #18224A;
--color-violet-shadow: #241138;
--color-old-bronze: #9C7933;
--color-soft-gold: #E3C878;
--color-ink: #101018;
--color-aged-paper: #E7D6B8;
--color-faded-cream: #FFF6E5;
```

## 3.3 Cores de estado

```css
--color-success: #3F8F5A;
--color-warning: #C89A3A;
--color-danger: #B94A48;
--color-info: #4D7EA8;
--color-disabled: #6F6A60;
```

## 3.4 Uso recomendado

| Token | Uso |
|---|---|
| `--color-midnight-blue` | Fundo principal escuro |
| `--color-arcane-purple` | Destaques mágicos, IA e ações especiais |
| `--color-antique-gold` | Botões principais, bordas nobres e ícones-chave |
| `--color-graphite` | Texto forte, painéis escuros e contraste |
| `--color-parchment` | Fundo claro, páginas, cards de leitura |

---

# 4. Tokens de Tema Claro

```css
:root,
[data-theme="light"] {
  --background: #F3E7CF;
  --background-muted: #E7D6B8;
  --surface: #FFF6E5;
  --surface-elevated: #FFFFFF;
  --surface-arcane: #F7EEDC;

  --text-primary: #101018;
  --text-secondary: #3D3940;
  --text-muted: #6F6A60;
  --text-inverted: #FFF6E5;

  --border-subtle: #D7C29D;
  --border-strong: #C8A24A;
  --border-arcane: #3A1F5D;

  --brand-primary: #111936;
  --brand-secondary: #3A1F5D;
  --brand-accent: #C8A24A;

  --button-primary-bg: #111936;
  --button-primary-text: #FFF6E5;
  --button-primary-hover: #18224A;

  --button-secondary-bg: #3A1F5D;
  --button-secondary-text: #FFF6E5;
  --button-secondary-hover: #4B2A75;

  --button-accent-bg: #C8A24A;
  --button-accent-text: #101018;
  --button-accent-hover: #E3C878;
}
```

---

# 5. Tokens de Tema Escuro

```css
[data-theme="dark"] {
  --background: #080B18;
  --background-muted: #111936;
  --surface: #17171C;
  --surface-elevated: #1F2030;
  --surface-arcane: #241138;

  --text-primary: #FFF6E5;
  --text-secondary: #E7D6B8;
  --text-muted: #A89C87;
  --text-inverted: #101018;

  --border-subtle: #343044;
  --border-strong: #C8A24A;
  --border-arcane: #5B3E8A;

  --brand-primary: #C8A24A;
  --brand-secondary: #7B4FB3;
  --brand-accent: #E3C878;

  --button-primary-bg: #C8A24A;
  --button-primary-text: #101018;
  --button-primary-hover: #E3C878;

  --button-secondary-bg: #3A1F5D;
  --button-secondary-text: #FFF6E5;
  --button-secondary-hover: #4B2A75;

  --button-accent-bg: #111936;
  --button-accent-text: #FFF6E5;
  --button-accent-hover: #18224A;
}
```

---

# 6. Tipografia

## 6.1 Direção

A tipografia deve equilibrar:

- fantasia;
- leitura confortável;
- autoridade visual;
- aparência de crônica;
- uso prático em produto digital.

## 6.2 Famílias recomendadas

```css
--font-display: "Cinzel", "Cormorant Garamond", serif;
--font-heading: "Cormorant Garamond", "Georgia", serif;
--font-body: "Inter", "Source Sans 3", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

## 6.3 Uso

| Token | Uso |
|---|---|
| `--font-display` | Logo, landing page, títulos épicos |
| `--font-heading` | Títulos de seções e cards importantes |
| `--font-body` | Interface, formulários, textos corridos |
| `--font-mono` | Dados, logs, códigos, rolagens |

## 6.4 Escala tipográfica

```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
--text-5xl: 3rem;
--text-hero: 4rem;
```

---

# 7. Espaçamento

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
```

## Regra de uso

- Interface funcional: `space-3` a `space-6`.
- Cards narrativos: `space-6` a `space-8`.
- Landing page: `space-12` a `space-24`.

---

# 8. Bordas e Raios

```css
--radius-xs: 0.25rem;
--radius-sm: 0.375rem;
--radius-md: 0.625rem;
--radius-lg: 0.875rem;
--radius-xl: 1.25rem;
--radius-2xl: 1.75rem;
--radius-full: 999px;
```

## Uso

| Token | Uso |
|---|---|
| `--radius-sm` | Inputs e botões pequenos |
| `--radius-md` | Botões principais |
| `--radius-lg` | Cards |
| `--radius-xl` | Painéis |
| `--radius-2xl` | Modais e blocos de destaque |

---

# 9. Sombras

```css
--shadow-sm: 0 1px 2px rgba(16, 16, 24, 0.12);
--shadow-md: 0 8px 24px rgba(16, 16, 24, 0.18);
--shadow-lg: 0 18px 48px rgba(16, 16, 24, 0.24);
--shadow-arcane: 0 0 24px rgba(58, 31, 93, 0.35);
--shadow-gold: 0 0 18px rgba(200, 162, 74, 0.28);
```

## Regra

Sombras arcanas devem ser usadas com moderação:

- IA Mestre;
- botões mágicos;
- estado ativo;
- abertura de sessão;
- destaque de crônica.

---

# 10. Componentes Base

## 10.1 Botão Primário

Uso:

- criar campanha;
- iniciar sessão;
- salvar;
- entrar na mesa;
- confirmar ação principal.

Tokens:

```css
background: var(--button-primary-bg);
color: var(--button-primary-text);
border: 1px solid var(--border-strong);
border-radius: var(--radius-md);
box-shadow: var(--shadow-sm);
```

Texto sugerido:

```txt
Entrar na Mesa
Criar Campanha
Iniciar Sessão
Salvar Crônica
```

---

## 10.2 Botão Secundário

Uso:

- cancelar;
- voltar;
- abrir detalhes;
- opções auxiliares.

```css
background: transparent;
color: var(--text-primary);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-md);
```

---

## 10.3 Botão Arcano

Uso:

- IA;
- gerar cena;
- narrar;
- consultar oráculo;
- resumir sessão.

```css
background: linear-gradient(135deg, var(--color-arcane-purple), var(--color-midnight-blue));
color: var(--color-faded-cream);
border: 1px solid var(--color-soft-gold);
box-shadow: var(--shadow-arcane);
```

Regra:

> Nunca usar botão arcano para ações destrutivas.

---

## 10.4 Card de Campanha

Elementos obrigatórios:

- imagem/capa;
- nome;
- sistema;
- mestre;
- próxima sessão;
- personagem ativo;
- botão de entrar.

Tokens:

```css
background: var(--surface);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md);
```

---

## 10.5 Card de Personagem

Elementos obrigatórios:

- retrato;
- nome;
- raça;
- classe;
- nível;
- campanha;
- status do diário;
- status do mapa.

Estados especiais:

```txt
ativo
pendente de aprovação
morto
arquivado
sem diário
sem mapa
```

---

## 10.6 Painel de Mesa Viva

Layout sugerido:

```txt
Topo: sessão, cena, local, narrador ativo
Esquerda: personagens presentes
Centro: chat/narração
Direita: mapa mini + NPCs/objetos
Rodapé: fala, ação, dado, diário, inventário
```

Tokens:

```css
background: var(--background);
surface: var(--surface);
border: var(--border-subtle);
accent: var(--brand-accent);
```

---

# 11. Estados Visuais

## 11.1 Estados gerais

```css
--state-active: #C8A24A;
--state-pending: #C89A3A;
--state-approved: #3F8F5A;
--state-rejected: #B94A48;
--state-hidden: #6F6A60;
--state-secret: #3A1F5D;
```

## 11.2 Estados narrativos

| Estado | Visual |
|---|---|
| Local visível | Borda normal |
| Local oculto | Só mestre vê, opacidade reduzida |
| Local secreto | Não aparece para jogador |
| Diário perdido | Cadeado + textura rasgada |
| Mapa perdido | Ícone de mapa apagado |
| Aprovação pendente | Selo dourado fosco |
| Crônica canônica | Selo dourado forte |
| IA ativa | Brilho roxo controlado |
| IA pausada | Ícone cinza |

---

# 12. Tokens de Tema Goblin

## 12.1 Nome

```txt
Goblin — Toca das Bugigangas
```

## 12.2 Paleta

```css
--goblin-slime: #6F8F2E;
--goblin-leather: #5A3B22;
--goblin-rust: #A45A2A;
--goblin-acid-fire: #B6D936;
--goblin-dirty-graphite: #20201C;
--goblin-paper: #D8C49A;
```

## 12.3 Aplicação

```css
[data-race-theme="goblin"] {
  --theme-primary: #6F8F2E;
  --theme-secondary: #5A3B22;
  --theme-accent: #A45A2A;
  --theme-glow: #B6D936;
  --theme-surface: #D8C49A;
}
```

## 12.4 Microfrases

```txt
Rolagem registrada. Ninguém viu nada.
Item adicionado à mochila. Provavelmente era seu.
Missão aceita. Péssima ideia, gostei.
Resumo salvo antes que alguém coma o pergaminho.
Você entrou na Toca. Esconda as moedas.
```

## 12.5 Regra

O tema Goblin pode parecer bagunçado, mas a interface deve continuar funcional.

Nunca alterar:

- posição dos botões;
- estrutura de navegação;
- permissões;
- fluxo de jogo;
- legibilidade.

---

# 13. Tokens de Classe MVP

## 13.1 Mago — Grimório Arcano

```css
[data-class-theme="wizard"] {
  --theme-primary: #3A1F5D;
  --theme-secondary: #111936;
  --theme-accent: #C8A24A;
  --theme-glow: #7B4FB3;
  --theme-surface: #F3E7CF;
}
```

Microfrase:

```txt
O grimório foi aberto.
```

---

## 13.2 Guerreiro — Forja do Herói

```css
[data-class-theme="fighter"] {
  --theme-primary: #2A2D34;
  --theme-secondary: #5A1F1F;
  --theme-accent: #B8843A;
  --theme-glow: #C0C0C0;
  --theme-surface: #E2D4BE;
}
```

Microfrase:

```txt
Arma em punho.
```

---

## 13.3 Ladino — Sombra da Adaga

```css
[data-class-theme="rogue"] {
  --theme-primary: #101820;
  --theme-secondary: #1F3A2E;
  --theme-accent: #A8A8A8;
  --theme-glow: #3A1F5D;
  --theme-surface: #D8D2C4;
}
```

Microfrase:

```txt
Ninguém viu nada.
```

---

# 14. Tokens de IA

## 14.1 IA Mestre

```css
--ai-bg: #241138;
--ai-border: #7B4FB3;
--ai-glow: rgba(123, 79, 179, 0.35);
--ai-text: #FFF6E5;
--ai-accent: #E3C878;
```

## 14.2 Estados da IA

| Estado | Token |
|---|---|
| Ativa | `--ai-border` + `--shadow-arcane` |
| Pensando | brilho roxo pulsante |
| Pausada | cinza + sem brilho |
| Corrigida pelo mestre | selo dourado |
| Erro | borda vermelha controlada |

## 14.3 Regra

A IA deve parecer poderosa, mas subordinada ao sistema e ao mestre.

Visualmente:

```txt
IA sugere.
Sistema registra.
Mestre aprova.
```

---

# 15. Tokens de Dados

## 15.1 D20

```css
--dice-d20-bg: #111936;
--dice-d20-border: #C8A24A;
--dice-d20-text: #FFF6E5;
```

## 15.2 Resultado crítico

```css
--dice-critical-success: #3F8F5A;
--dice-critical-failure: #B94A48;
--dice-physical: #C8A24A;
--dice-virtual: #3A1F5D;
```

## 15.3 Regra visual

- dado físico: selo dourado;
- dado virtual: selo roxo;
- crítico: destaque forte;
- falha crítica: destaque forte, mas sem poluir a tela.

---

# 16. Tokens de Combate

```css
--combat-bg: #101018;
--combat-hero-zone: #111936;
--combat-enemy-zone: #2B1218;
--combat-neutral-zone: #24212A;
--combat-turn-active: #C8A24A;
--combat-damage: #B94A48;
--combat-heal: #3F8F5A;
--combat-condition: #7B4FB3;
```

## Estados

| Estado | Visual |
|---|---|
| Turno ativo | borda dourada |
| Personagem caído | opacidade reduzida + ícone |
| Inimigo derrotado | card marcado/escurecido |
| Condição ativa | etiqueta roxa |
| Ação usada | ícone apagado |

---

# 17. Tokens de Mapa Vivo

```css
--map-node-visible: #C8A24A;
--map-node-current: #E3C878;
--map-node-visited: #3F8F5A;
--map-node-hidden-master: #6F6A60;
--map-node-secret-master: #7B4FB3;
--map-edge-normal: #C8A24A;
--map-edge-locked: #B94A48;
--map-edge-secret: #7B4FB3;
```

## Regra

Local secreto não deve ter representação visual para jogador.

Para mestre:

- oculto: cinza;
- secreto: roxo;
- revelado: dourado.

---

# 18. Tokens de Diário e Crônicas

```css
--journal-bg: #F3E7CF;
--journal-paper: #FFF6E5;
--journal-ink: #101018;
--journal-line: #D7C29D;
--chronicle-approved: #C8A24A;
--chronicle-draft: #6F6A60;
--chronicle-pending: #C89A3A;
```

## Estados do diário

| Estado | Visual |
|---|---|
| Disponível | página normal |
| Perdido | página bloqueada |
| Roubado | selo vermelho discreto |
| Destruído | textura queimada |
| Com outro personagem | ícone de entrega |
| Com NPC | bloqueio narrativo |

Mensagem padrão:

```txt
Você não está com seu diário. Última vez visto: [local conhecido].
```

---

# 19. Acessibilidade

## Regras obrigatórias

- Contraste mínimo legível em botões e textos.
- Não depender apenas de cor para indicar estado.
- Sempre usar ícone ou texto junto com cor.
- Reduzir animações se `reduce_motion = true`.
- Hover não pode ser a única forma de revelar ação essencial.
- Mobile precisa manter botões principais visíveis.

## Tokens

```css
--focus-ring: 0 0 0 3px rgba(200, 162, 74, 0.45);
--reduced-motion-duration: 0ms;
--motion-fast: 120ms;
--motion-normal: 220ms;
--motion-slow: 360ms;
```

---

# 20. Animações

## Permitidas

- brilho leve em botão arcano;
- fade de entrada em card;
- pulso discreto em IA pensando;
- destaque de rolagem de dado;
- selo aparecendo em aprovação.

## Evitar

- animação em excesso no chat;
- elementos piscando;
- fundos muito ativos;
- efeitos que dificultem leitura;
- animações pesadas no mobile.

---

# 21. Estrutura Recomendada no Código

## 21.1 Arquivo CSS base

```txt
apps/web/src/styles/tokens.css
```

## 21.2 Temas

```txt
apps/web/src/styles/themes/base.css
apps/web/src/styles/themes/goblin.css
apps/web/src/styles/themes/wizard.css
apps/web/src/styles/themes/fighter.css
apps/web/src/styles/themes/rogue.css
```

## 21.3 Utilitário

```txt
apps/web/src/lib/theme/get-character-theme.ts
```

## 21.4 Provider

```txt
apps/web/src/components/theme/theme-provider.tsx
```

---

# 22. Checklist de Validação Visual

Antes de aprovar qualquer tela:

```txt
[ ] Usa paleta oficial
[ ] Mantém legibilidade
[ ] Funciona em claro e escuro
[ ] Não quebra mobile
[ ] Botão principal é evidente
[ ] IA aparece como auxiliar, não como dona da tela
[ ] Mestre mantém controle visual
[ ] Jogador entende onde está
[ ] Estados críticos têm texto + ícone
[ ] Tema do personagem não altera estrutura
```

---

# 23. Decisão Oficial

```txt
O Cronofábula usará uma marca fixa institucional chamada Cronofábula — Arcano do Tempo.

O MVP terá tema base, tema Goblin, tema Mago, tema Guerreiro e tema Ladino.

Temas visuais não podem alterar regras, permissões, posições principais de menu ou fluxos de jogo.

A interface deve parecer um grimório vivo, mas funcionar como produto digital claro e seguro.
```
