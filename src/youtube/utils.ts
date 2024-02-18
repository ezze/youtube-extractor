import filenamify from 'filenamify';

import { VideoFormat, VideoInfo } from './types';

export function getOutputFileName(info: VideoInfo, format: VideoFormat): string {
  const { videoDetails } = info;
  const { ownerChannelName, title } = videoDetails;
  const { container } = format;
  const extension = `.${container}`;
  return filenamify(`${ownerChannelName} — ${title}${extension}`.replace(/\.{2,}/g, '.').replace(/["«»]/, ''), {
    replacement: '_',
    maxLength: 200
  });
}
