// netlify/functions/openai-proxy.js

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

    // TODO: Get your OpenAI API key securely from Netlify environment variables.
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return {
        statusCode: 500,
        body: 'OpenAI API key not configured.',
      };
    }

    // TODO: Define the OpenAI API endpoint you want to call (e.g., for completions)
    const openaiApiUrl = 'https://api.openai.com/v1/completions'; // Example endpoint

    // TODO: Prepare the payload for the OpenAI API based on the incoming request data
    // You will need to structure this based on the specific OpenAI API endpoint you are using
    const openaiPayload = {
      // Example: For completions endpoint
      model: data.model || "text-davinci-003", // Or the model passed from client
      prompt: data.prompt, // The prompt from the client
      max_tokens: data.max_tokens || 150, // Or the max_tokens passed from client
      // Add other parameters as needed by the OpenAI API endpoint
    };

    // Make the request to the OpenAI API
    const response = await fetch(openaiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(openaiPayload),
    });

    // Handle potential HTTP errors from OpenAI
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API error:', response.status, errorBody);
      return {
        statusCode: response.status,
        body: `Error from OpenAI API: ${errorBody}`,
      };
    }

    // Parse the JSON response from OpenAI
    const responseData = await response.json();

    // Send the response back to the client
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
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