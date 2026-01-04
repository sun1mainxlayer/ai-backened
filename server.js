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

app.post("/chat", async (req, res) => {
    const { message } = req.body;
    const key = process.env.API_KEY;

    if (!key) {
        return res.status(500).json({ reply: "Server Error: API Key missing" });
    }

    try {
        // 🚀 TARGET: GEMINI 2.5 FLASH (The FREE model from your list)
        // We are NOT using "Pro" this time.
        const modelName = "gemini-2.5-flash"; 

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

        // 🚨 DEBUG: Print the exact error if it fails
        if (data.error) {
            console.error("Google Refused:", data.error);
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
