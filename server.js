const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Removes CORS blocks for your phone
app.use(cors({ origin: '*' })); 
app.use(express.json());

app.post('/api/extract', async (req, res) => {
    const { url, format } = req.body;
    const isAudio = format === 'mp3';

    // 🟢 THE FIX: Version 7 URLs (no more /api/json)
    const servers = [
        "https://api.cobalt.tools/", 
        "https://cobalt-api.kwiatekm.moe/",
        "https://cobalt.qwy2.dev/"
    ];

    for (let i = 0; i < servers.length; i++) {
        try {
            console.log(`Trying server ${i + 1}...`);
            const response = await fetch(servers[i], {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // 🟢 THE FIX: Spoofing a real web browser so they don't block Render
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: '1080',
                    isAudioOnly: isAudio
                })
            });

            if (!response.ok) {
                console.log(`Server ${i + 1} blocked us. Status: ${response.status}`);
                continue; // Move to the next backup server instantly
            }

            const data = await response.json();

            if (data.url) {
                // Success! Send the clean download link to your website
                return res.json({
                    title: "LumiFetch Media",
                    platform: url.includes('instagram') ? 'Instagram' : url.includes('facebook') ? 'Facebook' : 'YouTube',
                    format: format.toUpperCase(),
                    downloadUrl: data.url
                });
            }
        } catch (err) {
            console.log(`Server ${i + 1} completely failed.`);
        }
    }

    // If every single one fails
    return res.status(500).json({ error: 'All extractor engines are currently offline. Try again in 60 seconds.' });
});

// Health check to wake the server up
app.get('/health', (req, res) => res.json({ status: 'active' }));

app.listen(PORT, () => console.log(`LumiFetch Backend running on port ${PORT}`));
