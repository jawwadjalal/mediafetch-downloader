const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Info Endpoint (Invidious Public Engine)
app.get('/api/info', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        // Extract Video ID
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

        const response = await fetch(`https://inv.tux.pizza/api/v1/videos/${videoId}`);
        const data = await response.json();

        if (!data || data.error || !data.title) {
            return res.status(400).json({ error: 'Video details fetch nahi ho sakein. Video ID check karein.' });
        }

        const formats = [];
        if (data.formatStreams) {
            data.formatStreams.forEach(f => {
                formats.push({
                    format_id: f.url,
                    ext: f.container || 'mp4',
                    resolution: f.qualityLabel || f.quality || '720p',
                    filesize: 'Direct Download'
                });
            });
        }

        res.json({
            title: data.title,
            uploader: data.author || 'YouTube Content',
            duration: `${Math.floor(data.lengthSeconds / 60)}m ${data.lengthSeconds % 60}s`,
            thumbnail: data.videoThumbnails && data.videoThumbnails[0] ? data.videoThumbnails[0].url : 'https://via.placeholder.com/400x225',
            formats: formats.length > 0 ? formats : [
                { format_id: `https://inv.tux.pizza/latest_version?id=${videoId}&itag=22`, ext: 'mp4', resolution: '720p HD', filesize: 'Direct Stream' }
            ]
        });
    } catch (error) {
        console.error('Invidious Error:', error);
        res.status(500).json({ error: 'Server response nahi de raha. Direct link retry karein.' });
    }
});

// 2. Download Redirection Endpoint
app.get('/api/download', (req, res) => {
    let downloadUrl = req.query.format;
    if (!downloadUrl || downloadUrl === 'direct') {
        return res.status(400).send('Download link available nahi hai');
    }
    res.redirect(downloadUrl);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));