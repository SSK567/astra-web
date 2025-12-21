const express = require('express');
const path = require('path');
const OpenAI = require("openai");
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// ✅ CORRECT WAY: Key ko variable se uthayenge
const apiKey = process.env.OPENROUTER_API_KEY; 

if (!apiKey) {
  console.error("Error: OPENROUTER_API_KEY is missing in Environment Variables!");
}

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
        if (!apiKey) {
            throw new Error("API Key is missing on server.");
        }
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
        console.error(error); // Error ko console mein print karein
        res.status(500).json({ text: "Error: " + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
