import path from 'path';

import { downloadFromInfo, getInfo, getVideoID } from '@distube/ytdl-core';
import fs from 'fs-extra';

import { initialMediaProgress } from '../const';
import { YoutubeExtractorError } from '../error';

import { writeYoutubeAudioFile } from './audio';
import { writeYoutubeCompoundMediaFile } from './compound';
import { hideMediaProgress, queueMediaProgressUpdate, showMediaProgress } from './progress';
import { MediaProgress, OutputAudioType, VideoInfo, YoutubeMedia, YoutubeMediaType } from './types';
import { getOutputAudioFileName, getOutputVideoFileName } from './utils';

export function getYoutubeMediaInfo(url: string): Promise<VideoInfo> {
  return getInfo(url);
}

type OpenYoutubeMediaType = Exclude<YoutubeMediaType, YoutubeMediaType.Mixed>;

export type OpenYoutubeMediaOptions = {
  type?: OpenYoutubeMediaType;
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

export type ProcessMediaOptions = {
  outputDirectoryPath: string;
  audioType?: OutputAudioType;
};

export async function processMedia(source: string, options: ProcessMediaOptions): Promise<void> {
  const { outputDirectoryPath, audioType } = options;

  let id: string;
  try {
    id = getVideoID(source);
  } catch (e) {
    throw new Error(`"${source}" is not a valid video ID or URL`);
  }

  const info = await getYoutubeMediaInfo(id);

  let type: OpenYoutubeMediaType | undefined;
  if (audioType) {
    type = YoutubeMediaType.Audio;
  }
  const media = await openYoutubeMedia(info, { type });

  await fs.ensureDir(outputDirectoryPath);

  let interval: NodeJS.Timeout | undefined;
  const progress: MediaProgress = { ...initialMediaProgress };

  try {
    if (media.type === YoutubeMediaType.Audio) {
      const { stream, format } = media;

      const outputFileName = getOutputAudioFileName(info, format, audioType);
      const outputFilePath = path.resolve(outputDirectoryPath, outputFileName);
      if (await fs.pathExists(outputFilePath)) {
        await fs.remove(outputFilePath);
      }

      stream.on('progress', (_, downloaded, total) => {
        progress.audio = { downloaded, total };
      });

      interval = queueMediaProgressUpdate(progress);
      await writeYoutubeAudioFile(media, outputFilePath, format.audioBitrate, progress);
      console.log(`File "${outputFileName}" is written!`);
    } else if (media.type === YoutubeMediaType.Compound) {
      const { video, audio } = media;

      const outputFileName = getOutputVideoFileName(info, video.format);
      const outputFilePath = path.resolve(outputDirectoryPath, outputFileName);
      if (await fs.pathExists(outputFilePath)) {
        await fs.remove(outputFilePath);
      }

      video.stream.on('progress', (_, downloaded, total) => {
        progress.video = { downloaded, total };
      });

      audio.stream.on('progress', (_, downloaded, total) => {
        progress.audio = { downloaded, total };
      });

      interval = queueMediaProgressUpdate(progress);
      await writeYoutubeCompoundMediaFile(video, audio, outputFilePath, progress);
      console.log(`File "${outputFileName}" is written!`);
    } else {
      console.error('Selected media type is not supported yet');
    }
  } catch (e) {
    if (interval) {
      clearInterval(interval);
    }
    hideMediaProgress();
    console.error(e);
    throw e;
  } finally {
    if (interval) {
      clearInterval(interval);
    }
    hideMediaProgress();
  }
}
