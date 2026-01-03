const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_INSTRUCTION = "You are a friendly science tutor.";

// 🩺 THE DOCTOR: Run this automatically when server starts
async function checkAvailableModels() {
    console.log("------------------------------------------");
    console.log("🩺 DOCTOR: Checking available models...");
    const key = process.env.API_KEY;
    
    if (!key) {
        console.error("❌ ERROR: API Key is MISSING in Render!");
        return;
    }

    try {
        // Ask Google for the list of models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ GOOGLE BLOCKED US:", data.error.message);
        } else if (data.models) {
            console.log("✅ SUCCESS! Access granted to these models:");
            // Print the names of the models you are allowed to use
            data.models.forEach(m => {
                if (m.name.includes("gemini")) console.log(`   👉 ${m.name}`);
            });
        } else {
            console.error("⚠️ WEIRD: No models found (but no error).");
        }
    } catch (err) {
        console.error("❌ NETWORK CRASH:", err);
    }
    console.log("------------------------------------------");
}

// Run the check immediately
checkAvailableModels();

app.post("/chat", async (req, res) => {
    const { message } = req.body;
    try {
        // We will try the most common model 'gemini-1.5-flash'
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: SYSTEM_INSTRUCTION + "\n\n" + message }] }]
                })
            }
        );
        const data = await response.json();
        
        if (data.error) return res.status(500).json({ reply: "Error: " + data.error.message });
        res.json({ reply: data.candidates[0].content.parts[0].text });

    } catch (error) {
        res.status(500).json({ reply: "Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
