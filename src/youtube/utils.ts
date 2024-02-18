import filenamify from 'filenamify';

import { OutputAudioType, VideoFormat, VideoInfo } from './types';

function getOutputBaseFileName(info: VideoInfo): string {
  const { videoDetails } = info;
  const { ownerChannelName, title } = videoDetails;
  return filenamify(`${ownerChannelName} — ${title}`.replace(/\.{2,}/g, '.').replace(/["«»]/g, ''), {
    replacement: '_',
    maxLength: 200
  });
}

export function getOutputVideoFileName(info: VideoInfo, format: VideoFormat): string {
  const { container } = format;
  return `${getOutputBaseFileName(info)}.${container}`;
}

export function getOutputAudioFileName(info: VideoInfo, format: VideoFormat, audioType: OutputAudioType): string {
  const { container } = format;
  return `${getOutputBaseFileName(info)}.${audioType === 'mp3' ? 'mp3' : `${container}`}`;
}
