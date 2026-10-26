export async function fetchChecklistSuggestions(prompt: string, provider?: string): Promise<string[]> {
  if (!prompt) {
    console.error('Prompt is empty.');
    return [];
  }

  try {
    const res = await fetch('/api/generate-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: prompt, provider }),
    });

    if (!res.ok) {
      console.error(`HTTP error fetching suggestions: ${res.status}, body: ${await res.text()}`);
      return [];
    }

    const data: { items?: unknown[] } = await res.json();
    return (Array.isArray(data.items) ? data.items : [])
      .map(i => (typeof i === 'string' ? i : String((i as { text?: unknown })?.text ?? '')))
      .filter(Boolean);
  } catch (e) {
    console.error('Error fetching AI suggestions:', e);
    return [];
  }
}
