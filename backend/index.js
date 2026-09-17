const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Video Info Endpoint (Crash-proof Info Extraction)
app.get('/api/info', (req, res) => {
  let videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

  // Special characters safe query execution
  const command = `yt-dlp --no-warnings --no-check-certificates -j "${videoUrl.replace(/"/g, '\\"')}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Yt-dlp Error:", stderr || error.message);
      return res.status(500).json({ error: 'Video details fetch nahi ho sakein. Direct main post/video link check karein.' });
    }
    try {
      const info = JSON.parse(stdout);
      
      const availableFormats = (info.formats || [])
        .map(f => ({
          format_id: f.format_id,
          resolution: f.resolution || f.format_note || (f.height ? `${f.height}p` : 'HD Quality'),
          ext: f.ext || 'mp4',
          filesize: f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(1)} MB` : 'Auto'
        }));

      res.json({
        title: info.title || info.fulltitle || 'Video Title',
        duration: info.duration_string || (info.duration ? `${info.duration} sec` : 'N/A'),
        thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
        uploader: info.uploader || info.channel || 'Unknown',
        formats: availableFormats.length > 0 ? availableFormats : [{ format_id: 'best', resolution: 'Best Quality', ext: 'mp4', filesize: 'Auto' }]
      });
    } catch (e) {
      res.status(500).json({ error: 'Data parse karne mein error aaya.' });
    }
  });
});

// 2. Download Endpoint (FFmpeg Auto-Merging for High Quality)
app.get('/api/download', (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).send('URL is required');

  // Set response headers for file download
  res.header('Content-Disposition', 'attachment; filename="MediaFetch_Video.mp4"');

  // Auto-merge audio and video streams using FFmpeg
  const formatOption = format && format !== 'best' ? `-f "${format}+bestaudio/best"` : '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
  
  const command = `yt-dlp ${formatOption} --ffmpeg-location ffmpeg -o - "${url}"`;
  
  const child = exec(command, { 
    encoding: 'binary', 
    maxBuffer: 1024 * 1024 * 500 // 500MB Buffer limit for large HD files
  });

  child.stdout.on('data', (data) => {
    res.write(Buffer.from(data, 'binary'));
  });

  child.stderr.on('data', () => {
    // Silent logging for background stream processing
  });

  child.on('close', () => {
    res.end();
  });
});

app.listen(5000, () => {
  console.log('🚀 Server bilkul ready hai! Running on http://localhost:5000');
});