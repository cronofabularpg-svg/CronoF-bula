# Biblioteca SRD de Monstros — Segurança Jurídica

## O que é

`src/lib/dnd/srd-monsters.ts` contém um catálogo estático de monstros
baseados no **System Reference Document 5.1 (SRD 5.1)** da Wizards of the
Coast, distribuído sob a licença **Creative Commons Attribution 4.0
International (CC-BY-4.0)**.

Cada monstro inclui apenas dados de jogo (classe de armadura, pontos de
vida, deslocamento, atributos, resistências/perícias, sentidos, idiomas,
nível de desafio, traços e ações) — sem texto narrativo extenso, sem
descrições de ambientação proprietárias e sem arte.

## Regras de uso

- A biblioteca usa **apenas** conteúdo do SRD/Creative Commons ou conteúdo
  autoral da própria Cronofábula.
- Monstros proprietários que **não** fazem parte do SRD (ex.: Beholder,
  Mind Flayer/Illithid, Displacer Beast, e qualquer criatura ou nome
  específico de cenários oficiais como Forgotten Realms, Eberron etc.)
  **não devem ser incluídos**.
- **Arte oficial não é usada** — a biblioteca não referencia nem incorpora
  imagens de produtos pagos.
- **Textos longos oficiais não são copiados** — descrições e "lore" de
  livros pagos não aparecem na biblioteca; apenas estatísticas de jogo e
  resumos curtos de comportamento (`behaviorHint`), escritos para esta
  aplicação.

## Fluxo de uso (modelo → Bestiário → IA)

1. A biblioteca SRD é **apenas um modelo/catálogo**. Nada dela é salvo
   automaticamente em nenhuma campanha.
2. O **mestre** escolhe um monstro na aba "Biblioteca SRD" (em
   `src/app/campaign/[id]/npcs/page.tsx`) e usa "Importar para Bestiário".
   Isso cria uma cópia editável na tabela `npcs` da campanha
   (`npc_type` em `mob`/`boss`/`creature`), via
   `convertSrdMonsterToNpcInput` (`src/lib/dnd/srd-monster-to-npc.ts`).
3. Na importação, `ai_control_enabled` é sempre `false` por padrão — o
   mestre precisa habilitar manualmente o controle pela IA Mestre para cada
   criatura.
4. A **IA Mestre só pode usar o Bestiário da Campanha** (NPCs já
   importados e aprovados pelo mestre), nunca a biblioteca SRD diretamente
   nem monstros não aprovados — ver `src/lib/ai/combat-permissions.ts`.

## Verificação contínua

Antes de adicionar novos monstros à biblioteca, rodar:

```bash
grep -R "Beholder\|Mind Flayer\|Illithid\|Displacer Beast" src/lib/dnd src/app
```

O resultado esperado é **nenhuma ocorrência**. Se houver dúvida sobre se um
monstro pertence ao SRD, ele não deve ser incluído.
