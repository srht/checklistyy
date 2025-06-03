// netlify/functions/openai-proxy.js
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.NETLIFY_OPENAI_API_KEY
})
exports.handler = async (event, context) => {
  // This function will act as a proxy for the OpenAI API.
  // It will receive requests from the client, forward them to OpenAI,
  // and send the response back.

  // Ensure this is a POST request, as we expect data in the body
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }
  try {
    const { subject } = await event.request.json()

    const prompt = `Create a detailed checklist for: ${subject}. 
    Format the response as a JSON array of strings, where each string is a checklist item.
    Make the items specific, actionable, and organized in a logical order.
    Include 5-10 items. Give items in the language of ${subject} was written in.` 

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates detailed, practical checklists. Format your response as a JSON object with an 'items' array containing strings. "
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" }
    })

    const response = completion.choices[0].message.content
    console.log('Raw API response:', response) // Debug log

    let checklistItems
    try {
      const parsedResponse = JSON.parse(response || '{"items": []}')
      checklistItems = Array.isArray(parsedResponse.items) ? parsedResponse.items : []
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
      checklistItems = []
    }

    if (!checklistItems.length) {
      // Fallback items if the API response is empty or invalid
      checklistItems = [
        "Nothing to do"
      ]
    }

    return NextResponse.json({ items: checklistItems })
  } catch (error) {
    console.error('Error generating checklist:', error)
    // Return fallback items in case of error
    return NextResponse.json({
      items: [
        "Nothing to do"
      ]
    })
  }
};

// TODO: Install node-fetch if you haven't already:
// npm install node-fetch@2 # Netlify functions currently use Node.js 14, which needs node-fetch v2
// Make sure node-fetch is available or use the built-in https module.
// Note: In newer Node.js versions (18+), fetch is built-in, but Netlify might be on an older version.
// Check your Netlify build settings or use node-fetch v2 for broader compatibility. 