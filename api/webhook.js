const line = require("./utils/line");
const conversationalAi = require("./utils/conversationalAi");
const billingExtractor = require("./utils/billingExtractor");
const supabase = require("./utils/supabase");

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
        // Handle postback events (e.g. Confirm button)
        if (event.type === "postback") {
          const data = event.postback.data;
          if (data.startsWith("action=confirm&invoiceId=")) {
            const invoiceId = data.split("invoiceId=")[1];
            try {
              const { error } = await supabase
                .from("invoices")
                .update({
                  extractionStatus: "verified",
                  isUserVerified: true,
                  updatedAt: new Date().toISOString()
                })
                .eq('id', invoiceId);

              if (error) throw error;
              await line.reply(event.replyToken, [{ type: "text", text: "Invoice saved and confirmed successfully. \nบันทึกข้อมูลบิลเรียบร้อยแล้ว" }]);
            } catch (error) {
              console.error("Error confirming invoice:", error);
              await line.reply(event.replyToken, [{ type: "text", text: "Failed to confirm invoice. \nเกิดข้อผิดพลาดในการยืนยันบิล" }]);
            }
          }
          return res.status(200).send("OK");
        }

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
                const msg = await conversationalAi.chat(event.message.text);
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

                await line.reply(replyToken, [{ type: "text", text: "Processing your invoice image... \nกำลังประมวลผลรูปภาพบิลของคุณ..." }]);

                // Extract billing info using NVIDIA NIM
                const billingData = await billingExtractor.extractBillingInfo(imageBinary);

                // Optional: Save original image to Supabase Storage if you have a bucket
                // For now, we omit the image save since we don't know the exact Supabase bucket setup
                const imageUrl = "-";

                const invoiceRecord = {
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
                };

                // Save to Supabase
                const { data: insertedData, error: dbError } = await supabase
                  .from('invoices')
                  .insert([invoiceRecord])
                  .select();

                if (dbError) {
                  throw new Error(`Supabase operation failed: ${dbError.message}`);
                }

                const invoiceId = insertedData && insertedData.length > 0 ? insertedData[0].id : "unknown";

                const liffUrl = process.env.LIFF_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-mini-app-domain.com";

                // Prepare confirmation flex message
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
                            data: `action=confirm&invoiceId=${invoiceId}`
                          }
                        },
                        {
                          type: "button",
                          style: "secondary",
                          action: {
                            type: "uri",
                            label: "Edit (แก้ไข)",
                            uri: `${liffUrl}/invoice/${invoiceId}`
                          }
                        }
                      ]
                    }
                  }
                };

                // Send reply to user via LINE API using push instead of reply
                // since replyToken might be consumed or expired
                await line.push(event.source.userId, [flexMessage]);
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