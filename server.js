const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS securely so your frontend can connect
app.use(cors({
    origin: '*', 
    methods: ['POST', 'GET']
}));
app.use(express.json());

// Main Extractor API Endpoint
app.post('/api/extract', async (req, res) => {
    const { url, format } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Source target URL parameter is required' });
    }

    try {
        // Resolve platform
        let platform = "YouTube";
        if (url.includes('instagram.com')) platform = "Instagram";
        if (url.includes('facebook.com') || url.includes('fb.watch')) platform = "Facebook";

        // Route requests through Cobalt API engines (100% free, no keys needed)
        const targetEngine = "https://api.cobalt.tools"; 
        
        const fetchResponse = await fetch(targetEngine, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                videoQuality: '1080', 
                audioFormat: 'mp3',   
                isAudioOnly: format === 'mp3' ? true : false,
                isNoTTWatermark: true 
            })
        });

        if (!fetchResponse.ok) {
            throw new Error(`External extractor status mismatch: ${fetchResponse.status}`);
        }

        const externalData = await fetchResponse.json();

        // Check for private video errors
        if (externalData.status === 'error' || externalData.status === 'picker') {
            return res.status(422).json({ 
                error: 'Extractor engine could not read video tracks. Ensure the post is set to public.' 
            });
        }

        // Send the data back to your website
        res.json({
            title: externalData.text || `${platform} Media Extraction`,
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
            duration: "N/A",
            size: format === 'mp3' ? "128kbps Stream" : "1080p HD Stream",
            platform: platform,
            format: format.toUpperCase(),
            downloadUrl: externalData.url, 
            filename: `lumifetch_${platform.toLowerCase()}_${Date.now()}.${format}`
        });

    } catch (err) {
        console.error('Extraction error processing request:', err.message);
        res.status(500).json({ 
            error: 'Failed to negotiate stream with the target extractor nodes.',
            details: err.message 
        });
    }
});

// Server check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'active', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`LumiFetch secure proxy engine online on port ${PORT}`);
});
