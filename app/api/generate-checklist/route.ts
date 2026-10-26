import { NextResponse } from 'next/server'

const SYSTEM =
  "You are a helpful assistant that creates detailed, practical checklists. Respond only with a JSON object with an 'items' array containing strings."

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
      max_tokens: 3000,
      system: SYSTEM,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return '{' + (data.content?.[0]?.text ?? '')
}

async function callGemini(prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY || '',
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function pickProvider(requested?: string): 'claude' | 'gemini' {
  const p = (requested || process.env.AI_PROVIDER || '').toLowerCase()
  if (p === 'gemini' || p === 'claude') return p
  return !process.env.ANTHROPIC_API_KEY && process.env.GEMINI_API_KEY ? 'gemini' : 'claude'
}

export async function POST(request: Request) {
  if (request.headers.get('authorization')) return NextResponse.json({ error: 'Generation is not available via API keys' }, { status: 403 })
  try {
    const { subject, provider } = await request.json()

    const prompt = `Create a detailed, magazine-style checklist for: ${subject}.
    Make the items specific, actionable, and organized in a logical order.
    Include 5-10 items. Give items in the language the subject was written in.
    Each item is ONE string using this light markdown, with lines separated by \\n:
    Line 1: **Short bold title** (required)
    Line 2: one or two sentences of practical tip or context.
    Optional line: an image as ![caption](https://...) ONLY for items where a visual truly helps, and ONLY if you are confident of a real, stable direct image URL (e.g. upload.wikimedia.org). Never invent URLs; skip images when unsure.
    Optional line: a helpful reference as [label](https://...) ONLY with well-known real URLs (e.g. Wikipedia, official sites). Never invent URLs.
    Use at most 3 images in the whole list.`

    const text = pickProvider(provider) === 'gemini' ? await callGemini(prompt) : await callClaude(prompt)

    let items: string[] = []
    try {
      const parsed = JSON.parse(text)
      items = (Array.isArray(parsed.items) ? parsed.items : [])
        .map((i: unknown) => (typeof i === 'string' ? i : String((i as { text?: unknown })?.text ?? '')))
        .filter(Boolean)
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error generating checklist:', error)
    return NextResponse.json({ error: 'Failed to generate checklist' }, { status: 500 })
  }
}
