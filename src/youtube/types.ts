import { Readable } from 'stream';

import { videoFormat as VideoFormat, videoInfo as VideoInfo } from '@distube/ytdl-core';

export { VideoFormat, VideoInfo };

export enum YoutubeMediaType {
  Video = 1,
  Audio = 2,
  Compound = 3,
  Mixed = 4
}

export type YoutubeMediaStreamData = {
  stream: Readable;
  format: VideoFormat;
};

export type YoutubeBasicMedia = {
  type: YoutubeMediaType.Video | YoutubeMediaType.Audio | YoutubeMediaType.Mixed;
} & YoutubeMediaStreamData;

export type YoutubeCompoundMedia = {
  type: YoutubeMediaType.Compound;
  video: YoutubeMediaStreamData;
  audio: YoutubeMediaStreamData;
};

export type YoutubeMedia = YoutubeBasicMedia | YoutubeCompoundMedia;

export type OutputAudioType = 'original' | 'mp3';

export type DownloadProgress = {
  downloaded: number;
  total: number;
};

export type ConversionProgress = {
  time: string;
  frame: number;
  fps: number;
  converted: number;
  total: number;
  bitrate: string;
  speed: string;
};

export type MediaProgress = {
  video: DownloadProgress;
  audio: DownloadProgress;
  conversion: ConversionProgress;
};
