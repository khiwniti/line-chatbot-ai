const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
      model: "meta/llama-3.2-90b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is 1+1?" }
          ]
        }
      ],
      max_tokens: 1024
    }, {
      headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}` }
    });
    console.log(res.data.choices[0].message.content);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
