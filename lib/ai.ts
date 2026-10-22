export async function fetchChecklistSuggestions(prompt: string): Promise<string[]> {
  if (!prompt) {
    console.error('Prompt is empty.');
    return [];
  }

  try {
    const res = await fetch('/api/generate-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: prompt }),
    });

    if (!res.ok) {
      console.error(`HTTP error fetching suggestions: ${res.status}, body: ${await res.text()}`);
      return [];
    }

    const data: { items?: string[] } = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error('Error fetching AI suggestions:', e);
    return [];
  }
}
