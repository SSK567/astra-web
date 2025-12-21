const express = require('express');
const path = require('path');
const OpenAI = require("openai");
const cors = require('cors');

const app = express();
// Render automatically assigns a port, or we use 3000 locally
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// ⚠️ IMPORTANT: Render par hum Key ko "Environment Variable" mein rakhenge
// Local testing ke liye aap yahan key likh sakte hain, par GitHub pe mat daliye
const apiKey = process.env.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 || "sk-or-AAPKI_KEY_YAHAN_DALEIN";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://astra.onrender.com",
    "X-Title": "Astra Astrology",
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/generate', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
                { role: "system", content: "You are a Vedic Astrologer. Keep it short." },
                { role: "user", content: req.body.prompt }
            ],
        });
        const reply = completion.choices[0]?.message?.content || "The stars are silent.";
        res.json({ text: reply });
    } catch (error) {
        res.status(500).json({ text: "Error: " + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
