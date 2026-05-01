const axios = require('axios');

/**
 * Sends a message to the NVIDIA NIM Conversational AI using an OpenAI-compatible API.
 * Uses a professional accounting assistant persona.
 * @param {string} message - The user's message
 * @returns {Promise<string>} The AI's response
 */
async function chat(message) {
  try {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY || "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";
    // We assume an OpenAI-compatible endpoint. We'll use a generic conversational endpoint if NVIDIA_NIM_CHAT_ENDPOINT is set,
    // otherwise fallback to a default or require it. For NIM, usually it's /v1/chat/completions
    const endpoint = process.env.NVIDIA_NIM_CHAT_ENDPOINT || "https://integrate.api.nvidia.com/v1/chat/completions";
    // Default model if not specified
    const model = process.env.NVIDIA_NIM_CHAT_MODEL || "meta/llama-3.1-70b-instruct";

    if (!apiKey) {
      throw new Error('NVIDIA NIM API key not configured');
    }

    const payload = {
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a highly skilled and professional accounting assistant. You provide accurate, helpful, and professional advice regarding accounting, billing, invoices, and financial tracking. Always communicate politely, clearly, and concisely. You should reply in the same language the user speaks, primarily Thai."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.2,
      max_tokens: 1024
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("Invalid response format from NVIDIA NIM API");
    }
  } catch (error) {
    console.error('Error in conversational AI:', error.message);
    if (error.response && error.response.data) {
        console.error('API Response Data:', error.response.data);
    }
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

module.exports = { chat };
