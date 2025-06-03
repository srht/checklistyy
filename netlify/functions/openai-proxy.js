// netlify/functions/openai-proxy.js
const { OpenAI } = require("openai");

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
    // Parse the request body
    const data = JSON.parse(event.body);

    // Get your OpenAI API key securely from Netlify environment variables.
    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Use process.env directly for Netlify functions

    if (!openaiApiKey) {
      return {
        statusCode: 500,
        body: 'OpenAI API key not configured.',
      };
    }

    // Initialize OpenAI SDK
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Extract parameters from the client request
    const { prompt, model = 'gpt-3.5-turbo', max_tokens = 500 } = data;

    if (!prompt) {
        return {
            statusCode: 400,
            body: 'Missing prompt in request body.',
        };
    }

    // Make the request to the OpenAI API using the SDK (Chat Completions endpoint)
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: prompt }
      ], // Use messages array for chat models
      max_tokens: max_tokens,
    });

    // Send the response back to the client
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completion),
    };

  } catch (error) {
    console.error('Serverless function error:', error);
    return {
      statusCode: 500,
      body: `Server error: ${error.message}`,
    };
  }
};

// TODO: Install node-fetch if you haven't already:
// npm install node-fetch@2 # Netlify functions currently use Node.js 14, which needs node-fetch v2
// Make sure node-fetch is available or use the built-in https module.
// Note: In newer Node.js versions (18+), fetch is built-in, but Netlify might be on an older version.
// Check your Netlify build settings or use node-fetch v2 for broader compatibility. 