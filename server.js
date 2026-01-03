const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// CONNECT TO GOOGLE
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  systemInstruction: `
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
  `
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const result = await model.generateContent(message);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Too many response from others :(. Please try again later." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
