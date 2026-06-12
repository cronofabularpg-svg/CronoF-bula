"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react"

// ----------------------------------------------------------------------------
// Tipos e constantes do setup inicial (SRD básico — sem motor completo de D&D)
// ----------------------------------------------------------------------------

type AttributeKey = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma"

const ATTRIBUTES: { key: AttributeKey; label: string; short: string }[] = [
  { key: "strength", label: "Força", short: "STR" },
  { key: "dexterity", label: "Destreza", short: "DEX" },
  { key: "constitution", label: "Constituição", short: "CON" },
  { key: "intelligence", label: "Inteligência", short: "INT" },
  { key: "wisdom", label: "Sabedoria", short: "WIS" },
  { key: "charisma", label: "Carisma", short: "CHA" },
]

const STANDARD_ARRAY: Record<AttributeKey, number> = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
}

const DEFAULT_ATTRIBUTES: Record<AttributeKey, number> = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
}

const SAVING_THROWS: { key: string; label: string }[] = [
  { key: "str", label: "Força" },
  { key: "dex", label: "Destreza" },
  { key: "con", label: "Constituição" },
  { key: "int", label: "Inteligência" },
  { key: "wis", label: "Sabedoria" },
  { key: "cha", label: "Carisma" },
]

const SKILLS: { key: string; ability: string }[] = [
  { key: "Acrobacia", ability: "DEX" },
  { key: "Arcanismo", ability: "INT" },
  { key: "Atletismo", ability: "STR" },
  { key: "Atuação", ability: "CHA" },
  { key: "Enganação", ability: "CHA" },
  { key: "Furtividade", ability: "DEX" },
  { key: "História", ability: "INT" },
  { key: "Intimidação", ability: "CHA" },
  { key: "Intuição", ability: "WIS" },
  { key: "Investigação", ability: "INT" },
  { key: "Lidar com Animais", ability: "WIS" },
  { key: "Medicina", ability: "WIS" },
  { key: "Natureza", ability: "INT" },
  { key: "Percepção", ability: "WIS" },
  { key: "Persuasão", ability: "CHA" },
  { key: "Prestidigitação", ability: "DEX" },
  { key: "Religião", ability: "INT" },
  { key: "Sobrevivência", ability: "WIS" },
]

// Dados de vida por classe (SRD básico). Usado apenas como sugestão editável.
const HIT_DIE_BY_CLASS: Record<string, number> = {
  barbaro: 12,
  guerreiro: 10,
  paladino: 10,
  patrulheiro: 10,
  bardo: 8,
  clerigo: 8,
  druida: 8,
  monge: 8,
  ladino: 8,
  bruxo: 8,
  mago: 6,
  feiticeiro: 6,
}

const CONJURER_CLASSES = new Set(["mago", "clerigo", "druida", "bardo", "feiticeiro", "bruxo", "paladino", "patrulheiro"])

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

function getHitDie(className: string): number {
  return HIT_DIE_BY_CLASS[normalize(className)] ?? 8
}

function isConjurer(className: string): boolean {
  return CONJURER_CLASSES.has(normalize(className))
}

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}

const STARTER_ITEM_SLOTS: { key: string; label: string; item_type: string; placeholder: string }[] = [
  { key: "weapon", label: "Arma", item_type: "weapon", placeholder: "Ex: Espada longa" },
  { key: "armor", label: "Armadura", item_type: "armor", placeholder: "Ex: Armadura de couro batido" },
  { key: "shield", label: "Escudo", item_type: "shield", placeholder: "Ex: Escudo de madeira" },
  { key: "tool", label: "Kit / Ferramenta", item_type: "tool", placeholder: "Ex: Kit de ladrão" },
  { key: "special", label: "Item Especial", item_type: "other", placeholder: "Ex: Amuleto de família" },
]

const STEP_LABELS = ["Identidade", "Atributos", "Combate Básico", "Perícias", "Equipamento", "Revisão"]

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type WizardCharacter = {
  id: string
  name: string
  race: string | null
  class: string | null
  background: string | null
  alignment: string | null
  level: number
}

type WizardCharStats = {
  strength: number | null
  dexterity: number | null
  constitution: number | null
  intelligence: number | null
  wisdom: number | null
  charisma: number | null
  saving_throws: string[] | null
  skills: Record<string, unknown> | null
} | null

