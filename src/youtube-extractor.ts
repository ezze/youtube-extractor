import { pipeline } from 'node:stream/promises';
import path from 'path';
import fs from 'fs';
import ytdl from 'ytdl-core';

(async () => {
  try {
    const inputStream = ytdl('https://www.youtube.com/watch?v=5DYqhQoMsGM');
    const outputPath = path.resolve(__dirname, 'video.mp4');
    const outputStream = fs.createWriteStream(outputPath);
    await pipeline(inputStream, outputStream);
    console.log('Video is saved');
  } catch (e) {
    console.error('Unable to load video');
    console.error(e);
  }
})();
