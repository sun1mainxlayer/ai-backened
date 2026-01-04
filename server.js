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


async function getValidModel(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (!data.models) return null;

        const modelList = data.models.map(m => m.name);
        console.log("📋 Available Models:", modelList); // Prints list to logs

        
        // We look for specific versions to avoid "latest" (which can be paid)
        if (modelList.some(name => name.includes("gemini-1.5-flash-001"))) return "gemini-1.5-flash-001";
        if (modelList.some(name => name.includes("gemini-1.5-flash"))) return "gemini-1.5-flash";


        if (modelList.some(name => name.includes("gemini-1.0-pro"))) return "gemini-1.0-pro";
        if (modelList.some(name => name.includes("gemini-pro") && !name.includes("latest") && !name.includes("vision"))) return "gemini-pro";

        return null;
    } catch (e) {
        console.error("Model check failed:", e);
        return null;
    }
}

app.post("/chat", async (req, res) => {
    const { message } = req.body;
    const key = process.env.API_KEY;

    if (!key) return res.status(500).json({ reply: "Server Error: API Key missing" });

    try {
      
        console.log("🔍 Hunting for a FREE model...");
        let modelName = await getValidModel(key);

        if (!modelName) {
            console.error("❌ ERROR: No free models found in your Google Account.");
            return res.status(500).json({ reply: "Error: No free AI models available." });
        }
        
       
        modelName = modelName.replace("models/", "");
        console.log(`✅ Locked on target: ${modelName}`);

      
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
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
            // Handle specific 429 error
            if (data.error.code === 429) {
                return res.status(500).json({ reply: "Error: AI is too busy. Please try again in 1 minute." });
            }
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

