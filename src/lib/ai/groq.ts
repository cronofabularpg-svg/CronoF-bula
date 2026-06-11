// Cliente Groq server-side. NUNCA importar este arquivo em componentes
// "use client" — GROQ_API_KEY só pode existir no servidor.

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const DEFAULT_TIMEOUT_MS = 30_000

export type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type GroqCallOptions = {
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  /** Pede ao modelo para responder em JSON estrito (response_format json_object). */
  jsonResponse?: boolean
}

export class GroqError extends Error {}

/**
 * Chama a Groq Chat Completions API e retorna o texto gerado.
 * Lança GroqError em caso de chave ausente, timeout ou erro da API.
 */
export async function callGroq(
  messages: GroqChatMessage[],
  options: GroqCallOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new GroqError('GROQ_API_KEY não configurada no servidor.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.8,
        max_tokens: options.maxTokens ?? 1024,
        ...(options.jsonResponse ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new GroqError(`Groq API error (${response.status}): ${errorBody.slice(0, 500)}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (typeof content !== 'string' || !content.trim()) {
      throw new GroqError('Groq retornou uma resposta vazia.')
    }

    return content.trim()
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new GroqError('Tempo limite excedido ao chamar a IA (Groq).')
    }
    if (error instanceof GroqError) throw error
    throw new GroqError(error?.message || 'Falha ao chamar a IA (Groq).')
  } finally {
    clearTimeout(timeout)
  }
}
