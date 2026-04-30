const { onRequest } = require("firebase-functions/v2/https");
const line = require("./utils/line");
const billingExtractor = require("./utils/billingExtractor");
const conversationalAi = require("./utils/conversationalAi");
const { db, storage } = require("./utils/firebaseAdmin");
const crypto = require("crypto");

exports.webhook = onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;

    // We get the base URL of our mini app from env, or default
    const liffUrl = process.env.LIFF_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-mini-app-domain.com";

    for (const event of events) {
      // Handle postback events (e.g. Confirm button)
      if (event.type === "postback") {
        const data = event.postback.data;
        if (data.startsWith("action=confirm&invoiceId=")) {
          const invoiceId = data.split("invoiceId=")[1];
          try {
            await db.collection("invoices").doc(invoiceId).update({
              extractionStatus: "verified",
              isUserVerified: true,
              updatedAt: new Date().toISOString()
            });
            await line.reply(event.replyToken, [{ type: "text", text: "Invoice saved and confirmed successfully. \nบันทึกข้อมูลบิลเรียบร้อยแล้ว" }]);
          } catch (error) {
            console.error("Error confirming invoice:", error);
            await line.reply(event.replyToken, [{ type: "text", text: "Failed to confirm invoice. \nเกิดข้อผิดพลาดในการยืนยันบิล" }]);
          }
        }
        return res.end();
      }

      if (event.type === "message") {
        if (event.message.type === "text") {
          try {
            const msg = await conversationalAi.chat(event.message.text);
            await line.reply(event.replyToken, [{ type: "text", text: msg }]);
          } catch (error) {
            console.error('Error processing text message:', error);
            try {
              await line.reply(event.replyToken, [{ type: "text", text: `เกิดข้อผิดพลาดในการประมวลผลข้อความ: ${error.message}` }]);
            } catch (replyError) {
              console.error('Failed to send error reply:', replyError);
            }
          }
          return res.end();
        }

        if (event.message.type === "image") {
          try {
            await line.reply(event.replyToken, [{ type: "text", text: "Processing your invoice image... \nกำลังประมวลผลรูปภาพบิลของคุณ..." }]);

            const imageBinary = await line.getImageBinary(event.message.id);

            // 1. Save original image to Firebase Storage
            const bucket = storage.bucket();
            const fileName = `invoices/original_${event.message.id}_${Date.now()}.jpg`;
            const file = bucket.file(fileName);
            await file.save(imageBinary, {
              metadata: { contentType: "image/jpeg" }
            });
            await file.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            // 2. Extract billing info using NVIDIA NIM
            const billingData = await billingExtractor.extractBillingInfo(imageBinary);

            // 3. Save to Firestore as pending review
            const invoiceRef = db.collection("invoices").doc();
            await invoiceRef.set({
              invoiceId: invoiceRef.id,
              lineUserId: event.source.userId,
              imageUrl: imageUrl,
              invoiceNumber: billingData.invoiceNumber || "-",
              billingDate: billingData.billingDate || "-",
              dueDate: billingData.dueDate || "-",
              vendorName: billingData.vendorName || "-",
              buildingName: billingData.buildingName || "-",
              totalAmount: billingData.totalAmount || 0,
              currency: billingData.currency || "THB",
              vatAmount: billingData.vatAmount || 0,
              extractionStatus: "pending_review",
              isUserVerified: false,
              aiExtractedJson: billingData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            // 4. Send Flex Message with Extracted Data and Confirm/Edit buttons
            const flexMessage = {
              type: "flex",
              altText: "Invoice Extraction Result",
              contents: {
                type: "bubble",
                header: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "Invoice Details",
                      weight: "bold",
                      size: "xl",
                      color: "#1DB446"
                    }
                  ]
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "No:", color: "#aaaaaa", size: "sm", flex: 1 },
                        { type: "text", text: billingData.invoiceNumber || "-", color: "#666666", size: "sm", flex: 3, wrap: true }
                      ]
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "Vendor:", color: "#aaaaaa", size: "sm", flex: 1 },
                        { type: "text", text: billingData.vendorName || "-", color: "#666666", size: "sm", flex: 3, wrap: true }
                      ]
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "Total:", color: "#aaaaaa", size: "sm", flex: 1 },
                        { type: "text", text: `${billingData.totalAmount || 0} ${billingData.currency || "THB"}`, color: "#666666", size: "sm", flex: 3, wrap: true }
                      ]
                    }
                  ]
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      action: {
                        type: "postback",
                        label: "Confirm (ยืนยัน)",
                        data: `action=confirm&invoiceId=${invoiceRef.id}`
                      }
                    },
                    {
                      type: "button",
                      style: "secondary",
                      action: {
                        type: "uri",
                        label: "Edit (แก้ไข)",
                        uri: `${liffUrl}/invoice/${invoiceRef.id}`
                      }
                    }
                  ]
                }
              }
            };

            // Push message since we already replied with "Processing..."
            await line.push(event.source.userId, [flexMessage]);

          } catch (error) {
            console.error('Error processing billing image:', error);
            await line.push(event.source.userId, [{ type: "text", text: `เกิดข้อผิดพลาดในการประมวลผลบิล: ${error.message}` }]);
          }
          return res.end();
        }

        break;
      }
    }
  }

  res.send(req.method);
});