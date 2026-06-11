import { createClient } from "@/lib/supabase/client"

export type AIContextNpc = {
  id: string
  name: string
  role: string | null
}

export type AIContext = {
  presentNpcs: AIContextNpc[]
}

export async function buildAIContext({
  campaignId,
  sceneId,
}: {
  campaignId: string
  sceneId: string
}): Promise<AIContext> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('npcs')
    .select('id, name, role')
    .eq('campaign_id', campaignId)
    .eq('current_scene_id', sceneId)
    .eq('status', 'alive')
    .order('name', { ascending: true })

  if (error) throw error

  return {
    presentNpcs: data || [],
  }
}
