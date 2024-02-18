import path from 'path';

import ffmpegPathStatic from 'ffmpeg-static';

export const ffmpegPath = ffmpegPathStatic
  .replace(`.webpack${path.sep}main`, `node_modules${path.sep}ffmpeg-static`)
  .replace('app.asar', 'app.asar.unpacked');
