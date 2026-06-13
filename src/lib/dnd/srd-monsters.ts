// Biblioteca estática de monstros do SRD 5.1 (D&D 5e), licenciado sob
// CC-BY-4.0. Contém apenas estatísticas de jogo (CA, PV, deslocamento,
// atributos, ações, ND) — sem texto narrativo longo, sem arte e sem nenhum
// monstro proprietário fora do SRD (ex.: Beholder, Mind Flayer/Illithid,
// Displacer Beast).
//
// Esta biblioteca é apenas um catálogo/modelo: nada aqui é salvo
// automaticamente na campanha. O mestre importa um monstro para o Bestiário
// (tabela `npcs`, com npc_type 'mob'/'boss'/'creature') via
// `convertSrdMonsterToNpcInput`, revisando e ajustando os valores antes de
// confirmar. A IA Mestre só pode usar criaturas já importadas e aprovadas
// pelo mestre — ver docs/cronofabula/SRD_MONSTER_LIBRARY.md.

export type SrdMonster = {
  id: string
  name: string
  portugueseName: string
  type: string
  size: string
  alignment?: string
  armorClass: number
  hitPoints: number
  hitDice?: string
  speed: {
    walk?: number
    fly?: number
    swim?: number
    climb?: number
    burrow?: number
  }
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  savingThrows?: Record<string, number>
  skills?: Record<string, number>
  senses?: string[]
  languages?: string[]
  challengeRating: string
  xp?: number
  traits?: Array<{
    name: string
    description: string
  }>
  actions: Array<{
    name: string
    attackBonus?: number
    damage?: string
    damageType?: string
    range?: string
    description?: string
  }>
  behaviorHint: string
  source: "srd"
  license: "CC-BY-4.0"
}

const SRD: "srd" = "srd"
const CCBY: "CC-BY-4.0" = "CC-BY-4.0"

