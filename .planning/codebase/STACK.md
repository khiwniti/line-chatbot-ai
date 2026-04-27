# Technology Stack

## Runtime & Platforms
- **Node.js**: Two declared engine versions in the same repo:
  - Root `package.json`: `24.x`
  - `functions/package.json`: `22`
- **Vercel**: Serverless function deployment via `api/webhook.js` (configured in `vercel.json`)
- **Cloud Functions for Firebase (2nd Gen)**: `functions/index.js` using `firebase-functions/v2/https`

## Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@google/genai` | `^1.27.0` | Google GenAI SDK (Gemini API) |
| `googleapis` | `^122.0.0` | Google Sheets API client |
| `axios` | `^1.13.1` | HTTP client for LINE API and NVIDIA NIM |
| `firebase-admin` | `^13.5.0` | Firebase Admin SDK (functions target) |
| `firebase-functions` | `^6.6.0` | Firebase Functions SDK v2 |

## External Services
- **LINE Messaging API**: Webhook receiver + reply messages + image content fetch
- **Google Gemini API**: Text generation (`gemini-2.5-flash`)
- **NVIDIA NIM**: Billing/invoice information extraction from images
- **Google Sheets API**: Append extracted billing data to spreadsheets

## Configuration Files
- `vercel.json`: Routes `/webhook` → `api/webhook.js` using `@vercel/node` builder
- `firebase.json`: Functions source directory = `functions/`
- `.env.local`: Environment variables (not committed)

## Node Version Conflict
The project declares **Node 24.x** at root but **Node 22** in `functions/package.json`. This is a potential deployment risk for Firebase Cloud Functions.
