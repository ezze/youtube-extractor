import filenamify from 'filenamify';

import { OutputAudioType, VideoFormat, VideoInfo } from './types';

export function getOutputVideoFileName(info: VideoInfo, format: VideoFormat): string {
  const { videoDetails } = info;
  const { ownerChannelName, title } = videoDetails;
  const { container } = format;
  const extension = `.${container}`;
  return filenamify(`${ownerChannelName} — ${title}${extension}`.replace(/\.{2,}/g, '.').replace(/["«»]/, ''), {
    replacement: '_',
    maxLength: 200
  });
}

export function getOutputAudioFileName(info: VideoInfo, format: VideoFormat, audioType: OutputAudioType): string {
  const { videoDetails } = info;
  const { ownerChannelName, title } = videoDetails;
  const { container } = format;
  const extension = audioType === 'mp3' ? '.mp3' : `.${container}`;
  return filenamify(`${ownerChannelName} — ${title}${extension}`.replace(/\.{2,}/g, '.').replace(/["«»]/, ''), {
    replacement: '_',
    maxLength: 200
  });
}
