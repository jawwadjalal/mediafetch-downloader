const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Multi-Source API Extractor Engine
async function fetchMediaData(videoUrl) {
    // Public Invidious / Piped API Endpoint
    const apiUrl = `https://pipedapi.kavin.rocks/streams/${encodeURIComponent(videoUrl.split('v=')[1] || videoUrl.split('/').pop())}`;
    const response = await fetch(apiUrl);
    return await response.json();
}

// 1. Video Info Endpoint
app.get('/api/info', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        const data = await fetchMediaData(videoUrl);

        if (!data || data.error) {
            return res.status(400).json({ error: 'Video details fetch nahi ho sakein. Direct main video link paste karein.' });
        }

        res.json({
            title: data.title || 'Media File Ready',
            uploader: data.uploader || 'Universal Extractor',
            duration: data.duration ? `${Math.floor(data.duration / 60)} mins` : 'HD Video',
            thumbnail: data.thumbnailUrl || (data.audioStreams && data.audioStreams[0] ? data.audioStreams[0].url : 'https://via.placeholder.com/400x225'),
            formats: data.videoStreams ? data.videoStreams.map(v => ({
                format_id: v.url,
                ext: v.mimeType.includes('mp4') ? 'mp4' : 'webm',
                resolution: v.quality || 'HD',
                filesize: 'Direct Stream'
            })) : [
                { format_id: 'direct', ext: 'mp4', resolution: 'HD Quality', filesize: 'Direct Stream' }
            ]
        });
    } catch (error) {
        console.error('Extraction Error:', error);
        res.status(500).json({ error: 'Engine response nahi de raha. Code link refresh karein.' });
    }
});

// 2. Direct Download Endpoint
app.get('/api/download', (req, res) => {
    let downloadUrl = req.query.format;
    if (!downloadUrl || downloadUrl === 'direct') {
        return res.status(400).send('Direct URL not found');
    }
    res.redirect(downloadUrl);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));