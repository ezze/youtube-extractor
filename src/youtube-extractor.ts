import { pipeline } from 'node:stream/promises';
import { spawn } from 'child_process';
import readline from 'readline';
import { Readable, Writable } from 'stream';
import path from 'path';
import fs from 'fs-extra';
import ffmpegPath from 'ffmpeg-static';
import { downloadFromInfo, getInfo } from 'ytdl-core';
import { MediaProgress, DownloadProgress, ConversionProgress } from './types';
import * as process from 'process';

const initialDownloadProgress: DownloadProgress = { downloaded: 0, total: Infinity };
const initialConversionProgress: ConversionProgress = {
  time: '00:00:00.000',
  frame: 0,
  fps: 0,
  converted: 0,
  bitrate: '',
  speed: ''
};

const timeRegExp = /^(\d{2}:\d{2}:\d{2}\.\d{3}).+$/;
const integerRegExp = /^\d+$/;
const numberRegExp = /^\d+(\.\d+)*$/;

function updateDownloadProgress(progress: DownloadProgress, processed: number, total: number): void {
  progress.downloaded = processed;
  progress.total = total;
}

function getDownloadProgressPercentage(progress: DownloadProgress): string {
  return `${(progress.downloaded / progress.total * 100).toFixed(2)} %`;
}

function parseFfmpegProgress(lines: Array<string>): ConversionProgress {
  const progress: ConversionProgress = { ...initialConversionProgress };

  for (const line of lines) {
    let [name, value] = line.split('=');
    name = name.trim();
    value = value.trim();
    if (name === 'out_time') {
      if (timeRegExp.test(value)) {
        progress.time = value.replace(timeRegExp, '$1');
      } else {
        progress.time = '00:00:00.000';
      }
    } else if (name === 'frame' && integerRegExp.test(value)) {
      progress.frame = Number(value);
    } else if (name === 'fps' && numberRegExp.test(value)) {
      progress.fps = Number(value);
    } else if (name === 'total_size' && integerRegExp.test(value)) {
      progress.converted = Number(value);
    } else if (name === 'bitrate') {
      progress.bitrate = value;
    } else if (name === 'speed') {
      progress.speed = value;
    }
  }

  return progress;
}

function displayMediaProgress(progress: MediaProgress): void {
  process.stdout.write(`Video download: ${getDownloadProgressPercentage(progress.video)}\n`);
  process.stdout.write(`Audio download: ${getDownloadProgressPercentage(progress.audio)}\n`);
  const { time, frame, fps, converted } = progress.conversion;
  process.stdout.write(`Result conversion: ${time} (frame ${frame} / fps ${fps.toFixed(1)} / bytes ${converted})\n`);
  readline.moveCursor(process.stdout, 0, -3);
}

export type DownloadYoutubeMediaResult = {
  progress: MediaProgress;
  videoStream: Readable;
  audioStream: Readable | undefined
  downloadPromise: Promise<Array<void>>;
};

export async function downloadYoutubeMedia(url: string, outputDirectoryPath: string): Promise<DownloadYoutubeMediaResult> {
  const info = await getInfo(url);

  const videos = info.formats.filter((format) => format.hasVideo);
  videos.sort((video1, video2) => video2.bitrate - video1.bitrate);

  const audios = info.formats.filter((format) => format.hasAudio);
  audios.sort((audio1, audio2) => audio2.audioBitrate - audio1.audioBitrate);

  const video = videos.length > 0 ? videos[0] : undefined;
  const audio = audios.length > 0 ? audios[0] : undefined;

  if (!video) {
    throw new Error('Video is not found');
  }

  const progress: MediaProgress = {
    video: { ...initialDownloadProgress },
    audio: { ...initialDownloadProgress },
    conversion: { ...initialConversionProgress }
  }

  const videoStream = downloadFromInfo(info, { quality: video.itag });
  videoStream.on('progress', (_, processed, total) => {
    updateDownloadProgress(progress.video, processed, total);
  });

  let audioStream: Readable | undefined;
  if (audio && !video.hasAudio) {
    audioStream = downloadFromInfo(info, { quality: audio.itag });
    audioStream.on('progress', (_, processed, total) => {
      updateDownloadProgress(progress.audio, processed, total);
    })
  }

  const videoOutputPath = path.resolve(outputDirectoryPath, `file.${video.container}`);
  const audioOutputPath = path.resolve(outputDirectoryPath, `file.${audio.container}`);

  const promises = [pipeline(videoStream, fs.createWriteStream(videoOutputPath))];
  if (audioStream) {
    promises.push(pipeline(audioStream, fs.createWriteStream(audioOutputPath)));
  }
  const downloadPromise = Promise.all(promises);

  return { progress, videoStream, audioStream, downloadPromise };
}

async function mergeVideoAndAudio(
  videoStream: Readable,
  audioStream: Readable,
  outputFilePath: string,
  progress?: MediaProgress
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, [
      // Remove ffmpeg's console spamming
      '-loglevel', '8', '-hide_banner',
      // Redirect / enable progress messages
      '-progress', 'pipe:3',
      // Set inputs
      '-i', 'pipe:4',
      '-i', 'pipe:5',
      // Map video & audio from streams
      '-map', '0:v',
      '-map', '1:a',
      // Keep encoding
      '-c:v', 'copy',
      '-c:a', 'copy',
      outputFilePath
    ], {
      windowsHide: true,
      stdio: [
        // Standard: stdin, stdout, stderr
        'inherit', 'inherit', 'inherit',
        // Custom: pipe:3, pipe:4, pipe:5
        'pipe', 'pipe', 'pipe',
      ],
    });

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

    videoStream.pipe(videoOutputStream);
    audioStream.pipe(audioOutputStream);

    ffmpegProcess.on('error', (e) => {
      reject(e);
    });

    ffmpegProcess.on('close', () => {
      resolve();
    });
  });
}

(async () => {
  let interval: NodeJS.Timeout | undefined;
  try {
    // const videoUrl = 'https://www.youtube.com/watch?v=5DYqhQoMsGM';
    // const videoUrl = 'https://www.youtube.com/watch?v=uIpbJQJ3X2c';
    const videoUrl = 'https://www.youtube.com/watch?v=sJXFFKRb0x4';
    const outputDirectoryPath = path.resolve(__dirname, '.');
    await fs.ensureDir(outputDirectoryPath);
    const { progress, videoStream, audioStream, downloadPromise } = await downloadYoutubeMedia(videoUrl, outputDirectoryPath);

    displayMediaProgress(progress);
    interval = setInterval(() => {
      displayMediaProgress(progress);
    }, 100);

    const outputFilePath = path.resolve(outputDirectoryPath, 'file-result.mp4');
    if (await fs.pathExists(outputFilePath)) {
      await fs.remove(outputFilePath);
    }
    await mergeVideoAndAudio(videoStream, audioStream, path.resolve(outputDirectoryPath, 'file-result.mp4'), progress);
    console.log('Video is saved');
  } catch (e) {
    console.error('Unable to download video');
    console.error(e);
  } finally {
    if (interval) {
      clearInterval(interval);
    }
  }
})();
