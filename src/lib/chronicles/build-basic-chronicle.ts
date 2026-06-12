// Gera uma crônica básica concatenando os registros de uma sessão
// (mensagens de cena, eventos, rolagens de dados e combates encerrados).
// Usado tanto pelo Portal do Mestre (rascunho local) quanto pela rota de
// IA (fallback quando o Cronista não responde). Nunca publica nada por si
// só — apenas monta o conteúdo de um rascunho que o mestre revisa.

type CharacterRef = { name: string }[] | { name: string } | null

export type ChronicleSourceMessage = {
  scene_id: string | null
  message_type: string
  content: string
  characters: CharacterRef
}

export type ChronicleSourceEvent = {
  scene_id: string | null
  event_type: string
  content: string | null
}

export type ChronicleSourceDiceRoll = {
  scene_id: string | null
  formula: string | null
  total: number | null
  reason: string | null
  characters?: CharacterRef
}

export type ChronicleSourceCombat = {
  scene_id: string | null
  title: string
  round_number: number
  combat_participants?: { name: string }[] | null
}

export type BasicChronicleDraft = {
  title: string
  summary: string
  public_content: string
  master_notes: string
  npcsEncountered: string[]
  highlights: string[]
  itemsGained: string[]
  visibility: "party" | "public"
  sceneId: string | null
}

function getCharacterName(characters: CharacterRef): string | null {
  if (Array.isArray(characters)) return characters[0]?.name ?? null
  return characters?.name ?? null
}

export function hasChronicleSourceData(params: {
  messages: ChronicleSourceMessage[]
  events: ChronicleSourceEvent[]
  diceRolls: ChronicleSourceDiceRoll[]
  combats: ChronicleSourceCombat[]
}): boolean {
  return params.messages.length > 0 || params.events.length > 0 || params.diceRolls.length > 0 || params.combats.length > 0
}

export function buildBasicChronicle(params: {
  sessionTitle: string
  campaignName: string
  messages: ChronicleSourceMessage[]
  events: ChronicleSourceEvent[]
  diceRolls: ChronicleSourceDiceRoll[]
  combats: ChronicleSourceCombat[]
}): BasicChronicleDraft {
  const { sessionTitle, campaignName, messages, events, diceRolls, combats } = params

  const npcsEncountered = new Set<string>()
  const narrativeLines: string[] = []

  for (const message of messages) {
    const content = message.content?.trim()
    if (!content) continue
    const author = getCharacterName(message.characters)
    if (author) npcsEncountered.add(author)

    if (message.message_type === "narration") {
      narrativeLines.push(`Narração: ${content}`)
    } else if (message.message_type === "action") {
      narrativeLines.push(`${author || "Alguém"} faz: ${content}`)
    } else if (message.message_type === "dice") {
      narrativeLines.push(`${author || "Alguém"} rolou dados: ${content}`)
    } else {
      narrativeLines.push(`${author || "Alguém"} diz: "${content}"`)
    }
  }

  const eventLines = events
    .map((event) => event.content?.trim())
    .filter((content): content is string => Boolean(content))
    .map((content) => `Evento: ${content}`)

  const diceLines = diceRolls
    .filter((roll) => roll.total !== null && roll.total !== undefined)
    .slice(0, 8)
    .map((roll) => {
      const author = getCharacterName(roll.characters ?? null)
      const formula = roll.formula ? ` (${roll.formula})` : ""
      const reason = roll.reason ? ` — ${roll.reason}` : ""
      return `${author || "Alguém"} rolou${formula}: resultado ${roll.total}${reason}.`
    })

  const combatLines = combats.map((combat) => {
    const participants = (combat.combat_participants || []).map((p) => p.name).filter(Boolean)
    participants.forEach((name) => npcsEncountered.add(name))
    const participantsLabel = participants.length > 0 ? participants.join(", ") : "combatentes não identificados"
    return `Combate "${combat.title}" foi travado e encerrado após ${combat.round_number} rodada(s), envolvendo ${participantsLabel}.`
  })

  const allLines = [...narrativeLines, ...eventLines, ...combatLines, ...diceLines]

  const summaryBase = allLines.length > 0
    ? allLines.slice(0, 15).join(" ")
    : `A sessão ${sessionTitle} transcorreu sem registros suficientes para um resumo detalhado.`

  const itemsGained = allLines
    .flatMap((line) => line.split(/\s+/))
    .filter((word) => /item|rel[ií]quia|segredo|portal|mapa|tesouro/i.test(word))
    .slice(0, 6)

  const sceneId = messages[0]?.scene_id ?? events[0]?.scene_id ?? combats[0]?.scene_id ?? diceRolls[0]?.scene_id ?? null

  return {
    title: `${sessionTitle} - ${campaignName}`,
    summary: summaryBase,
    public_content: summaryBase,
    master_notes: `Rascunho local gerado a partir de ${messages.length} mensagem(ns), ${events.length} evento(s), ${diceRolls.length} rolagem(ns) e ${combats.length} combate(s) encerrado(s).`,
    npcsEncountered: Array.from(npcsEncountered),
    highlights: allLines.slice(0, 10),
    itemsGained,
    visibility: "party",
    sceneId,
  }
}
