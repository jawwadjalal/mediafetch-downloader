const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Array of active public Invidious instances for redundancy
const INSTANCES = [
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de',
    'https://invidious.drgns.space',
    'https://vid.puffyan.us'
];

async function fetchFromInvidious(videoId) {
    for (const instance of INSTANCES) {
        try {
            const res = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: 4000 });
            if (res.data && res.data.title) {
                return res.data;
            }
        } catch (e) {
            console.log(`Failed host ${instance}, trying next...`);
        }
    }
    return null;
}

// 1. Video Info Endpoint
app.get('/api/info', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        let videoId = "";
        if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1].split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (videoUrl.includes('shorts/')) {
            videoId = videoUrl.split('shorts/')[1].split('?')[0];
        } else {
            videoId = videoUrl.split('/').pop().split('?')[0];
        }

        const data = await fetchFromInvidious(videoId);

        if (!data) {
            return res.status(400).json({ error: 'Video details fetch nahi ho sakein. Valid YouTube link paste karein.' });
        }

        const formats = [];
        if (data.formatStreams && data.formatStreams.length > 0) {
            data.formatStreams.forEach(f => {
                formats.push({
                    format_id: f.url,
                    ext: f.container || 'mp4',
                    resolution: f.qualityLabel || f.quality || '720p',
                    filesize: 'Direct Stream'
                });
            });
        } else {
            formats.push({
                format_id: `https://inv.tux.pizza/latest_version?id=${videoId}&itag=22`,
                ext: 'mp4',
                resolution: '720p HD',
                filesize: 'Direct Stream'
            });
        }

        return res.json({
            title: data.title,
            uploader: data.author || 'YouTube Channel',
            duration: data.lengthSeconds ? `${Math.floor(data.lengthSeconds / 60)}m ${data.lengthSeconds % 60}s` : 'HD',
            thumbnail: data.videoThumbnails && data.videoThumbnails[0] ? data.videoThumbnails[0].url : 'https://via.placeholder.com/400x225',
            formats: formats
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal server error. Please retry.' });
    }
});

// 2. Direct Download Endpoint
app.get('/api/download', (req, res) => {
    let downloadUrl = req.query.format;
    if (!downloadUrl || downloadUrl === 'direct') {
        return res.status(400).send('Download link available nahi hai');
    }
    res.redirect(downloadUrl);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));