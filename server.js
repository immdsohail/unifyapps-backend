const WebSocket = require('ws');
global.WebSocket = WebSocket;

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// The API Endpoint
app.post('/api/submit-complaint', async (req, res) => {
    console.log("\n--- NEW COMPLAINT RECEIVED ---");
    const { name, email, complaint } = req.body;

    try {
        // 1. Save to Supabase Database
        console.log("Saving to Supabase...");
        const { data, error } = await supabase
            .from('complaints')
            .insert([{ name, email, complaint }]);

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }
        console.log("✅ Supabase: Data saved successfully!");

        // 2. Send WhatsApp via UltraMsg
        console.log("Sending to UltraMsg...");
        
        const ultraMsgUrl = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`;
        
        // Send the request using axios with params (GET request)
        const ultraMsgResponse = await axios.get(ultraMsgUrl, {
            params: {
                token: process.env.ULTRAMSG_TOKEN,
                to: '916281692964',
                body: `New Complaint!\nName: ${name}\nEmail: ${email}\nMessage: ${complaint}`
            }
        });

        console.log("✅ UltraMsg Reply:", ultraMsgResponse.data);

        // 3. Send success back to the website
        res.status(200).json({ success: true, message: "Complaint saved and WhatsApp sent!" });

    } catch (err) {
        console.error("❌ FATAL SERVER ERROR:", err.message);
        res.status(500).json({ success: false, message: "Something went wrong on the server." });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// This keeps the terminal open if there is an unhandled error
process.stdin.resume();