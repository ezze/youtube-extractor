import { ConversionProgress, DownloadProgress, MediaProgress } from './youtube/types';

export const initialDownloadProgress: DownloadProgress = {
  downloaded: 0,
  total: Infinity
};

export const initialConversionProgress: ConversionProgress = {
  time: '00:00:00.000',
  frame: 0,
  fps: 0,
  converted: 0,
  total: Infinity,
  bitrate: '',
  speed: ''
};

export const initialMediaProgress: MediaProgress = {
  video: { ...initialDownloadProgress },
  audio: { ...initialDownloadProgress },
  conversion: { ...initialConversionProgress }
};

export const timeRegExp = /^(\d{2}:\d{2}:\d{2}\.\d{3}).+$/;
export const integerRegExp = /^\d+$/;
export const numberRegExp = /^\d+(\.\d+)*$/;
