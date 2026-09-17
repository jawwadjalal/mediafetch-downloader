const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Video Info Endpoint
app.get('/api/info', async (req, res) => {
    let videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        const output = await ytDlp(videoUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificates: true,
            youtubeSkipDashManifest: true,
        });

        res.json({
            title: output.title || 'Untitled Video',
            uploader: output.uploader || output.uploader_id || 'Unknown Channel',
            duration: output.duration_string || 'N/A',
            thumbnail: output.thumbnail || (output.thumbnails && output.thumbnails[0] ? output.thumbnails[0].url : ''),
            formats: output.formats ? output.formats.map(f => ({
                format_id: f.format_id,
                ext: f.ext || 'mp4',
                resolution: f.resolution || (f.height ? `${f.height}p` : 'HD/SD'),
                filesize: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(1)} MB` : 'Auto'
            })) : []
        });
    } catch (error) {
        console.error('yt-dlp error:', error);
        res.status(500).json({ error: 'Video details fetch nahi ho sakein. Cloud Engine update ho raha hai.' });
    }
});

// 2. Download Endpoint
app.get('/api/download', (req, res) => {
    let videoUrl = req.query.url;
    let format = req.query.format || 'best';
    if (!videoUrl) return res.status(400).send('URL is required');

    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    
    const subprocess = ytDlp.exec(videoUrl, {
        output: '-',
        format: format,
    });

    subprocess.stdout.pipe(res);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});