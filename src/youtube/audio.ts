import { spawn } from 'child_process';
import { Writable } from 'stream';

import { ffmpegPath } from './const';
import { parseFfmpegProgress } from './progress';
import { MediaProgress, YoutubeMediaStreamData } from './types';

const mp3bitrateValues: Array<number> = [32, 96, 128, 160, 192, 256, 320];

export async function writeYoutubeAudioFile(
  audio: YoutubeMediaStreamData,
  filePath: string,
  bitrate?: number,
  progress?: MediaProgress
): Promise<void> {
  const args: Array<string> = [
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
    // Map audio from stream
    '-map',
    '0:a'
  ];

  // Encoding
  if (filePath.endsWith('.mp3')) {
    const mp3bitrate = mp3bitrateValues.find((mp3bitrate) => mp3bitrate >= bitrate);
    if (mp3bitrate !== undefined) {
      args.push('-b:a', `${mp3bitrate}k`);
    }
  } else {
    args.push('-c:a', 'copy');
  }

  args.push(filePath);

  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: [
        // Standard: stdin, stdout, stderr
        'inherit',
        'inherit',
        'inherit',
        // Custom: pipe:3, pipe:4
        'pipe',
        'pipe'
      ]
    });

    const progressOutputStream = ffmpegProcess.stdio[3];
    const audioOutputStream = ffmpegProcess.stdio[4] as Writable;

    if (progress) {
      progressOutputStream.on('data', (chunk) => {
        // ffmpeg creates the transformer streams, and we just have to insert / read data
        // Parse the param=value list returned by ffmpeg
        const lines: Array<string> = chunk.toString().trim().split('\n');
        progress.conversion = parseFfmpegProgress(lines);
      });
    }

    audio.stream.pipe(audioOutputStream);

    ffmpegProcess.on('error', (e) => {
      reject(e);
    });

    ffmpegProcess.on('close', () => {
      resolve();
    });
  });
}
