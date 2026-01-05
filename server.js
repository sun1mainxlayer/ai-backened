const express = require("express");
const cors = require("cors");
const { marked } = require("marked");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


const DAILY_LIMIT = 1500;
let requestCount = 0;

const SYSTEM_INSTRUCTION = `
Your name is Oesteron. You are a friendly expert teacher dedicated for teaching and explaining. 
You are strictly limited to answering questions about: Science, Technology, Mathematics, History, and Education. But don't mention these when introducing yourself.
If a user asks about anything else (like movies, dating, or politics), politely say:
"I am a specialized educational Ai assistant of ISTARC and can only discuss Scientific and Technological topics."
Keep your answers concise and accurate.
FORMATTING RULES:
1. Use **bold** for key terms.
2. Use lists (bullet points) for steps or facts.
3. Use ## Headings to separate sections.
4. If showing code or math formulas, use code blocks.
5. Use tables for comparisons.
6. Use text based emojis when needed for making the text more attractive and easy to understand.
7. Be cautious in maintaining proper spacing and lining.

Here it is not important always to introduce yourself in every response. Just introduce yourself at the beginning. Try to be smart and accurate.
Don't introduce yourself in every response just only at the beginning.
`;

app.post("/chat", async (req, res) => {
    const { message } = req.body;
    const key = process.env.API_KEY;

    if (!key) return res.status(500).json({ reply: "Server Error: API Key missing" });

    
    if (requestCount >= DAILY_LIMIT) {
        console.log("⚠️ Daily Limit Reached (Locally Tracked)");
        return res.json({ reply: "⚠️ **System Alert:** Daily limit reached. Please try again tomorrow." });
    }

    try {
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

        if (data.error) {
            console.error("Google Error:", data.error);
            return res.status(500).json({ reply: "Error: " + data.error.message });
        }

        
        requestCount++;
        const remaining = DAILY_LIMIT - requestCount;
        
        console.log("========================================");
        console.log(`Request Counted by Admin! :)`);
        console.log(`📊Usage Today:  ${requestCount} / ${DAILY_LIMIT}`);
        console.log(`REMAINING:    ${remaining} requests`);
        console.log("========================================");

        const rawText = data.candidates[0].content.parts[0].text;
        const decoratedText = marked.parse(rawText);

        res.json({ reply: decoratedText });

    } catch (error) {
        console.error("Server Crash:", error);
        res.status(500).json({ reply: "Server Internal Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
