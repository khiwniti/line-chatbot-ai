const axios = require('axios');

/**
 * Extract billing information from an image using NVIDIA NIM (Llama 3.2 90b Vision Instruct)
 * @param {Buffer} imageBinary - Binary image data
 * @returns {Promise<Object>} Extracted billing fields
 */
async function extractBillingInfo(imageBinary) {
  try {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY || "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";

    if (!apiKey) {
      throw new Error('NVIDIA NIM API key not configured. Set NVIDIA_NIM_API_KEY or NVIDIA_API_KEY.');
    }

    const base64Image = imageBinary.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const prompt = `You are a professional invoice data extractor. Extract the following fields from the image and return ONLY a valid JSON object without any Markdown formatting or backticks:
- "invoiceNumber" (string)
- "billingDate" (string, YYYY-MM-DD format if possible)
- "dueDate" (string, YYYY-MM-DD format if possible)
- "vendorName" (string)
- "customerName" (string)
- "buildingName" (string)
- "totalAmount" (number)
- "currency" (string, default to "THB" if not specified)
- "vatAmount" (number)

If any field is missing or cannot be identified, leave its value as null (or 0 for numbers). Do not include any explanations. ONLY return JSON.`;

    const payload = {
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    };

    const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds
    });

    const content = response.data.choices[0].message.content.trim();

    // Strip markdown formatting if the model accidentally includes it
    const jsonString = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    const extractedData = JSON.parse(jsonString);

    return extractedData;
  } catch (error) {
    console.error('Error in billing extraction:', error.response?.data || error.message);
    throw new Error(`Billing extraction failed: ${error.message}`);
  }
}

module.exports = { extractBillingInfo };