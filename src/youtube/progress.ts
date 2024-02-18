import process from 'process';
import readline from 'readline';

import { initialConversionProgress, integerRegExp, numberRegExp, timeRegExp } from '../const';

import { ConversionProgress, DownloadProgress, MediaProgress } from './types';

export function parseFfmpegProgress(lines: Array<string>): ConversionProgress {
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

function getDownloadProgressPercentage(progress: DownloadProgress): string {
  return `${((progress.downloaded / progress.total) * 100).toFixed(2)} %`;
}

export function showMediaProgress(progress: MediaProgress): void {
  process.stdout.write(`Video download: ${getDownloadProgressPercentage(progress.video)}\n`);
  process.stdout.write(`Audio download: ${getDownloadProgressPercentage(progress.audio)}\n`);
  const { time, frame, fps, converted } = progress.conversion;
  process.stdout.write(`Result conversion: ${time} (frame ${frame} / fps ${fps.toFixed(1)} / bytes ${converted})\n`);
  readline.moveCursor(process.stdout, 0, -3);
}

export function queueMediaProgressUpdate(progress: MediaProgress): NodeJS.Timeout {
  showMediaProgress(progress);
  return setInterval(() => {
    showMediaProgress(progress);
  }, 100);
}

export function hideMediaProgress(): void {
  readline.clearScreenDown(process.stdout);
}
