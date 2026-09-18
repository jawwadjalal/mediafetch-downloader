const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Info Endpoint
app.get('/api/info', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await fetch('https://api.cobalt.tools/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: videoUrl })
        });

        const data = await response.json();

        if (data.status === 'error') {
            return res.status(400).json({ error: data.text || 'Video details fetch nahi ho sakein.' });
        }

        res.json({
            title: 'Media File Ready',
            uploader: 'Universal Extractor',
            duration: 'HD Quality',
            thumbnail: 'https://via.placeholder.com/400x225?text=Media+Ready',
            formats: [
                {
                    format_id: 'direct',
                    ext: 'mp4',
                    resolution: 'Best Resolution',
                    filesize: 'Direct Stream'
                }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: 'Engine response nahi de raha.' });
    }
});

// 2. Download Endpoint
app.get('/api/download', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('URL is required');

    try {
        const response = await fetch('https://api.cobalt.tools/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: videoUrl })
        });
        const data = await response.json();
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