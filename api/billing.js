const { google } = require('googleapis');

/**
 * Initialize Google Sheets API client
 * @returns {google.auth.OAuth2|null} Authenticated client
 */
function getSheetsClient() {
  try {
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;

    if (!credentials) {
      console.warn('Google Sheets credentials not configured');
      return null;
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
 * Get billing data from Google Sheet
 * @returns {Promise<Array>} Array of rows (each row is an array of cell values)
 */
async function getBillingData() {
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

    const request = {
      spreadsheetId: spreadsheetId,
      range: range
    };

    const response = await sheets.spreadsheets.values.get(request);
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error.message);
    throw new Error(`Google Sheets operation failed: ${error.message}`);
  }
}

// Vercel handler - export as default function
module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // Optional: simple token protection (set ADMIN_TOKEN env var)
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== adminToken) {
      return res.status(401).send('Unauthorized');
    }
  }

  try {
    const data = await getBillingData();
    // Return as JSON
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};