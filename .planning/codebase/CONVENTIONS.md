# Conventions & Patterns

## Code Style
- **Language**: JavaScript (CommonJS modules)
- **Module system**: `require()` / `module.exports`
- **Async**: `async/await` throughout
- **Quotes**: Mixed double and single quotes across files
- **Semicolons**: Present but not strictly consistent

## Naming Conventions
- Functions: `camelCase` (e.g., `extractBillingInfo`, `appendBillingData`)
- Environment variables: `SCREAMING_SNAKE_CASE`
- Files: `camelCase.js`
- Module names match file names (e.g., `const gemini = require("./utils/gemini")`)

## Error Handling Patterns
### Vercel (`api/webhook.js`)
- Per-event try/catch blocks
- Nested try/catch for error replies (if LINE reply fails, logs but doesn't crash)
- 200 OK returned in all paths (LINE webhook contract)
- `console.error()` for all error paths

### Firebase (`functions/index.js`)
- Try/catch only around image processing path
- No error reply for text path — unhandled promise rejection risk
- `res.end()` used instead of explicit 200

## Environment Variables Used
| Variable | Used By |
|----------|---------|
| `CHANNEL_ACCESS_TOKEN` | `line.js` (both) |
| `API_KEY` | `gemini.js` (both) |
| `NVIDIA_NIM_API_KEY` | `billingExtractor.js` (both) |
| `NVIDIA_NIM_ENDPOINT` | `billingExtractor.js` (both) |
| `GOOGLE_SHEETS_CREDENTIALS` | `googleSheets.js` (both) |
| `GOOGLE_SHEETS_ID` | `googleSheets.js` (both) |
| `GOOGLE_SHEETS_RANGE` | `googleSheets.js` (both, optional) |
| `NODE_ENV` | `billingExtractor.js` (api only) |

## Comment Style
- Inline comments are sparse but present (e.g., `// LINE might send GET for verification`)
- JSDoc blocks present in `api/utils/billingExtractor.js` and `googleSheets.js`
- `functions/` utils lack JSDoc
