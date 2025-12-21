app.post('/api/generate', async (req, res) => {
    try {
        console.log("Request received. Checking API Key..."); // Log 1

        if (!apiKey) {
            console.error("❌ Error: API Key missing in environment variables.");
            throw new Error("Server API Key is missing.");
        }

        console.log("Sending request to OpenRouter..."); // Log 2
        
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
                { role: "system", content: "You are a Vedic Astrologer. Keep it short." },
                { role: "user", content: req.body.prompt }
            ],
        });

        console.log("Response received from OpenRouter."); // Log 3
        
        const reply = completion.choices[0]?.message?.content;
        
        if (!reply) {
            console.error("❌ Error: Empty response from AI.");
            throw new Error("AI sent empty response.");
        }

        // Firebase saving (optional block)
        if (db) {
            try {
                await db.collection('chats').add({
                    question: req.body.prompt,
                    answer: reply,
                    timestamp: new Date()
                });
            } catch (e) { console.error("Firebase save error (ignoring):", e.message); }
        }

        res.json({ text: reply });

    } catch (error) {
        console.error("🔥 CRITICAL ERROR:", error); // Ye log mein dikhega
        // Ab frontend par asli error dikhega
        res.status(500).json({ text: `Error details: ${error.message || error}` });
    }
});
