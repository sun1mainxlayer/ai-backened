const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_INSTRUCTION = `
Your name is Oesteron. You are a friendly expert teacher dedicated for teaching and explaining. 
You are strictly limited to answering questions about: Science, Technology, Mathematics, History, and Education.
If a user asks about anything else, politely refuse.
FORMATTING RULES: Use **bold** for key terms, lists, and code blocks where needed.
`;

// 🤖 AUTO-DETECT: Find a model that actually works for YOU
async function getValidModel(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (!data.models) return null;

        // 1. Look for "Flash" (Fastest)
        const flash = data.models.find(m => m.name.includes("gemini-1.5-flash"));
        if (flash) return flash.name;

        // 2. Look for "Pro" (Standard)
        const pro = data.models.find(m => m.name.includes("gemini-pro"));
        if (pro) return pro.name;

        // 3. Last Resort: Pick ANY model that generates text
        const anyModel = data.models.find(m => m.supportedGenerationMethods.includes("generateContent"));
        return anyModel ? anyModel.name : null;
    } catch (e) {
        return null;
    }
}

app.post("/chat", async (req, res) => {
    const { message } = req.body;
    const key = process.env.API_KEY;

    if (!key) return res.status(500).json({ reply: "Server Error: API Key missing" });

    try {
        // 🔍 Step 1: Ask Google which model allows us to enter
        console.log("🔍 Finding a working model...");
        let modelName = await getValidModel(key);

        if (!modelName) {
            console.error("❌ CRITICAL: No models available for this API Key.");
            return res.status(500).json({ reply: "Error: Your Google Account has no access to Gemini models." });
        }
        
        console.log(`✅ Using Model: ${modelName}`);

        // 🚀 Step 2: Send the message to THAT model
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ text: SYSTEM_INSTRUCTION + "\n\nUser Question: " + message }] 
                    }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Google Error:", data.error);
            return res.status(500).json({ reply: "Error: " + data.error.message });
        }

        const replyText = data.candidates[0].content.parts[0].text;
        res.json({ reply: replyText });

    } catch (error) {
        console.error("Server Crash:", error);
        res.status(500).json({ reply: "Server Internal Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