type WizardCombat = {
  current_hp: number | null
  max_hp: number | null
  armor_class: number | null
  speed: number | null
  proficiency_bonus: number | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: WizardCharacter
  charStats: WizardCharStats
  combat: WizardCombat
  onCompleted: () => Promise<void> | void
}

export function CharacterSetupWizard({ open, onOpenChange, character, charStats, combat, onCompleted }: Props) {
  const { toast } = useToast()
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState(false)

  // Etapa 1 — Identidade
  const [identity, setIdentity] = React.useState({
    race: character.race || "",
    class: character.class || "",
    background: character.background || "",
    alignment: character.alignment || "",
    level: character.level || 1,
  })

  // Etapa 2 — Atributos
  const [attributeMethod, setAttributeMethod] = React.useState<"standard" | "manual" | "rolled">("standard")
  const [attributes, setAttributes] = React.useState<Record<AttributeKey, number>>(() => {
    if (charStats && ATTRIBUTES.every((a) => charStats[a.key] !== null)) {
      return {
        strength: charStats.strength ?? 10,
        dexterity: charStats.dexterity ?? 10,
        constitution: charStats.constitution ?? 10,
        intelligence: charStats.intelligence ?? 10,
        wisdom: charStats.wisdom ?? 10,
        charisma: charStats.charisma ?? 10,
      }
    }
    return { ...STANDARD_ARRAY }
  })

  function applyAttributeMethod(method: "standard" | "manual" | "rolled") {
    setAttributeMethod(method)
    if (method === "standard") {
      setAttributes({ ...STANDARD_ARRAY })
    } else {
      setAttributes({ ...DEFAULT_ATTRIBUTES })
    }
  }

  // Etapa 3 — Combate básico + recursos iniciais
  const dexMod = calculateModifier(attributes.dexterity)
  const conMod = calculateModifier(attributes.constitution)
  const hitDie = getHitDie(identity.class)
  const suggestedMaxHp = String(hitDie + conMod)
  const suggestedAc = String(10 + dexMod)
  const suggestedSpeed = "30"
  const suggestedProficiency = String(Math.floor((Math.max(identity.level, 1) - 1) / 4) + 2)

  const [combatForm, setCombatForm] = React.useState({
    max_hp: combat.max_hp !== null ? String(combat.max_hp) : "",
    current_hp: combat.current_hp !== null ? String(combat.current_hp) : "",
    armor_class: combat.armor_class !== null ? String(combat.armor_class) : "",
    speed: combat.speed !== null ? String(combat.speed) : "",
    proficiency_bonus: combat.proficiency_bonus !== null ? String(combat.proficiency_bonus) : "",
  })

  function applySuggestions() {
    setCombatForm({
      max_hp: suggestedMaxHp,
      current_hp: suggestedMaxHp,
      armor_class: suggestedAc,
      speed: suggestedSpeed,
      proficiency_bonus: suggestedProficiency,
    })
  }

  const [includeHitDice, setIncludeHitDice] = React.useState(true)
  const [includeInspiration, setIncludeInspiration] = React.useState(false)
  const [includeSpellSlots, setIncludeSpellSlots] = React.useState(isConjurer(identity.class))
  const [spellSlots1Max, setSpellSlots1Max] = React.useState("2")
  const [customResource, setCustomResource] = React.useState({ label: "", max_value: "" })

  // Etapa 4 — Perícias e resistências
  const [savingThrows, setSavingThrows] = React.useState<string[]>(
    Array.isArray(charStats?.saving_throws) ? (charStats!.saving_throws as string[]) : []
  )
  const [skills, setSkills] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    const raw = charStats?.skills
    for (const skill of SKILLS) {
      initial[skill.key] = !!(raw && typeof raw === "object" && (raw as Record<string, unknown>)[skill.key])
    }
    return initial
  })

  function toggleSavingThrow(key: string) {
    setSavingThrows((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  function toggleSkill(key: string) {
    setSkills((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Etapa 5 — Equipamento inicial
  const [items, setItems] = React.useState<Record<string, { include: boolean; name: string; description: string }>>(
    () => {
      const initial: Record<string, { include: boolean; name: string; description: string }> = {}
      for (const slot of STARTER_ITEM_SLOTS) {
        initial[slot.key] = { include: false, name: "", description: "" }
      }
      return initial
    }
  )

  function updateItem(key: string, patch: Partial<{ include: boolean; name: string; description: string }>) {
    setItems((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  // ----------------------------------------------------------------------------
  // Navegação e validação
  // ----------------------------------------------------------------------------

  function validateStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!identity.race.trim()) return "Informe a raça do personagem."
      if (!identity.class.trim()) return "Informe a classe do personagem."
      if (!identity.level || identity.level < 1) return "Informe um nível inicial válido (mínimo 1)."
    }
    if (currentStep === 2) {
      const required: (keyof typeof combatForm)[] = ["max_hp", "current_hp", "armor_class", "speed", "proficiency_bonus"]
      for (const field of required) {
        if (combatForm[field].trim() === "" || Number.isNaN(Number(combatForm[field]))) {
          return "Preencha PV máximo, PV atual, CA, Deslocamento e Bônus de proficiência com valores numéricos."
        }
      }
    }
    return null
  }

  function goNext() {
    const error = validateStep(step)
    if (error) {
      toast({ variant: "destructive", title: "Campos pendentes", description: error })
      return
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSave() {
    const identityError = validateStep(0)
    const combatError = validateStep(2)
    if (identityError || combatError) {
      toast({ variant: "destructive", title: "Campos pendentes", description: identityError || combatError || "" })
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      const resources: Record<string, unknown>[] = []
      if (includeHitDice) {
        resources.push({
          resource_key: "hit_dice",
          label: `Dados de Vida (d${hitDie})`,
          current_value: identity.level,
          max_value: identity.level,
          resource_type: "hit_dice",
          recovery_rule: "Recupera metade (arredondado para baixo) em um descanso longo.",
        })
      }
      if (includeInspiration) {
        resources.push({
          resource_key: "inspiration",
          label: "Inspiração",
          current_value: 1,
          max_value: 1,
          resource_type: "inspiration",
          recovery_rule: "Concedida pelo mestre.",
        })
      }
      if (includeSpellSlots) {
        const maxSlots = Number(spellSlots1Max) || 0
        resources.push({
          resource_key: "spell_slots_1",
          label: "Espaços de Magia (Nível 1)",
          current_value: maxSlots,
          max_value: maxSlots,
          resource_type: "spell_slot",
          recovery_rule: "Recuperados em um descanso longo.",
        })
      }
      if (customResource.label.trim()) {
        resources.push({
          resource_key: normalize(customResource.label).replace(/[^a-z0-9]+/g, "_").slice(0, 40) || "recurso_personalizado",
          label: customResource.label.trim(),
          current_value: Number(customResource.max_value) || 0,
          max_value: Number(customResource.max_value) || 0,
          resource_type: "custom",
          recovery_rule: null,
        })
      }

      const itemsPayload: Record<string, unknown>[] = []
      for (const slot of STARTER_ITEM_SLOTS) {
        const entry = items[slot.key]
        if (entry.include && entry.name.trim()) {
          itemsPayload.push({
            name: entry.name.trim(),
            item_type: slot.item_type,
            description: entry.description.trim() || null,
            equipped: true,
          })
        }
      }

      const { error } = await supabase.rpc("complete_character_initial_setup", {
        target_character_id: character.id,
        p_identity: {
          race: identity.race.trim(),
          class: identity.class.trim(),
          background: identity.background.trim() || null,
          alignment: identity.alignment.trim() || null,
          level: identity.level,
        },
        p_attributes: { ...attributes },
        p_combat: {
          max_hp: Number(combatForm.max_hp),
          current_hp: Number(combatForm.current_hp),
          armor_class: Number(combatForm.armor_class),
          speed: Number(combatForm.speed),
          proficiency_bonus: Number(combatForm.proficiency_bonus),
        },
        p_proficiencies: { saving_throws: savingThrows, skills },
        p_resources: resources,
        p_items: itemsPayload,
      })

      if (error) throw error

      toast({ title: "Ficha configurada!", description: `A ficha de ${character.name} foi preenchida com sucesso.` })
      onOpenChange(false)
      await onCompleted()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao salvar ficha", description: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-accent/30 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Configurar Ficha Inicial</DialogTitle>
          <DialogDescription className="font-heading italic">
            Etapa {step + 1} de {STEP_LABELS.length}: {STEP_LABELS[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          {STEP_LABELS.map((label, idx) => (
            <Badge
              key={label}
              variant="outline"
              className={`text-[9px] uppercase tracking-widest ${idx === step ? "border-primary text-primary bg-primary/10" : "border-white/10 text-muted-foreground opacity-60"}`}
            >
              {idx + 1}. {label}
            </Badge>
          ))}
        </div>

        <div className="space-y-6 py-2">
          {step === 0 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground block mb-1">Nome</span>
                {character.name}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Raça</Label>
                  <Input value={identity.race} onChange={(e) => setIdentity({ ...identity, race: e.target.value })} placeholder="Ex: Humano" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Classe</Label>
                  <Input value={identity.class} onChange={(e) => setIdentity({ ...identity, class: e.target.value })} placeholder="Ex: Guerreiro" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Antecedente</Label>
                  <Input value={identity.background} onChange={(e) => setIdentity({ ...identity, background: e.target.value })} placeholder="Ex: Soldado" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Tendência</Label>
                  <Input value={identity.alignment} onChange={(e) => setIdentity({ ...identity, alignment: e.target.value })} placeholder="Ex: Neutro e Bom" />
                </div>
              </div>
              <div className="space-y-2 max-w-[160px]">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Nível Inicial</Label>
                <Input
                  type="number"
                  min={1}
                  value={identity.level}
                  onChange={(e) => setIdentity({ ...identity, level: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Método de Geração</Label>
                <RadioGroup value={attributeMethod} onValueChange={(v) => applyAttributeMethod(v as "standard" | "manual" | "rolled")} className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <RadioGroupItem value="standard" />
                    <div>
                      <p className="text-sm font-bold">Padrão sugerido (15, 14, 13, 12, 10, 8)</p>
                      <p className="text-[10px] text-muted-foreground">Distribua os valores entre os atributos abaixo.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <RadioGroupItem value="manual" />
                    <div>
                      <p className="text-sm font-bold">Manual</p>
                      <p className="text-[10px] text-muted-foreground">Digite os valores escolhidos diretamente.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <RadioGroupItem value="rolled" />
                    <div>
                      <p className="text-sm font-bold">Rolado fisicamente</p>
                      <p className="text-[10px] text-muted-foreground">Digite os resultados que você rolou na mesa.</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ATTRIBUTES.map((attr) => (
                  <div key={attr.key} className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Label className="text-[10px] uppercase font-bold tracking-widest">{attr.label} ({attr.short})</Label>
                    <Input
                      type="number"
                      value={attributes[attr.key]}
                      onChange={(e) => setAttributes({ ...attributes, [attr.key]: parseInt(e.target.value, 10) || 0 })}
                    />
                    <p className="text-[10px] text-muted-foreground font-code">Modificador: {formatModifier(calculateModifier(attributes[attr.key]))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground italic">Sugestões para nível 1, calculadas a partir da classe e dos atributos — são apenas um ponto de partida editável.</p>
                <Button type="button" variant="outline" size="sm" onClick={applySuggestions} className="shrink-0 text-[10px] uppercase tracking-widest">
                  Usar sugestão
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">PV Máximo</Label>
                  <Input type="number" value={combatForm.max_hp} onChange={(e) => setCombatForm({ ...combatForm, max_hp: e.target.value })} placeholder={suggestedMaxHp} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">PV Atual</Label>
                  <Input type="number" value={combatForm.current_hp} onChange={(e) => setCombatForm({ ...combatForm, current_hp: e.target.value })} placeholder={suggestedMaxHp} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Classe de Armadura</Label>
                  <Input type="number" value={combatForm.armor_class} onChange={(e) => setCombatForm({ ...combatForm, armor_class: e.target.value })} placeholder={suggestedAc} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Deslocamento (ft)</Label>
                  <Input type="number" value={combatForm.speed} onChange={(e) => setCombatForm({ ...combatForm, speed: e.target.value })} placeholder={suggestedSpeed} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest">Bônus de Proficiência</Label>
                  <Input type="number" value={combatForm.proficiency_bonus} onChange={(e) => setCombatForm({ ...combatForm, proficiency_bonus: e.target.value })} placeholder={suggestedProficiency} />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Recursos Iniciais (opcional)</Label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                  <Checkbox checked={includeHitDice} onCheckedChange={(v) => setIncludeHitDice(!!v)} />
                  <span className="text-sm">Dados de Vida ({identity.level}d{hitDie})</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                  <Checkbox checked={includeInspiration} onCheckedChange={(v) => setIncludeInspiration(!!v)} />
                  <span className="text-sm">Inspiração</span>
                </label>
                {isConjurer(identity.class) && (
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                    <Checkbox checked={includeSpellSlots} onCheckedChange={(v) => setIncludeSpellSlots(!!v)} />
                    <span className="text-sm">Espaços de Magia (Nível 1)</span>
                    <Input
                      type="number"
                      value={spellSlots1Max}
                      onChange={(e) => setSpellSlots1Max(e.target.value)}
                      className="w-20 ml-auto h-8"
                      disabled={!includeSpellSlots}
                    />
                  </label>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Input
                    placeholder="Recurso personalizado (ex: Fúria)"
                    value={customResource.label}
                    onChange={(e) => setCustomResource({ ...customResource, label: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={customResource.max_value}
                    onChange={(e) => setCustomResource({ ...customResource, max_value: e.target.value })}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground italic">
                Não é necessário validar todas as regras de classe agora — o mestre poderá ajustar perícias e resistências depois.
              </p>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Resistências (Saving Throws) Proficientes</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SAVING_THROWS.map((save) => (
                    <label key={save.key} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
                      <Checkbox checked={savingThrows.includes(save.key)} onCheckedChange={() => toggleSavingThrow(save.key)} />
                      <span className="text-sm">{save.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Perícias Proficientes</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {SKILLS.map((skill) => (
                    <label key={skill.key} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
                      <Checkbox checked={!!skills[skill.key]} onCheckedChange={() => toggleSkill(skill.key)} />
                      <span className="text-sm">{skill.key}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">{skill.ability}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground italic">
                Itens simples para começar a aventura. Deixe em branco e marque &quot;Adicionar depois&quot; para itens que serão entregues pelo mestre.
              </p>
              {STARTER_ITEM_SLOTS.map((slot) => (
                <div key={slot.key} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={items[slot.key].include} onCheckedChange={(v) => updateItem(slot.key, { include: !!v })} />
                    <span className="text-sm font-bold">{slot.label}</span>
                  </label>
                  {items[slot.key].include && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder={slot.placeholder}
                        value={items[slot.key].name}
                        onChange={(e) => updateItem(slot.key, { name: e.target.value })}
                      />
                      <Input
                        placeholder="Descrição (opcional)"
                        value={items[slot.key].description}
                        onChange={(e) => updateItem(slot.key, { description: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Identidade</p>
                <p>{character.name} — {identity.race} {identity.class} (Nível {identity.level})</p>
                {identity.background && <p className="text-muted-foreground">Antecedente: {identity.background}</p>}
                {identity.alignment && <p className="text-muted-foreground">Tendência: {identity.alignment}</p>}
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Atributos</p>
                <p className="font-code">
                  {ATTRIBUTES.map((a) => `${a.short} ${attributes[a.key]} (${formatModifier(calculateModifier(attributes[a.key]))})`).join(" · ")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Combate</p>
                <p>PV {combatForm.current_hp}/{combatForm.max_hp} · CA {combatForm.armor_class} · Deslocamento {combatForm.speed}ft · Proficiência +{combatForm.proficiency_bonus}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Perícias e Resistências</p>
                <p className="text-muted-foreground">
                  Resistências: {savingThrows.length > 0 ? savingThrows.map((s) => s.toUpperCase()).join(", ") : "nenhuma marcada"}
                </p>
                <p className="text-muted-foreground">
                  Perícias: {Object.entries(skills).filter(([, v]) => v).map(([k]) => k).join(", ") || "nenhuma marcada"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Equipamento Inicial</p>
                {STARTER_ITEM_SLOTS.filter((s) => items[s.key].include && items[s.key].name.trim()).length > 0 ? (
                  STARTER_ITEM_SLOTS.filter((s) => items[s.key].include && items[s.key].name.trim()).map((s) => (
                    <p key={s.key} className="text-muted-foreground">{s.label}: {items[s.key].name}</p>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum item inicial — será adicionado depois.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0 || saving} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button type="button" onClick={goNext} className="bg-primary gap-2">
              Avançar <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={saving} className="bg-primary gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Ficha Inicial
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
