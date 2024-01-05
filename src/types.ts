export type DownloadProgress = {
  downloaded: number;
  total: number;
};

export type ConversionProgress = {
  time: string;
  frame: number;
  fps: number;
  converted: number;
  bitrate: string;
  speed: string;
};

export type MediaProgress = {
  video: DownloadProgress;
  audio: DownloadProgress;
  conversion: ConversionProgress;
}
