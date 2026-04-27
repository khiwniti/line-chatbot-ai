# Project Structure

```
LINE-Chatbot-x-Gemini-API/
├── .claude/                 # Empty directory
├── .env.local               # Environment variables (not in git)
├── .git/                    # Git repository
├── .gitignore               # Node modules, env files, etc.
├── .vercel/                 # Vercel deployment metadata
├── LICENSE                  # Standard license
├── README.md                # Project overview & setup instructions
├── billing_extraction_design.md   # Design document for billing feature
├── firebase.json            # Firebase Functions configuration
├── vercel.json              # Vercel routing/build config
├── package.json             # Root dependencies (Node 24.x)
├── package-lock.json        # Lockfile
│
├── api/                     # Vercel serverless functions
│   ├── webhook.js           # Main webhook handler (Vercel)
│   └── utils/
│       ├── billingExtractor.js   # NVIDIA NIM extraction (full impl)
│       ├── gemini.js             # Google GenAI wrapper
│       ├── googleSheets.js       # Google Sheets integration
│       └── line.js               # LINE Messaging API client
│
└── functions/               # Firebase Cloud Functions
    ├── .gitignore
    ├── index.js             # Main HTTPS function (Firebase)
    ├── package.json         # Functions dependencies (Node 22)
    └── utils/
        ├── billingExtractor.js   # NVIDIA NIM extraction (simpler)
        ├── gemini.js             # Copy of api/utils/gemini.js
        ├── googleSheets.js       # Copy of api/utils/googleSheets.js
        └── line.js               # Copy of api/utils/line.js
```

## File Count
- JavaScript source: 10 files (2 handlers + 8 utility copies)
- Config: 4 files (`package.json`, `package-lock.json`, `firebase.json`, `vercel.json`)
- Docs: 2 files (`README.md`, `billing_extraction_design.md`)

## Size Summary
- Largest file: `package-lock.json` (~125KB)
- Utility modules: ~2-4KB each
- Handlers: ~2-4KB each
