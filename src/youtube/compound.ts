import { spawn } from 'child_process';
import { Writable } from 'stream';

import { ffmpegPath } from './const';
import { parseFfmpegProgress } from './progress';
import { MediaProgress, YoutubeMediaStreamData } from './types';

export async function writeYoutubeCompoundMediaFile(
  video: YoutubeMediaStreamData,
  audio: YoutubeMediaStreamData,
  filePath: string,
  progress?: MediaProgress
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(
      ffmpegPath,
      [
        // Remove ffmpeg's console spamming
        '-loglevel',
        '8',
        '-hide_banner',
        // Redirect / enable progress messages
        '-progress',
        'pipe:3',
        // Set inputs
        '-i',
        'pipe:4',
        '-i',
        'pipe:5',
        // Map video & audio from streams
        '-map',
        '0:v',
        '-map',
        '1:a',
        // Keep encoding
        '-c:v',
        'copy',
        '-c:a',
        'copy',
        // Output file path
        filePath
      ],
      {
        windowsHide: true,
        stdio: [
          // Standard: stdin, stdout, stderr
          'inherit',
          'inherit',
          'inherit',
          // Custom: pipe:3, pipe:4, pipe:5
          'pipe',
          'pipe',
          'pipe'
        ]
      }
    );

    const progressOutputStream = ffmpegProcess.stdio[3];
    const videoOutputStream = ffmpegProcess.stdio[4] as Writable;
    // @ts-ignore
    const audioOutputStream = ffmpegProcess.stdio[5] as Writable;

    if (progress) {
      progressOutputStream.on('data', (chunk) => {
        // ffmpeg creates the transformer streams, and we just have to insert / read data
        // Parse the param=value list returned by ffmpeg
        const lines: Array<string> = chunk.toString().trim().split('\n');
        progress.conversion = parseFfmpegProgress(lines);
      });
    }

    video.stream.pipe(videoOutputStream);
    audio.stream.pipe(audioOutputStream);

    ffmpegProcess.on('error', (e) => {
      reject(e);
    });

    ffmpegProcess.on('close', () => {
      resolve();
    });
  });
}
