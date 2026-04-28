// Billing extraction service using NVIDIA NIM
const axios = require('axios');

/**
 * Extract billing information from an image using NVIDIA NIM
 * @param {Buffer} imageBinary - Binary image data
 * @returns {Promise<Object>} Standardized extraction result with metadata
 */
async function extractBillingInfo(imageBinary) {
  try {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    const endpoint = process.env.NVIDIA_NIM_ENDPOINT;

    if (!apiKey || !endpoint) {
      throw new Error('NVIDIA NIM API key or endpoint not configured');
    }

    // Convert image to base64
    const base64Image = imageBinary.toString('base64');

    // Prepare request payload for NVIDIA NIM
    // Assuming the NIM endpoint expects a JSON with image data
    const payload = {
      // Adjust based on actual NIM API specification
      // Common format for vision models:
      inputs: [
        {
          // Example for NVIDIA NIM, may vary
          // Some NIMs expect "image" field with base64
          // We'll use a generic structure; user may need to adjust
          image: base64Image
        }
      ],
      // Parameters for extraction
      parameters: {
        // Example: extract all fields
        // This will depend on the specific NIM model used
        // User should configure the NIM appropriately for billing extraction
        task: 'information_extraction',
        // Possibly specify schema or prompt
      }
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    });

    // Assuming response.data contains extracted fields
    // Adjust based on actual NIM response format
    const rawExtractedData = response.data;

    // If NIM returns wrapped response, unwrap accordingly
    // For example: { predictions: [...] } or { output: {...} }
    // We'll assume the extracted data is directly in response.data
    // User may need to adjust this part based on actual NIM output

    // Standardize the extraction result
    const extractionResult = {
      // Raw data from NIM (for debugging/reference)
      raw: rawExtractedData,

      // Standardized billing fields (extract from raw data based on common patterns)
      // This assumes NIM returns an object with these fields directly
      // Adjust mapping based on actual NIM response structure
      date: rawExtractedData.date || rawExtractedData.transaction_date || rawExtractedData.billing_date || '',
      shopName: rawExtractedData.shop_name || rawExtractedData.vendor || rawExtractedData.merchant || rawExtractedData.store || '',
      vatId: rawExtractedData.vat_id || rawExtractedData.tax_id || rawExtractedData.vat_number || '',
      billingType: rawExtractedData.billing_type || rawExtractedData.document_type || rawExtractedData.invoice_type || '',
      itemList: Array.isArray(rawExtractedData.items) ? rawExtractedData.items :
                Array.isArray(rawExtractedData.item_list) ? rawExtractedData.item_list :
                Array.isArray(rawExtractedData.line_items) ? rawExtractedData.line_items : [],
      totalBeforeVat: rawExtractedData.subtotal || rawExtractedData.total_before_vat || rawExtractedData.amount_without_tax || 0,
      totalAfterVat: rawExtractedData.total || rawExtractedData.total_after_vat || rawExtractedData.amount_with_tax || 0,

      // Metadata about the extraction
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'nvidia_nim',
        endpoint: endpoint,
        // Add confidence if NIM provides it
        confidence: rawExtractedData.confidence || rawExtractedData.score || null
      }
    };

    // Log extraction result for debugging (in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Billing extraction result:', JSON.stringify(extractionResult, null, 2));
    }

    return extractionResult;
  } catch (error) {
    console.error('Error in billing extraction:', error.message);
    // Re-throw with more context
    throw new Error(`Billing extraction failed: ${error.message}`);
  }
}

module.exports = { extractBillingInfo };