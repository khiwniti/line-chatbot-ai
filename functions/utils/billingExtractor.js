const axios = require('axios');

/**
 * Extract billing information from an image using NVIDIA NIM (nemoretriever-ocr-v1 + Llama 3.1 70b)
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

    // Step 1: Extract text using nemoretriever-ocr-v1
    const ocrUrl = "https://ai.api.nvidia.com/v1/cv/nvidia/nemoretriever-ocr-v1";
    const ocrPayload = {
      input: [
        {
          type: "image_url",
          url: `data:image/jpeg;base64,${base64Image}`
        }
      ]
    };

    const ocrResponse = await axios.post(ocrUrl, ocrPayload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    let extractedRawText = "";
    if (ocrResponse.data && ocrResponse.data.data && ocrResponse.data.data.length > 0) {
      const detections = ocrResponse.data.data[0].text_detections || [];
      extractedRawText = detections.map(d => d.text).join("\n");
    }

    if (!extractedRawText.trim()) {
      throw new Error("No text found in the image by OCR model.");
    }

    // Step 2: Parse raw text into structured JSON using LLM
    const prompt = `You are a professional invoice data extractor. I am providing you with the raw text extracted from an invoice image via OCR.
Extract the following fields from the text and return ONLY a valid JSON object without any Markdown formatting or backticks:
- "invoiceNumber" (string)
- "billingDate" (string, YYYY-MM-DD format if possible)
- "dueDate" (string, YYYY-MM-DD format if possible)
- "vendorName" (string)
- "customerName" (string)
- "buildingName" (string)
- "totalAmount" (number)
- "currency" (string, default to "THB" if not specified)
- "vatAmount" (number)

If any field is missing or cannot be identified, leave its value as null (or 0 for numbers). Do not include any explanations. ONLY return JSON.

Here is the raw OCR text:
${extractedRawText}`;

    const llmPayload = {
      model: "meta/llama-3.1-70b-instruct",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    };

    const llmResponse = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', llmPayload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const content = llmResponse.data.choices[0].message.content.trim();

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