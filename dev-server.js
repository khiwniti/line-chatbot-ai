const express = require("express");
const webhook = require("./api/webhook");

const app = express();
app.use(express.json());

// Mount the webhook handler
app.all("/webhook", async (req, res) => {
  await webhook(req, res);
});

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "LINE Chatbot AI is running", endpoints: ["/webhook"] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  Server running at http://localhost:${PORT}`);
  console.log(`  Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`  Test with: curl -X POST http://localhost:${PORT}/webhook \\\n    -H "Content-Type: application/json" \\\n    -d '{"events":[{"type":"message","replyToken":"test","message":{"type":"text","text":"Hello"}}]}'\n`);
});
