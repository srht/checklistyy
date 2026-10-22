import { NextResponse } from 'next/server'

const FALLBACK = ['Nothing to do']

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
      max_tokens: 1024,
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
  try {
    const { subject, provider } = await request.json()

    const prompt = `Create a detailed checklist for: ${subject}.
    Make the items specific, actionable, and organized in a logical order.
    Include 5-10 items. Give items in the language the subject was written in.`

    const text = pickProvider(provider) === 'gemini' ? await callGemini(prompt) : await callClaude(prompt)

    let items: string[] = []
    try {
      const parsed = JSON.parse(text)
      items = Array.isArray(parsed.items) ? parsed.items : []
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
    }

    return NextResponse.json({ items: items.length ? items : FALLBACK })
  } catch (error) {
    console.error('Error generating checklist:', error)
    return NextResponse.json({ items: FALLBACK })
  }
}
