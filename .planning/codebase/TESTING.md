# Testing

## Current State
**No test framework is configured.** There are no test files, no test scripts in `package.json`, and no testing dependencies.

## Testability Assessment

### High Priority for Testing
1. **`api/webhook.js`** / **`functions/index.js`**:
   - LINE webhook signature verification is **absent** (security gap)
   - Request body parsing (`req.body.events`)
   - Event loop handling (multiple events)
   - Error branches (missing `replyToken`, invalid request format)

2. **`billingExtractor.js`**:
   - NVIDIA NIM response parsing is speculative (assumes flat object response)
   - Network timeout behavior
   - Missing env var handling

3. **`googleSheets.js`**:
   - Credential JSON parsing
   - Row formatting logic
   - API failure handling

4. **`gemini.js`**:
   - Safety settings configuration
   - Chat history hardcoding (could be tested for consistency)

### Suggested Testing Approach
- **Unit tests**: Mock `axios` for LINE API, mock `@google/genai` for Gemini
- **Integration tests**: Spin up local webhook server, send LINE-format JSON
- **E2E tests**: Use LINE Messaging API simulator or ngrok

## Firebase Testing
- `firebase emulators:start --only functions` is available via `npm run serve` in `functions/`
- No emulator test scripts or Jest configuration

## CI/CD
- No GitHub Actions or other CI configuration detected
- Vercel likely has automatic deploy on push (`.vercel/` present)
- Firebase deploy requires manual `firebase deploy --only functions`
