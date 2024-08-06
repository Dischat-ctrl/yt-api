const express = require('express');
const { exec: youtubedl } = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Ensure the downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR);
}

app.get('/download/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const outputFilePath = path.join(DOWNLOADS_DIR, `${videoId}.mp3`);

    if (fs.existsSync(outputFilePath)) {
        return res.redirect(`/downloads/${videoId}.mp3`);
    }

    try {
        const audioProcess = youtubedl(url, {
            format: 'bestaudio',
            output: '-',
            quiet: true
        });

        // Convert to MP3 using ffmpeg
        ffmpeg(audioProcess.stdout)
            .setFfmpegPath(ffmpegPath)
            .audioBitrate(192)
            .toFormat('mp3')
            .save(outputFilePath)
            .on('end', () => {
                res.redirect(`/downloads/${videoId}.mp3`);
            })
            .on('error', (err) => {
                console.error('Error processing the audio:', err);
                res.status(500).send('Error processing the audio');
            });

    } catch (err) {
        console.error('Error downloading the video:', err);
        res.status(500).send('Error downloading the video');
    }
});

// Serve the downloads directory statically
app.use('/downloads', express.static(DOWNLOADS_DIR));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
