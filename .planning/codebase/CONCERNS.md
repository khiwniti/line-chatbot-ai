# Concerns & Risks

## Critical Issues

### 1. Syntax Error in Firebase Handler
`functions/index.js:5`:
```javascript
const googleSheets = = require("./utils/googleSheets");
```
**Impact**: Firebase Cloud Function will crash on cold start. Deployment will fail or runtime errors will occur.

### 2. Missing LINE Webhook Signature Validation
Neither handler validates the `X-Line-Signature` header. This means **anyone can send fake webhook requests** to the endpoint.
**Impact**: Potential abuse, unauthorized message replies, billing extraction on arbitrary images.

### 3. Code Duplication (Maintenance Risk)
`api/utils/` and `functions/utils/` are ~90% identical copies. Changes to one must be manually synced to the other.
**Impact**: High risk of drift; current `billingExtractor.js` already differs between `api/` (full) and `functions/` (simplified).

## Security Concerns

| Issue | Severity | Details |
|-------|----------|---------|
| Webhook lacks signature check | **High** | LINE provides HMAC-SHA256 signature; not verified |
| Env vars loaded from `.env.local` | Medium | Standard practice, but verify `.gitignore` is correct |
| No rate limiting | Medium | Could be abused via repeated webhook calls |
| Error messages sent to user | Low | `error.message` leaked to LINE user in error replies |

## Deployment Concerns

- **Node version mismatch**: Root declares 24.x, Firebase Functions declare 22. Firebase may not support Node 24 yet.
- **No Firebase `package-lock.json`**: `functions/` has its own `package.json` but no lockfile — non-deterministic installs.
- **Vercel vs Firebase drift**: `api/webhook.js` has more robust error handling than `functions/index.js`. Behavior will differ between platforms.

## API/Integration Risks

- **NVIDIA NIM payload is guesswork**: The request payload (`inputs[].image`, `parameters.task`) is a generic template. Actual NIM endpoints vary significantly.
- **Gemini model pinned to `gemini-2.5-flash`**: If this model name changes or is deprecated, calls will fail.
- **Google Sheets row format is rigid**: Adding new billing fields requires updating both the extractor and the row formatter.
- **No retry logic**: If LINE reply fails, the message is lost. If Google Sheets append fails, billing data is lost.

## Operational Concerns

- **No logging framework**: Uses `console.error()` only. No structured logging or correlation IDs.
- **No health check endpoint**: `/webhook` returns 200 for GET but this is only for LINE verification, not app health.
- **No metrics/monitoring**: No APM, no latency tracking, no error rate dashboards.
- **Thai language hardcoded**: Not easily localizable for other markets.

## Debt Summary
- **Technical debt score**: Medium-High
- **Primary drivers**: Code duplication, missing tests, no webhook security, syntax error
