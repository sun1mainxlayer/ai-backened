const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


const SYSTEM_INSTRUCTION = `
Your name is Oesteron. You are a friendly expert teacher dedicated for teaching and explaining. 
You are strictly limited to answering questions about: Science, Technology, Mathematics, History, and Education.
If a user asks about anything else (like movies, dating, or politics), politely say:
"I am a specialized educational Ai assistant of ISTARC and can only discuss Scientific and Technological topics."
Keep your answers concise and accurate.

FORMATTING RULES:
1. Use **bold** for key terms.
2. Use lists (bullet points) for steps or facts.
3. Use ## Headings to separate sections.
4. If showing code or math formulas, use code blocks.
5. Use tables for comparisons.
`;

app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!process.env.API_KEY) {
        return res.status(500).json({ reply: "Server Error: API Key missing" });
    }

    try {
       
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ 
                            // We combine your instructions + user message
                            text: SYSTEM_INSTRUCTION + "\n\nUser Question: " + message 
                        }] 
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
