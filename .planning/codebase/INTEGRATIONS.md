# Integrations

## LINE Messaging API
- **Entry point**: `POST /webhook` (both Vercel and Firebase)
- **Request body**: LINE event array (`events[]`) with `replyToken`, `message.type`, etc.
- **Capabilities used**:
  - `replyToken`-based message replies (`POST https://api.line.me/v2/bot/message/reply`)
  - Image content download (`GET https://api-data.line.me/v2/bot/message/{messageId}/content`)
- **Auth**: Bearer token via `CHANNEL_ACCESS_TOKEN` env var

## Google Gemini API
- **SDK**: `@google/genai` (GoogleGenAI)
- **Model**: `gemini-2.5-flash`
- **Features**:
  - Text-only generation (`textOnly()`)
  - Multimodal (unused in main flow, defined as `multimodal()`)
  - Chat with hardcoded Thai system persona (`chat()`)
- **Safety settings**: All 4 harm categories set to `BLOCK_ONLY_HIGH`

## NVIDIA NIM (Billing Extraction)
- **Env vars**: `NVIDIA_NIM_API_KEY`, `NVIDIA_NIM_ENDPOINT`
- **Input**: Binary image data (`Buffer`) from LINE image message
- **Output**: Extracted billing fields (date, shopName, vatId, billingType, itemList, totalBeforeVat, totalAfterVat)
- **Timeout**: 30 seconds (`axios`)
- **Payload**: Generic structure with `inputs[].image` (base64) and `parameters.task: 'information_extraction'` — may need adjustment for actual NIM endpoint

## Google Sheets
- **Auth**: Service account JSON credentials from `GOOGLE_SHEETS_CREDENTIALS` env var
- **Scope**: `https://www.googleapis.com/auth/spreadsheets`
- **Operation**: `spreadsheets.values.append` to `GOOGLE_SHEETS_ID` / `GOOGLE_SHEETS_RANGE`
- **Row format**: `[date, shopName, vatId, billingType, JSON.stringify(itemList), totalBeforeVat, totalAfterVat, timestamp]`

## Flow Diagram
```
LINE Webhook → Webhook Handler → Text? → Gemini API → Reply to LINE
                              → Image? → Download image → NVIDIA NIM (extract)
                                                     → Google Sheets (append)
                                                     → Reply confirmation to LINE
```
