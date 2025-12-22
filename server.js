const express = require('express');
const path = require('path');
const OpenAI = require("openai");
const cors = require('cors');
const admin = require("firebase-admin");

const app = express(); // ✅ Ye line zaroori hai, iske bina error aayega
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// --- FIREBASE SETUP ---
if (process.env.FIREBASE_KEY_JSON) {
    try {
        const serviceAccountEnv = JSON.parse(process.env.FIREBASE_KEY_JSON);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccountEnv) });
        console.log("✅ Firebase connected on Render");
    } catch (error) {
        console.error("❌ Firebase Warning: Key issue (Chat won't save, but app will run).");
    }
} else {
    // Local fallback
    try {
        const serviceAccount = require("./serviceAccountKey.json");
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log("✅ Firebase connected locally");
    } catch (e) {
        console.log("⚠️ No local Firebase key found.");
    }
}

const db = admin.apps.length ? admin.firestore() : null;

// --- OPENAI SETUP ---
const apiKey = process.env.OPENROUTER_API_KEY; 

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://astra.onrender.com",
    "X-Title": "Astra Astrology",
  }
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- API ROUTE (WITH LOGS) ---
app.post('/api/generate', async (req, res) => {
    try {
        console.log("📨 Request received...");

        if (!apiKey) {
            throw new Error("API Key is missing in Render Environment Variables!");
        }

        const userPrompt = req.body.prompt;
        
        // AI Call
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
                { role: "system", content: "You are a Vedic Astrologer. Keep it short." },
                { role: "user", content: userPrompt }
            ],
        });

        const reply = completion.choices[0]?.message?.content || "The stars are silent.";
        console.log("✅ AI replied successfully.");

        // Save to Firebase (Optional)
        if (db) {
            try {
                await db.collection('chats').add({
                    question: userPrompt,
                    answer: reply,
                    timestamp: new Date()
                });
            } catch (err) {
                console.error("⚠️ Firebase Save Error:", err.message);
            }
        }

        res.json({ text: reply });

    } catch (error) {
        console.error("🔥 Server Error:", error.message);
        // User ko asli error dikhayenge taaki pata chale kya hua
        res.status(500).json({ text: "Error: " + error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

