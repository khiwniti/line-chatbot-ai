# Architecture

## Dual-Target Deployment
The codebase maintains **two functionally identical webhook handlers** for different deployment targets:

| Target | Handler | Error Handling | Node Engine |
|--------|---------|----------------|-------------|
| Vercel | `api/webhook.js` | Comprehensive (try/catch per event, error reply to user, 200 for LINE) | 24.x |
| Firebase | `functions/index.js` | Basic (single try/catch for image path, no error reply for text) | 22 |

## Module Structure
Both targets share the same utility module names but are **separate file copies**:
```
api/
  webhook.js        → Vercel handler
  utils/
    line.js         → LINE API client (axios)
    gemini.js       → Google GenAI wrapper
    billingExtractor.js  → NVIDIA NIM invoice extraction (full)
    googleSheets.js → Google Sheets append

functions/
  index.js          → Firebase v2 HTTPS function
  utils/
    line.js         → (identical to api/utils/line.js)
    gemini.js       → (identical to api/utils/gemini.js)
    billingExtractor.js  → NVIDIA NIM (simpler, returns raw data)
    googleSheets.js → (identical to api/utils/googleSheets.js)
```

## Data Flow
1. **LINE** sends webhook `POST /webhook` with `events[]`
2. **Handler** iterates events, switches on `event.type === "message"`
3. **Text messages**:
   - Call `gemini.textOnly(event.message.text)`
   - Call `line.reply(event.replyToken, [{type: "text", text: msg}])`
4. **Image messages**:
   - Call `line.getImageBinary(event.message.id)`
   - Call `billingExtractor.extractBillingInfo(imageBinary)`
   - Call `googleSheets.appendBillingData(billingData)`
   - Format confirmation message in Thai
   - Call `line.reply(event.replyToken, [{type: "text", text: confirmationMsg}])`

## Design Decisions
- **Always return HTTP 200**: LINE will retry on non-200, so all paths return 200 even on errors.
- **No persistent session/chat memory**: Each message is an independent Gemini call.
- **Thai language UI**: User-facing messages are in Thai (`บันทึกข้อมูลบิลเรียบร้อยแล้ว`).

## Known Issues
- **Code duplication**: `api/` and `functions/utils/` are near-duplicates. Maintenance requires editing both.
- **Syntax error** in `functions/index.js:5`: `const googleSheets = = require("./utils/googleSheets");` (double `=`) — will crash on Firebase deployment.
