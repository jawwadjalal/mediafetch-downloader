const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper function for Cobalt API Request
async function callCobalt(videoUrl) {
    const response = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
            url: videoUrl,
            videoQuality: 'max',
            youtubeVideoCodec: 'h264'
        })
    });
    return await response.json();
}

// 1. Info Endpoint
app.get('/api/info', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        const data = await callCobalt(videoUrl);

        if (data.status === 'error' || data.text) {
            return res.status(400).json({ error: data.text || 'Video details fetch nahi ho sakein.' });
        }

        res.json({
            title: 'Media File Ready',
            uploader: 'Universal Media Extractor',
            duration: 'HD Quality',
            thumbnail: 'https://via.placeholder.com/400x225?text=Media+Ready',
            formats: [
                {
                    format_id: 'direct',
                    ext: 'mp4',
                    resolution: 'Best Quality (HD/4K)',
                    filesize: 'Direct Stream'
                }
            ]
        });
    } catch (error) {
        console.error('Cobalt Error:', error);
        res.status(500).json({ error: 'Engine response nahi de raha. Link check karein.' });
    }
});

// 2. Download Endpoint
app.get('/api/download', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('URL is required');

    try {
        const data = await callCobalt(videoUrl);
        if (data.url) {
            res.redirect(data.url);
        } else {
            res.status(500).send('Download link generate nahi ho saka.');
        }
    } catch (e) {
        res.status(500).send('Error processing download');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));