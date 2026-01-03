const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 YOUR INSTRUCTIONS GO HERE
const SYSTEM_INSTRUCTION = "You are a helpful science and history tutor. Use Markdown (Bold, Lists, Headings) to format your answers clearly.";

app.post("/chat", async (req, res) => {
    const { message } = req.body;

    // 🕵️ DEBUG: Check if Key exists
    if (!process.env.API_KEY) {
        console.error("❌ ERROR: API_KEY is missing!");
        return res.status(500).json({ reply: "Server Error: API Key missing" });
    }

    try {
        // 🚀 DIRECT CALL TO GOOGLE (With Instructions)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // 1. Give the AI its personality
                    system_instruction: {
                        parts: { text: SYSTEM_INSTRUCTION }
                    },
                    // 2. Send the user's message
                    contents: [{ parts: [{ text: message }] }]
                })
            }
        );

        const data = await response.json();

        // Check for errors from Google
        if (data.error) {
            console.error("Google Error:", data.error);
            return res.status(500).json({ reply: "Error: " + data.error.message });
        }

        // Get the text answer
        const replyText = data.candidates[0].content.parts[0].text;
        res.json({ reply: replyText });

    } catch (error) {
        console.error("Server Crash:", error);
        res.status(500).json({ reply: "Server Internal Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
