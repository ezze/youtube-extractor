import { app } from 'electron';
import path from 'path';
import readline from 'readline';

import { Command, Option } from 'commander';
import fs from 'fs-extra';
import { getVideoID } from 'ytdl-core';

import { processMedia } from './youtube';
import { OutputAudioType } from './youtube/types';

type ProgramOptions = {
  output?: string;
  audio?: OutputAudioType;
};

async function readSourceFile(sourceFilePath: string): Promise<Array<string>> {
  const rl = readline.createInterface({
    input: fs.createReadStream(sourceFilePath),
    crlfDelay: Infinity
  });

  const videoIds: Array<string> = [];
  for await (const line of rl) {
    const source = line.trim();
    if (source.startsWith('#') || source.startsWith('//')) {
      continue;
    }
    try {
      videoIds.push(getVideoID(line));
    } catch (e) {
      console.error(`"${line}" is not a valid Youtube video URL or ID`);
    }
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
  return videoIds;
}

function onReady(): void {
  const program = new Command();

  program
    .argument('<videos...>')
    .addOption(new Option('-o, --output <output>', 'output directory path'))
    .addOption(new Option('-a, --audio <audio>', 'extract audio only').choices(['original', 'mp3']))
    .action(async (items: Array<string>, options: ProgramOptions) => {
      console.log('Analyzing input...');
      const videoIds: Array<string> = [];
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (fs.existsSync(item)) {
          try {
            videoIds.push(...(await readSourceFile(item)));
          } catch (e) {
            console.error(`Unable to read source file "${item}".`);
          }
        } else {
          try {
            videoIds.push(getVideoID(item));
          } catch (e) {
            console.error(`"${item}" is not a valid Youtube video URL or ID`);
          }
        }
      }

      if (videoIds.length === 0) {
        console.warn('There are no valid Youtube video sources detected');
        app.exit(1);
      }

      console.log('The following Youtube video IDs are detected:');
      videoIds.forEach((videoId) => {
        console.log(`- ${videoId}`);
      });

      const { output = process.cwd(), audio: audioType } = options;
      const outputDirectoryPath = path.isAbsolute(output) ? output : path.resolve(process.cwd(), output);
      console.log(`The following output directory is detected: ${outputDirectoryPath}`);

      for (let i = 0; i < videoIds.length; i += 1) {
        const youtubeId = videoIds[i];
        try {
          console.log(`Processing "${youtubeId}"...`);
          await processMedia(youtubeId, { outputDirectoryPath: outputDirectoryPath, audioType });
        } catch (e) {
          console.error(e);
        }
      }
      app.quit();
    })
    .helpOption('-h, --help', 'show this help information');

  program.parse();
}

export function runCliApp(): void {
  app.on('ready', onReady);
}
