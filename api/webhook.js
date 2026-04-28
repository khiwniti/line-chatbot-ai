const line = require("./utils/line");
const gemini = require("./utils/gemini");
const billingExtractor = require("./utils/billingExtractor");
const googleSheets = require("./utils/googleSheets");

// Vercel handler - export as default function
module.exports = async (req, res) => {
  // Handle GET requests for webhook verification (if needed by LINE)
  if (req.method === "GET") {
    // LINE might send GET for verification - respond with 200
    return res.status(200).send("OK");
  }

  if (req.method === "POST") {
    try {
      const events = req.body.events;
      if (!events || !Array.isArray(events)) {
        // Invalid request format - still return 200 so LINE doesn't retry
        console.error('Invalid request format:', req.body);
        return res.status(200).send("OK");
      }

      // Process each event (though LINE typically sends one event per webhook)
      for (const event of events) {
        switch (event.type) {
          case "message":
            // We need to extract replyToken early so we can use it for error replies
            const replyToken = event.replyToken;
            if (!replyToken) {
              console.error('No replyToken in event:', event);
              continue; // Skip this event but continue processing others
            }

            if (event.message.type === "text") {
              try {
                const msg = await gemini.textOnly(event.message.text);
                // Send reply to user via LINE API
                await line.reply(replyToken, [{ type: "text", text: msg }]);
              } catch (error) {
                console.error('Error processing text message:', error);
                // Try to send error message to user
                try {
                  await line.reply(replyToken, [{ type: "text", text: `เกิดข้อผิดพลาดในการประมวลผลข้อความ: ${error.message}` }]);
                } catch (replyError) {
                  console.error('Failed to send error reply:', replyError);
                }
              }
              // Always return 200 to LINE to acknowledge webhook receipt
              return res.status(200).send("OK");
            }

            if (event.message.type === "image") {
              try {
                const imageBinary = await line.getImageBinary(event.message.id);
                // Extract billing info using NVIDIA NIM
                const billingData = await billingExtractor.extractBillingInfo(imageBinary);
                // Save to Google Sheets
                await googleSheets.appendBillingData(billingData);
                // Prepare confirmation message
                const confirmationMsg = `บันทึกข้อมูลบิลเรียบร้อยแล้ว\nร้านค้า: ${billingData.shopName || '-'}\nวันที่: ${billingData.date || '-'}\nยอดรวมภาษี: ${billingData.totalAfterVat || '-'}`;
                // Send reply to user via LINE API
                await line.reply(replyToken, [{ type: "text", text: confirmationMsg }]);
              } catch (error) {
                console.error('Error processing billing image:', error);
                // Try to send error message to user
                try {
                  await line.reply(replyToken, [{ type: "text", text: `เกิดข้อผิดพลาดในการประมวลผลบิล: ${error.message}` }]);
                } catch (replyError) {
                  console.error('Failed to send error reply:', replyError);
                }
              }
              // Always return 200 to LINE to acknowledge webhook receipt
              return res.status(200).send("OK");
            }

            break;
          }
        }

      // If we get here, no valid message was processed
      return res.status(200).send("OK");
    } catch (error) {
      console.error('Webhook error:', error);
      // Still return 200 to LINE so they don't retry
      return res.status(200).send("OK");
    }
  }

  // For other methods (PUT, DELETE, etc.)
  return res.status(200).send("OK");
};