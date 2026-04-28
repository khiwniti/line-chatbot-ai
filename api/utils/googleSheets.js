// Google Sheets integration service
const { google } = require('googleapis');

/**
 * Initialize Google Sheets API client
 * @returns {google.auth.OAuth2|null} Authenticated client
 */
function getSheetsClient() {
  try {
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;

    if (!credentials) {
      throw new Error('Google Sheets credentials not configured');
    }

    // Parse credentials from JSON string
    const creds = JSON.parse(credentials);

    // Create JWT client for service account
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error.message);
    return null;
  }
}

/**
 * Append billing data to Google Sheet
 * @param {Object} billingData - Extracted billing information
 * @returns {Promise<Object>} Result from Google Sheets API
 */
async function appendBillingData(billingData) {
  try {
    const sheets = getSheetsClient();
    if (!sheets) {
      throw new Error('Failed to initialize Google Sheets client');
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:Z'; // Default to first sheet

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    // Convert billing data to array row
    // Assuming billingData is an object with known fields
    // We'll create a row with common billing fields in order
    const row = [
      billingData.date || '',
      billingData.shopName || '',
      billingData.vatId || '',
      billingData.billingType || '',
      JSON.stringify(billingData.itemList || []), // Store as JSON string
      billingData.totalBeforeVat || '',
      billingData.totalAfterVat || '',
      // Add more fields as needed based on extracted data structure
      // For simplicity, we'll also add a timestamp
      new Date().toISOString()
    ];

    const request = {
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error.message);
    throw new Error(`Google Sheets operation failed: ${error.message}`);
  }
}

module.exports = { appendBillingData };