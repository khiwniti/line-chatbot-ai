# Billing Information Extraction Design

## Understanding Summary

**What is being built**: An enhancement to the LINE Chatbot x Gemini API system that extracts billing information from images (receipts, invoices, bills) and saves the extracted data to Google Sheets.

**Why it exists**: To automate the process of extracting accounting information from billing documents for easier record-keeping and expense tracking.

**Who it is for**: Accounting departments or individuals who need to process billing documents regularly.

**Key constraints**:
- Must use NVIDIA NIM with the best available model for information extraction
- Must integrate with Google Sheets for data storage
- Must handle various billing document types (receipts, invoices, bills)
- Must extract comprehensive accounting fields

**Explicit non-goals**:
- Real-time processing of streaming video
- Multi-language OCR beyond what NVIDIA NIM provides
- Complex financial analysis beyond field extraction

## Assumptions

1. **Performance expectations**: Processing time under 5 seconds per document for reasonable image sizes
2. **Scale**: Expected to handle 10-100 documents per day per user
3. **Security/Privacy**: 
   - Images processed temporarily, not stored permanently
   - Google Sheets access via service account with appropriate permissions
   - No PII stored beyond what's necessary for billing extraction
4. **Reliability**: 
   - Graceful degradation when NVIDIA NIM service is unavailable
   - Clear error messages for failed extractions
   - Retry mechanism for transient failures
5. **Maintenance**: 
   - Monthly review of extraction accuracy
   - Quarterly updates to NVIDIA NIM model if better versions become available

## Decision Log

| Decision | Alternatives Considered | Why This Option Was Chosen |
|----------|------------------------|----------------------------|
| **Main purpose** | Extract billing info and save to various destinations (CSV, email, database) | User specifically requested Google Sheets integration for easy access and collaboration |
| **Document types** | Limited to receipts only, or invoices only | User needs flexibility to handle all common billing document types in accounting |
| **Extraction approach** | 1. Direct extraction with NVIDIA NIM (Approach A)<br>2. Hybrid extraction with NVIDIA NIM + Gemini (Approach B)<br>3. Traditional OCR + rule-based parsing | Approach A chosen for simplicity and leveraging NVIDIA NIM's strengths in document understanding without unnecessary complexity |
| **Fields to extract** | Predefined fixed set, or user-configurable fields | User indicated they need "all information necessary for accounting department" suggesting comprehensive extraction is preferred |
| **Error handling** | Fail silently, or throw exceptions | Chose to provide clear error feedback to users while maintaining system stability |
| **Integration method** | Direct API calls to NVIDIA NIM, or via intermediary service | Direct API calls chosen for simplicity and reduced latency in this Firebase Cloud Functions environment |

## Final Design

### High-Level Architecture and Data Flow

1. **Image Reception**: LINE Messaging API sends image message to Firebase Cloud Function webhook
2. **Image Processing**: 
   - Download binary image data from LINE
   - Send image to NVIDIA NIM API for information extraction
3. **Data Extraction**: 
   - NVIDIA NIM processes the image and extracts all requested billing fields
   - Returns structured JSON with extracted information
4. **Data Storage**: 
   - Format extracted data for Google Sheets
   - Append new row to designated Google Sheet
5. **Response**: 
   - Send confirmation message to user via LINE
   - Include summary of extracted information

### Component Details

#### 1. LINE Webhook Handler (`functions/index.js`)
- Enhanced to detect and process image messages
- Calls new billing extraction service
- Returns appropriate responses to LINE platform

#### 2. Billing Extraction Service (new file: `functions/utils/billingExtractor.js`)
- Handles communication with NVIDIA NIM API
- Processes image data and sends to NIM endpoint
- Parses NIM response into structured billing data
- Includes error handling and retry logic

#### 3. Google Sheets Integration (new file: `functions/utils/googleSheets.js`)
- Uses Google Sheets API with service account
- Authenticates using environment variables
- Provides function to append billing data to sheet
- Includes batching for efficiency if needed

#### 4. Configuration
- New environment variables:
  - `NVIDIA_NIM_API_KEY`: Authentication for NVIDIA NIM service
  - `NVIDIA_NIM_ENDPOINT`: URL for the specific NIM model endpoint
  - `GOOGLE_SHEETS_CREDENTIALS`: Service account credentials JSON
  - `GOOGLE_SHEETS_ID`: Target spreadsheet ID
  - `GOOGLE_SHEETS_RANGE`: Target range/sheet name

### Error Handling and Implementation Notes

#### Error Handling Strategy
1. **Image Download Failures**: 
   - Log error, notify user of failed image retrieval
2. **NVIDIA NIM Service Unavailable**:
   - Retry up to 3 times with exponential backoff
   - Notify user if service remains unavailable
   - Suggest trying again later
3. **Extraction Errors/Poor Results**:
   - Return whatever data was extracted with confidence indicators
   - Allow user to manually correct or retry
4. **Google Sheets API Errors**:
   - Retry transient errors
   - Notify user of persistent storage failures
   - Consider queuing mechanism for failed writes

#### Performance Considerations
1. **Image Size**: 
   - Limit maximum image size to 10MB to prevent timeouts
   - Resize large images if needed before sending to NIM
2. **API Calls**:
   - Cache NVIDIA NIM model metadata if applicable
   - Batch Google Sheets updates when processing multiple images
3. **Concurrency**:
   - Firebase Functions handle concurrent requests automatically
   - Ensure NVIDIA NIM API keys have sufficient rate limits

#### Implementation Steps
1. Add new utility files for billing extraction and Google Sheets integration
2. Modify `index.js` to handle image messages and call extraction service
3. Update `package.json` to add required dependencies:
   - `@google-apps/api-clients` for Google Sheets API
   - `axios` (already present) for HTTP calls to NVIDIA NIM
4. Set up environment variables in Firebase console
5. Deploy updated functions
6. Test with sample billing documents
7. Monitor extraction accuracy and adjust as needed

## Next Steps

1. Implement the design as outlined above
2. Create test cases with various billing document types
3. Set up monitoring for extraction accuracy and performance
4. Gather user feedback on usability and usefulness
5. Iterate based on real-world usage patterns
