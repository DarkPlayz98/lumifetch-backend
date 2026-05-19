const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// This single line destroys the CORS block for your mobile browser
app.use(cors({ origin: '*' })); 
app.use(express.json());

app.post('/api/extract', async (req, res) => {
    const { url, format } = req.body;
    const isAudio = format === 'mp3';

    // The Backend Fallback Network (Updated API endpoints!)
    const servers = [
        "https://api.cobalt.tools/api/json",
        "https://cobalt-api.kwiatekm.moe/api/json",
        "https://cobalt.qwy2.dev/api/json"
    ];

    for (let i = 0; i < servers.length; i++) {
        try {
            console.log(`Trying server ${i + 1}...`);
            const response = await fetch(servers[i], {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: '1080',
                    isAudioOnly: isAudio
                })
            });

            if (!response.ok) continue; // If blocked, instantly try the next one

            const data = await response.json();

            if (data.url) {
                // Success! Send the clean data back to your phone
                return res.json({
                    title: "LumiFetch Extracted Media",
                    platform: url.includes('instagram') ? 'Instagram' : url.includes('facebook') ? 'Facebook' : 'YouTube',
                    format: format.toUpperCase(),
                    downloadUrl: data.url
                });
            }
        } catch (err) {
            console.log(`Server ${i + 1} failed.`);
        }
    }

    // If literally every server fails
    return res.status(500).json({ error: 'All extractor engines are currently offline.' });
});

// Health check to wake the server up
app.get('/health', (req, res) => res.json({ status: 'active' }));

app.listen(PORT, () => console.log(`LumiFetch Backend running on port ${PORT}`));