export const SRD_MONSTERS: SrdMonster[] = [
  {
    id: "goblin",
    name: "Goblin",
    portugueseName: "Goblin",
    type: "humanoid",
    size: "Small",
    alignment: "neutral evil",
    armorClass: 15,
    hitPoints: 7,
    hitDice: "2d6",
    speed: { walk: 30 },
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    senses: ["darkvision 60 ft"],
    languages: ["Common", "Goblin"],
    challengeRating: "1/4",
    xp: 50,
    traits: [
      { name: "Nimble Escape", description: "Pode usar Disengage ou Hide como ação bônus em cada turno." },
    ],
    actions: [
      { name: "Cimitarra", attackBonus: 4, damage: "1d6+2", damageType: "slashing", range: "5 ft" },
      { name: "Besta Curta", attackBonus: 4, damage: "1d6+2", damageType: "piercing", range: "80/320 ft" },
    ],
    behaviorHint: "Ataca em grupo, foge ou se esconde quando sozinho ou ferido.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "orc",
    name: "Orc",
    portugueseName: "Orc",
    type: "humanoid",
    size: "Medium",
    alignment: "chaotic evil",
    armorClass: 13,
    hitPoints: 15,
    hitDice: "2d8+6",
    speed: { walk: 30 },
    abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    senses: ["darkvision 60 ft"],
    languages: ["Common", "Orc"],
    challengeRating: "1/2",
    xp: 100,
    traits: [
      { name: "Aggressive", description: "Como ação bônus, pode se mover até seu deslocamento em direção a um inimigo." },
    ],
    actions: [
      { name: "Machado Grande", attackBonus: 5, damage: "1d12+3", damageType: "slashing", range: "5 ft" },
    ],
    behaviorHint: "Avança direto para o combate corpo a corpo, sem tática refinada.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "kobold",
    name: "Kobold",
    portugueseName: "Kobold",
    type: "humanoid",
    size: "Small",
    alignment: "lawful evil",
    armorClass: 12,
    hitPoints: 5,
    hitDice: "2d6-2",
    speed: { walk: 30 },
    abilities: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 },
    senses: ["darkvision 60 ft"],
    languages: ["Common", "Draconic"],
    challengeRating: "1/8",
    xp: 25,
    traits: [
      { name: "Pack Tactics", description: "Vantagem em ataques se um aliado estiver a 5 ft do alvo." },
      { name: "Sunlight Sensitivity", description: "Desvantagem em ataques e percepção visual sob luz solar direta." },
    ],
    actions: [
      { name: "Adaga", attackBonus: 4, damage: "1d4+2", damageType: "piercing", range: "5 ft" },
      { name: "Funda", attackBonus: 4, damage: "1d4+2", damageType: "bludgeoning", range: "30/120 ft" },
    ],
    behaviorHint: "Luta em grupo usando táticas de bando, foge quando isolado.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "skeleton",
    name: "Skeleton",
    portugueseName: "Esqueleto",
    type: "undead",
    size: "Medium",
    alignment: "lawful evil",
    armorClass: 13,
    hitPoints: 13,
    hitDice: "2d8+4",
    speed: { walk: 30 },
    abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    senses: ["darkvision 60 ft"],
    languages: ["entende os idiomas que tinha em vida, mas não fala"],
    challengeRating: "1/4",
    xp: 50,
    actions: [
      { name: "Espada Curta", attackBonus: 4, damage: "1d6+2", damageType: "piercing", range: "5 ft" },
      { name: "Arco Curto", attackBonus: 4, damage: "1d6+2", damageType: "piercing", range: "80/320 ft" },
    ],
    behaviorHint: "Avança sem hesitar, ataca o alvo mais próximo até ser destruído.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "zombie",
    name: "Zombie",
    portugueseName: "Zumbi",
    type: "undead",
    size: "Medium",
    alignment: "neutral evil",
    armorClass: 8,
    hitPoints: 22,
    hitDice: "3d8+9",
    speed: { walk: 20 },
    abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
    senses: ["darkvision 60 ft"],
    languages: ["entende os idiomas que tinha em vida, mas não fala"],
    challengeRating: "1/4",
    xp: 50,
    traits: [
      { name: "Undead Fortitude", description: "Se o dano não for radiante nem crítico, pode resistir à queda para 0 PV com um teste de Constituição." },
    ],
    actions: [
      { name: "Golpe Desajeitado", attackBonus: 3, damage: "1d6+1", damageType: "bludgeoning", range: "5 ft" },
    ],
    behaviorHint: "Move-se devagar e ataca o inimigo mais próximo, sem recuar.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "wolf",
    name: "Wolf",
    portugueseName: "Lobo",
    type: "beast",
    size: "Medium",
    armorClass: 13,
    hitPoints: 11,
    hitDice: "2d8+2",
    speed: { walk: 40 },
    abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    senses: ["passive Perception 13"],
    challengeRating: "1/4",
    xp: 50,
    traits: [
      { name: "Pack Tactics", description: "Vantagem em ataques se um aliado estiver a 5 ft do alvo." },
      { name: "Keen Hearing and Smell", description: "Vantagem em testes de Percepção que dependam de audição ou olfato." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 4, damage: "2d4+2", damageType: "piercing", range: "5 ft", description: "Se o alvo for uma criatura, deve ser bem-sucedido em um teste de Força ou cai prostrado." },
    ],
    behaviorHint: "Caça em bando, foca alvos isolados ou derrubados.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "dire_wolf",
    name: "Dire Wolf",
    portugueseName: "Lobo Terrível",
    type: "beast",
    size: "Large",
    armorClass: 14,
    hitPoints: 37,
    hitDice: "5d10+10",
    speed: { walk: 50 },
    abilities: { str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7 },
    senses: ["passive Perception 13"],
    challengeRating: "1",
    xp: 200,
    traits: [
      { name: "Pack Tactics", description: "Vantagem em ataques se um aliado estiver a 5 ft do alvo." },
      { name: "Keen Hearing and Smell", description: "Vantagem em testes de Percepção que dependam de audição ou olfato." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 5, damage: "2d6+3", damageType: "piercing", range: "5 ft", description: "Se o alvo for uma criatura, deve ser bem-sucedido em um teste de Força ou cai prostrado." },
    ],
    behaviorHint: "Líder de bando, derruba alvos para que outros lobos os finalizem.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "bandit",
    name: "Bandit",
    portugueseName: "Bandido",
    type: "humanoid",
    size: "Medium",
    alignment: "any non-lawful alignment",
    armorClass: 12,
    hitPoints: 11,
    hitDice: "2d8+2",
    speed: { walk: 30 },
    abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    languages: ["any one language (usually Common)"],
    challengeRating: "1/8",
    xp: 25,
    actions: [
      { name: "Cimitarra", attackBonus: 3, damage: "1d6+1", damageType: "slashing", range: "5 ft" },
      { name: "Besta Leve", attackBonus: 3, damage: "1d8+1", damageType: "piercing", range: "80/320 ft" },
    ],
    behaviorHint: "Ataca por interesse — emboscadas e roubo, foge se a luta virar contra ele.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "cultist",
    name: "Cultist",
    portugueseName: "Cultista",
    type: "humanoid",
    size: "Medium",
    alignment: "any non-good alignment",
    armorClass: 12,
    hitPoints: 9,
    hitDice: "2d8",
    speed: { walk: 30 },
    abilities: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
    languages: ["any one language (usually Common)"],
    challengeRating: "1/8",
    xp: 25,
    traits: [
      { name: "Dark Devotion", description: "Vantagem em testes de resistência contra ser charmado ou assustado." },
    ],
    actions: [
      { name: "Cimitarra", attackBonus: 3, damage: "1d6+1", damageType: "slashing", range: "5 ft" },
    ],
    behaviorHint: "Luta em grupo por fanatismo, prioriza proteger líderes do culto.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "guard",
    name: "Guard",
    portugueseName: "Guarda",
    type: "humanoid",
    size: "Medium",
    alignment: "any alignment",
    armorClass: 16,
    hitPoints: 11,
    hitDice: "2d8+2",
    speed: { walk: 30 },
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
    languages: ["any one language (usually Common)"],
    challengeRating: "1/8",
    xp: 25,
    actions: [
      { name: "Lança", attackBonus: 3, damage: "1d6+1", damageType: "piercing", range: "5/20 ft" },
    ],
    behaviorHint: "Mantém posição, ataca quem ameaçar a área que protege.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "thug",
    name: "Thug",
    portugueseName: "Capanga",
    type: "humanoid",
    size: "Medium",
    alignment: "any non-good alignment",
    armorClass: 11,
    hitPoints: 32,
    hitDice: "5d8+10",
    speed: { walk: 30 },
    abilities: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 },
    languages: ["any one language (usually Common)"],
    challengeRating: "1/2",
    xp: 100,
    traits: [
      { name: "Pack Tactics", description: "Vantagem em ataques se um aliado estiver a 5 ft do alvo." },
    ],
    actions: [
      { name: "Maça", attackBonus: 4, damage: "1d6+2", damageType: "bludgeoning", range: "5 ft", description: "Multiataque: dois golpes de maça." },
    ],
    behaviorHint: "Briga em grupo, intimida antes de atacar quando possível.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "giant_rat",
    name: "Giant Rat",
    portugueseName: "Rato Gigante",
    type: "beast",
    size: "Small",
    armorClass: 12,
    hitPoints: 7,
    hitDice: "2d6",
    speed: { walk: 30 },
    abilities: { str: 7, dex: 15, con: 11, int: 2, wis: 10, cha: 4 },
    challengeRating: "1/8",
    xp: 25,
    traits: [
      { name: "Pack Tactics", description: "Vantagem em ataques se um aliado estiver a 5 ft do alvo." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 4, damage: "1d4+2", damageType: "piercing", range: "5 ft" },
    ],
    behaviorHint: "Ataca em enxame, foge quando muitos aliados caem.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "giant_spider",
    name: "Giant Spider",
    portugueseName: "Aranha Gigante",
    type: "beast",
    size: "Large",
    armorClass: 14,
    hitPoints: 26,
    hitDice: "4d10+4",
    speed: { walk: 30, climb: 30 },
    abilities: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 },
    senses: ["darkvision 60 ft"],
    challengeRating: "1",
    xp: 200,
    traits: [
      { name: "Web Sense / Web Walker", description: "Ignora restrições de movimento causadas por teias e sabe a localização exata de criaturas em contato com sua teia." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 5, damage: "1d8+3", damageType: "piercing", range: "5 ft", description: "O alvo deve ser bem-sucedido em teste de Constituição ou sofre 2d8 de dano de veneno e fica envenenado." },
      { name: "Teia (recarrega 5-6)", range: "30/60 ft", description: "Tenta prender uma criatura em uma teia restritiva." },
    ],
    behaviorHint: "Emboscada de cima/das sombras, usa teia para imobilizar antes de morder.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "ogre",
    name: "Ogre",
    portugueseName: "Ogro",
    type: "giant",
    size: "Large",
    alignment: "chaotic evil",
    armorClass: 11,
    hitPoints: 59,
    hitDice: "7d10+21",
    speed: { walk: 40 },
    abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 5 },
    senses: ["darkvision 60 ft"],
    languages: ["Common", "Giant"],
    challengeRating: "2",
    xp: 450,
    actions: [
      { name: "Maça Grande", attackBonus: 6, damage: "2d8+4", damageType: "bludgeoning", range: "5 ft" },
      { name: "Lança Curta", attackBonus: 6, damage: "2d6+4", damageType: "piercing", range: "5/30 ft" },
    ],
    behaviorHint: "Força bruta direta, sem estratégia — ataca o que estiver mais perto.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "troll",
    name: "Troll",
    portugueseName: "Troll",
    type: "giant",
    size: "Large",
    alignment: "chaotic evil",
    armorClass: 15,
    hitPoints: 84,
    hitDice: "8d10+40",
    speed: { walk: 30 },
    abilities: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 },
    senses: ["darkvision 60 ft"],
    languages: ["Giant"],
    challengeRating: "5",
    xp: 1800,
    traits: [
      { name: "Regeneration", description: "Recupera 10 PV no início do turno, exceto se sofreu dano de fogo ou ácido desde o último turno." },
      { name: "Keen Smell", description: "Vantagem em testes de Percepção que dependam de olfato." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 7, damage: "1d6+4", damageType: "piercing", range: "5 ft" },
      { name: "Garra", attackBonus: 7, damage: "2d6+4", damageType: "slashing", range: "5 ft", description: "Multiataque: mordida e duas garras." },
    ],
    behaviorHint: "Bruto regenerativo — continua atacando mesmo gravemente ferido.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "ghoul",
    name: "Ghoul",
    portugueseName: "Carniçal",
    type: "undead",
    size: "Medium",
    alignment: "chaotic evil",
    armorClass: 12,
    hitPoints: 22,
    hitDice: "5d8",
    speed: { walk: 30 },
    abilities: { str: 13, dex: 15, con: 10, int: 7, wis: 10, cha: 6 },
    senses: ["darkvision 60 ft"],
    languages: ["entende Common, Carniçal, mas não fala"],
    challengeRating: "1",
    xp: 200,
    actions: [
      { name: "Mordida", attackBonus: 2, damage: "2d6+2", damageType: "piercing", range: "5 ft" },
      { name: "Garras", attackBonus: 4, damage: "2d4+2", damageType: "slashing", range: "5 ft", description: "Se o alvo não for undead, deve ser bem-sucedido em teste de Constituição ou fica paralisado por 1 minuto." },
    ],
    behaviorHint: "Emboscada em grupo, tenta paralisar para devorar alvos isolados.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "wight",
    name: "Wight",
    portugueseName: "Vulto",
    type: "undead",
    size: "Medium",
    alignment: "neutral evil",
    armorClass: 14,
    hitPoints: 45,
    hitDice: "6d8+18",
    speed: { walk: 30 },
    abilities: { str: 15, dex: 14, con: 16, int: 10, wis: 13, cha: 15 },
    senses: ["darkvision 60 ft"],
    languages: ["os idiomas que tinha em vida"],
    challengeRating: "3",
    xp: 700,
    traits: [
      { name: "Sunlight Sensitivity", description: "Desvantagem em ataques e percepção visual sob luz solar direta." },
    ],
    actions: [
      { name: "Garra Drenadora de Vida", attackBonus: 4, damage: "1d6+2", damageType: "necrotic", range: "5 ft", description: "Reduz o PV máximo do alvo pelo dano causado." },
      { name: "Espada Longa", attackBonus: 4, damage: "1d8+2", damageType: "slashing", range: "5 ft" },
    ],
    behaviorHint: "Comanda mortos-vivos menores e foca em drenar a vida do alvo mais fraco.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "imp",
    name: "Imp",
    portugueseName: "Diabrete",
    type: "fiend",
    size: "Tiny",
    alignment: "lawful evil",
    armorClass: 13,
    hitPoints: 10,
    hitDice: "3d4+3",
    speed: { walk: 20, fly: 40 },
    abilities: { str: 6, dex: 17, con: 13, int: 11, wis: 12, cha: 14 },
    senses: ["darkvision 120 ft"],
    languages: ["Infernal", "Common"],
    challengeRating: "1",
    xp: 200,
    traits: [
      { name: "Shapechanger", description: "Pode usar a ação para se transformar em uma besta pequena ou voltar à forma verdadeira." },
      { name: "Devil's Sight", description: "Pode ver normalmente na escuridão mágica." },
      { name: "Magic Resistance", description: "Vantagem em testes de resistência contra magia." },
    ],
    actions: [
      { name: "Ferrão (forma de diabrete)", attackBonus: 5, damage: "1d4+3", damageType: "piercing", range: "5 ft", description: "Mais 3d6 de dano de veneno." },
    ],
    behaviorHint: "Provoca de longe, foge voando e se transforma para enganar.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "quasit",
    name: "Quasit",
    portugueseName: "Quasit",
    type: "fiend",
    size: "Tiny",
    alignment: "chaotic evil",
    armorClass: 13,
    hitPoints: 7,
    hitDice: "3d4",
    speed: { walk: 40 },
    abilities: { str: 5, dex: 17, con: 10, int: 7, wis: 10, cha: 10 },
    senses: ["darkvision 120 ft"],
    languages: ["Abyssal", "Common"],
    challengeRating: "1",
    xp: 200,
    traits: [
      { name: "Shapechanger", description: "Pode usar a ação para se transformar em besta pequena (rato, corvo, sapo etc.) ou voltar à forma verdadeira." },
      { name: "Devil's Sight", description: "Pode ver normalmente na escuridão mágica." },
      { name: "Magic Resistance", description: "Vantagem em testes de resistência contra magia." },
    ],
    actions: [
      { name: "Garra (forma de quasit)", attackBonus: 4, damage: "1d4+3", damageType: "piercing", range: "5 ft", description: "Mais 2d4 de dano de veneno; o alvo deve ser bem-sucedido em Constituição ou ficar envenenado." },
    ],
    behaviorHint: "Hostiliza e provoca à distância, usa formas de bicho pequeno para se esconder.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "black_bear",
    name: "Black Bear",
    portugueseName: "Urso Negro",
    type: "beast",
    size: "Medium",
    armorClass: 11,
    hitPoints: 19,
    hitDice: "3d8+6",
    speed: { walk: 40, climb: 30 },
    abilities: { str: 15, dex: 10, con: 14, int: 2, wis: 12, cha: 7 },
    challengeRating: "1/2",
    xp: 100,
    traits: [
      { name: "Keen Smell", description: "Vantagem em testes de Percepção que dependam de olfato." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 3, damage: "1d6+2", damageType: "piercing", range: "5 ft" },
      { name: "Garra", attackBonus: 3, damage: "2d4+2", damageType: "slashing", range: "5 ft", description: "Multiataque: mordida e garra." },
    ],
    behaviorHint: "Defende território; ataca se provocado ou se a cria estiver ameaçada.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "brown_bear",
    name: "Brown Bear",
    portugueseName: "Urso Pardo",
    type: "beast",
    size: "Large",
    armorClass: 11,
    hitPoints: 34,
    hitDice: "4d10+12",
    speed: { walk: 40, climb: 30 },
    abilities: { str: 19, dex: 10, con: 16, int: 2, wis: 13, cha: 7 },
    challengeRating: "1",
    xp: 200,
    traits: [
      { name: "Keen Smell", description: "Vantagem em testes de Percepção que dependam de olfato." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 6, damage: "1d8+4", damageType: "piercing", range: "5 ft" },
      { name: "Garra", attackBonus: 6, damage: "2d6+4", damageType: "slashing", range: "5 ft", description: "Multiataque: mordida e duas garras." },
    ],
    behaviorHint: "Investida agressiva quando ameaçado, recua se a presa fugir.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "giant_bat",
    name: "Giant Bat",
    portugueseName: "Morcego Gigante",
    type: "beast",
    size: "Large",
    armorClass: 13,
    hitPoints: 22,
    hitDice: "4d8+4",
    speed: { walk: 10, fly: 60 },
    abilities: { str: 15, dex: 16, con: 11, int: 2, wis: 12, cha: 6 },
    senses: ["blindsight 60 ft", "darkvision 60 ft"],
    challengeRating: "1/4",
    xp: 50,
    traits: [
      { name: "Echolocation / Keen Hearing", description: "Não pode usar visão enquanto cego; vantagem em testes de Percepção baseados em audição." },
    ],
    actions: [
      { name: "Mordida", attackBonus: 4, damage: "1d6+3", damageType: "piercing", range: "5 ft" },
    ],
    behaviorHint: "Voa em círculos e ataca de surpresa em ambientes escuros ou cavernas.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "swarm_of_rats",
    name: "Swarm of Rats",
    portugueseName: "Enxame de Ratos",
    type: "swarm of Tiny beasts",
    size: "Medium",
    armorClass: 10,
    hitPoints: 24,
    hitDice: "7d8-7",
    speed: { walk: 30 },
    abilities: { str: 9, dex: 11, con: 9, int: 2, wis: 10, cha: 3 },
    challengeRating: "1/4",
    xp: 50,
    traits: [
      { name: "Swarm", description: "Pode ocupar o espaço de outra criatura e vice-versa. Sofre metade do dano de ataques que afetam apenas uma criatura." },
    ],
    actions: [
      { name: "Mordidas", attackBonus: 2, damage: "2d4", damageType: "piercing", range: "5 ft", description: "Dano reduzido pela metade se o enxame tiver metade do PV ou menos." },
    ],
    behaviorHint: "Cobre uma área e ataca tudo que entra nela, foge se reduzido à metade do PV.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "animated_armor",
    name: "Animated Armor",
    portugueseName: "Armadura Animada",
    type: "construct",
    size: "Medium",
    alignment: "unaligned",
    armorClass: 18,
    hitPoints: 33,
    hitDice: "6d8+6",
    speed: { walk: 25 },
    abilities: { str: 14, dex: 11, con: 13, int: 1, wis: 3, cha: 1 },
    senses: ["blindsight 60 ft (cega além disso)"],
    challengeRating: "1",
    xp: 200,
    traits: [
      { name: "Antimagic Susceptibility", description: "Fica incapacitada enquanto estiver na área de um efeito de antimagia." },
      { name: "False Appearance", description: "Enquanto imóvel, é indistinguível de uma armadura normal." },
    ],
    actions: [
      { name: "Golpe", attackBonus: 4, damage: "1d6+2", damageType: "bludgeoning", range: "5 ft", description: "Multiataque: dois golpes." },
    ],
    behaviorHint: "Fica imóvel até ser ativada por gatilho, então ataca sem parar.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "flying_sword",
    name: "Flying Sword",
    portugueseName: "Espada Voadora",
    type: "construct",
    size: "Small",
    alignment: "unaligned",
    armorClass: 17,
    hitPoints: 17,
    hitDice: "5d6",
    speed: { walk: 1, fly: 50 },
    abilities: { str: 12, dex: 15, con: 11, int: 1, wis: 5, cha: 1 },
    senses: ["blindsight 60 ft (cega além disso)"],
    challengeRating: "1/4",
    xp: 50,
    traits: [
      { name: "Antimagic Susceptibility", description: "Fica incapacitada enquanto estiver na área de um efeito de antimagia." },
      { name: "False Appearance", description: "Enquanto imóvel, é indistinguível de uma espada comum." },
    ],
    actions: [
      { name: "Golpe", attackBonus: 4, damage: "1d8+1", damageType: "slashing", range: "5 ft" },
    ],
    behaviorHint: "Guardião de tesouro — ataca quem se aproxima do item que protege.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "fire_elemental",
    name: "Fire Elemental",
    portugueseName: "Elemental do Fogo",
    type: "elemental",
    size: "Large",
    alignment: "neutral",
    armorClass: 13,
    hitPoints: 102,
    hitDice: "12d10+36",
    speed: { walk: 50 },
    abilities: { str: 10, dex: 17, con: 16, int: 6, wis: 10, cha: 7 },
    senses: ["darkvision 60 ft"],
    languages: ["Ignan"],
    challengeRating: "5",
    xp: 1800,
    traits: [
      { name: "Fire Form", description: "Pode se mover por espaços de até 1 polegada sem se espremer; criaturas que tocam o elemental ou o atingem em corpo a corpo sofrem dano de fogo." },
      { name: "Illumination", description: "Emite luz brilhante em raio de 30 ft." },
      { name: "Water Susceptibility", description: "Sofre 1 de dano por cada 5 ft que se mover na água, ou 1d4 se imerso." },
    ],
    actions: [
      { name: "Toque", attackBonus: 6, damage: "2d6+3", damageType: "fire", range: "5 ft", description: "Multiataque: dois toques. Pode atear fogo em alvos inflamáveis." },
    ],
    behaviorHint: "Avança incendiando o caminho, evita água, persegue alvos que fujam.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "earth_elemental",
    name: "Earth Elemental",
    portugueseName: "Elemental da Terra",
    type: "elemental",
    size: "Large",
    alignment: "neutral",
    armorClass: 17,
    hitPoints: 126,
    hitDice: "12d10+60",
    speed: { walk: 30, burrow: 30 },
    abilities: { str: 20, dex: 8, con: 20, int: 5, wis: 10, cha: 5 },
    senses: ["darkvision 60 ft", "tremorsense 60 ft"],
    languages: ["Terran"],
    challengeRating: "5",
    xp: 1800,
    traits: [
      { name: "Earth Glide", description: "Pode se mover através de terra e pedra não trabalhadas sem deixar buraco." },
      { name: "Siege Monster", description: "Causa dano dobrado a objetos e estruturas." },
    ],
    actions: [
      { name: "Golpe", attackBonus: 9, damage: "2d8+5", damageType: "bludgeoning", range: "5 ft", description: "Multiataque: dois golpes." },
    ],
    behaviorHint: "Emerge do solo para emboscar, mergulha de volta na terra ao ficar muito ferido.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "air_elemental",
    name: "Air Elemental",
    portugueseName: "Elemental do Ar",
    type: "elemental",
    size: "Large",
    alignment: "neutral",
    armorClass: 15,
    hitPoints: 90,
    hitDice: "12d8+36",
    speed: { walk: 0, fly: 90 },
    abilities: { str: 14, dex: 20, con: 14, int: 6, wis: 10, cha: 5 },
    senses: ["darkvision 60 ft"],
    languages: ["Auran"],
    challengeRating: "5",
    xp: 1800,
    traits: [
      { name: "Air Form", description: "Pode se mover por espaços de até 1 polegada sem se espremer." },
    ],
    actions: [
      { name: "Golpe", attackBonus: 8, damage: "2d8+5", damageType: "bludgeoning", range: "5 ft", description: "Multiataque: dois golpes." },
      { name: "Whirlwind (1/dia)", description: "Tenta arrastar uma criatura grande ou menor para dentro de seu espaço e empurrá-la para o alto." },
    ],
    behaviorHint: "Rápido e evasivo, ataca em voo e usa o vento para desorientar inimigos.",
    source: SRD,
    license: CCBY,
  },
  {
    id: "water_elemental",
    name: "Water Elemental",
    portugueseName: "Elemental da Água",
    type: "elemental",
    size: "Large",
    alignment: "neutral",
    armorClass: 14,
    hitPoints: 114,
    hitDice: "12d10+48",
    speed: { walk: 30, swim: 90 },
    abilities: { str: 18, dex: 14, con: 18, int: 5, wis: 10, cha: 5 },
    senses: ["darkvision 60 ft"],
    languages: ["Aquan"],
    challengeRating: "5",
    xp: 1800,
    traits: [
      { name: "Water Form", description: "Pode se mover por espaços de até 1 polegada sem se espremer." },
      { name: "Freeze", description: "Se sofrer dano de frio, fica enrijecido até o fim do próximo turno, com deslocamento 0 e desvantagem em Destreza." },
    ],
    actions: [
      { name: "Golpe", attackBonus: 7, damage: "2d8+4", damageType: "bludgeoning", range: "5 ft", description: "Multiataque: dois golpes. Pode tentar engolfar uma criatura Média ou menor." },
    ],
    behaviorHint: "Tenta arrastar inimigos para a água e engolfá-los, evita combate em terra seca.",
    source: SRD,
    license: CCBY,
  },
]

export function getSrdMonsterById(id: string): SrdMonster | undefined {
  return SRD_MONSTERS.find((m) => m.id === id)
}

export function searchSrdMonsters(query: string): SrdMonster[] {
  const q = query.trim().toLowerCase()
  if (!q) return SRD_MONSTERS
  return SRD_MONSTERS.filter((m) =>
    m.name.toLowerCase().includes(q) ||
    m.portugueseName.toLowerCase().includes(q) ||
    m.type.toLowerCase().includes(q)
  )
}

export function getSrdMonstersByType(type: string): SrdMonster[] {
  const t = type.trim().toLowerCase()
  if (!t || t === "all") return SRD_MONSTERS
  return SRD_MONSTERS.filter((m) => m.type.toLowerCase() === t)
}

export function getSrdMonstersByChallenge(challenge: string): SrdMonster[] {
  const c = challenge.trim().toLowerCase()
  if (!c || c === "all") return SRD_MONSTERS
  return SRD_MONSTERS.filter((m) => m.challengeRating.toLowerCase() === c)
}
