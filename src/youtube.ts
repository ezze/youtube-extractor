import { spawn } from 'child_process';
import path from 'path';
import { Writable } from 'stream';

import ffmpegPath from 'ffmpeg-static';
import fs from 'fs-extra';
import { downloadFromInfo, getInfo } from 'ytdl-core';

import { initialMediaProgress } from './const';
import { YoutubeExtractorError } from './error';
import { hideMediaProgress, parseFfmpegProgress, showMediaProgress } from './progress';
import { MediaProgress, VideoInfo, VideoFormat, YoutubeMediaType, YoutubeMedia, YoutubeCompoundMedia } from './types';

export function getYoutubeMediaInfo(url: string): Promise<VideoInfo> {
  return getInfo(url);
}

export type OpenYoutubeMediaOptions = {
  type?: Exclude<YoutubeMediaType, YoutubeMediaType.Mixed>;
};

export async function openYoutubeMedia(info: VideoInfo, options?: OpenYoutubeMediaOptions): Promise<YoutubeMedia> {
  const { type = YoutubeMediaType.Compound } = options || {};

  const videos = info.formats.filter((format) => format.hasVideo);
  videos.sort((video1, video2) => video2.bitrate - video1.bitrate);

  const audios = info.formats.filter((format) => format.hasAudio);
  audios.sort((audio1, audio2) => audio2.audioBitrate - audio1.audioBitrate);

  const video = videos.length > 0 ? videos[0] : undefined;
  const audio = audios.length > 0 ? audios[0] : undefined;

  if (type === YoutubeMediaType.Video) {
    if (!video) {
      throw new YoutubeExtractorError('Video is not found');
    }
    return { type, stream: downloadFromInfo(info, { quality: video.itag }), format: video };
  }

  if (type === YoutubeMediaType.Audio) {
    if (!audio) {
      throw new YoutubeExtractorError('Audio is not found');
    }
    return { type, stream: downloadFromInfo(info, { quality: audio.itag }), format: audio };
  }

  if (!video) {
    throw new YoutubeExtractorError('Video is not found');
  }
  if (!audio) {
    throw new YoutubeExtractorError('Audio is not found');
  }

  if (video.itag === audio.itag) {
    return { type: YoutubeMediaType.Mixed, stream: downloadFromInfo(info, { quality: video.itag }), format: video };
  }

  return {
    type,
    video: { stream: downloadFromInfo(info, { quality: video.itag }), format: video },
    audio: { stream: downloadFromInfo(info, { quality: audio.itag }), format: audio }
  };
}

async function writeYoutubeCompoundMediaFile(
  media: YoutubeCompoundMedia,
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

    media.video.stream.pipe(videoOutputStream);
    media.audio.stream.pipe(audioOutputStream);

    ffmpegProcess.on('error', (e) => {
      reject(e);
    });

    ffmpegProcess.on('close', () => {
      resolve();
    });
  });
}

function getOutputFileName(info: VideoInfo, format: VideoFormat): string {
  const { videoDetails } = info;
  const { ownerChannelName, title } = videoDetails;
  const { container } = format;
  const extension = `.${container}`;
  return `${ownerChannelName} — ${title}${extension}`.replace(/\.{2,}/g, '.');
}

async function processMedia(url: string): Promise<void> {
  const outputDirectoryPath = path.resolve(__dirname, '.');
  await fs.ensureDir(outputDirectoryPath);

  const info = await getYoutubeMediaInfo(url);
  const source = await openYoutubeMedia(info);

  if (source.type === YoutubeMediaType.Compound) {
    let interval: NodeJS.Timeout | undefined;
    try {
      const { video, audio } = source;

      const outputFileName = getOutputFileName(info, video.format);
      const outputFilePath = path.resolve(outputDirectoryPath, outputFileName);
      if (await fs.pathExists(outputFilePath)) {
        await fs.remove(outputFilePath);
      }

      const progress: MediaProgress = { ...initialMediaProgress };

      video.stream.on('progress', (_, downloaded, total) => {
        progress.video = { downloaded, total };
      });

      audio.stream.on('progress', (_, downloaded, total) => {
        progress.audio = { downloaded, total };
      });

      showMediaProgress(progress);
      interval = setInterval(() => {
        showMediaProgress(progress);
      }, 100);

      await writeYoutubeCompoundMediaFile(source, outputFilePath, progress);
    } finally {
      if (interval) {
        clearInterval(interval);
      }
      hideMediaProgress();
    }
  } else {
    const { stream, format } = source;
    const outputFileName = getOutputFileName(info, format);
    const outputFilePath = path.resolve(outputDirectoryPath, outputFileName);
    console.log(outputFilePath);
    // TODO: implement
  }
}

(async () => {
  process.on('SIGINT', () => {
    hideMediaProgress();
    console.log('Download process has been interrupted');
    process.exit(1);
  });

  try {
    const videoUrl = 'https://www.youtube.com/watch?v=VuKxidVUWFg';
    await processMedia(videoUrl);
    console.log('Video is saved');
  } catch (e) {
    console.error('Unable to download video');
    console.error(e);
  }
})();
