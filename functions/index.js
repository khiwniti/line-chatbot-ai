const {onRequest} = require("firebase-functions/v2/https");
const line = require("./utils/line");
const gemini = require("./utils/gemini");
const billingExtractor = require("./utils/billingExtractor");
const googleSheets = = require("./utils/googleSheets");

exports.webhook = onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;
    for (const event of events) {
      switch (event.type) {
        case "message":

          if (event.message.type === "text") {
            const msg = await gemini.textOnly(event.message.text);
            // const msg = await gemini.chat(event.message.text);
            await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            return res.end();
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
              await line.reply(event.replyToken, [{ type: "text", text: confirmationMsg }]);
            } catch (error) {
              console.error('Error processing billing image:', error);
              await line.reply(event.replyToken, [{ type: "text", text: `เกิดข้อผิดพลาดในการประมวลผลบิล: ${error.message}` }]);
            }
            return res.end();
          }

          break;
      }
    }
  }

  res.send(req.method);
});