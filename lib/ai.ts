import { OpenAI } from "openai";

interface ChecklistSuggestionResponse {
  choices: Array<{
    text?: string; // For completions
    message?: { content: string }; // For chat completions
  }>;
}

export async function fetchChecklistSuggestions(prompt: string): Promise<string[]> {
  // This function calls the Netlify serverless function which proxies the OpenAI API.

  if (!prompt) {
    console.error('Prompt is empty.');
    return [];
  }

  try {
    const res = await fetch('/.netlify/functions/openai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt, // Pass the prompt received as argument
        model: 'gpt-3.5-turbo', // Specify the model - adjust if needed
        max_tokens: 500, // Specify max tokens - adjust if needed
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`HTTP error fetching suggestions: ${res.status}, body: ${errorBody}`);
      return [];
    }

    const data: ChecklistSuggestionResponse = await res.json();

    // Assuming the response from OpenAI has text in choices[0].text (completions) or message.content (chat completions)
    const aiText = data.choices?.[0]?.text || data.choices?.[0]?.message?.content;

    if (aiText) {
      // Split the text into items, assuming items are separated by newlines or numbered list format
      const generatedItems = aiText.split(/\n\s*\d*\.\s*/).map(item => item.trim()).filter(item => item.length > 0);
      return generatedItems;
    } else {
      console.error('AI suggestions not found or format unexpected:', data);
      return [];
    }

  } catch (e: any) {
    console.error('Error fetching AI suggestions:', e);
    return [];
  }
} 