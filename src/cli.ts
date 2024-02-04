import { app } from 'electron';

import { Command } from 'commander';

import { processMedia } from './youtube';

type ProgramOptions = {
  output?: string;
};

export function runCliApp(): void {
  app.on('ready', () => {
    const program = new Command();

    program
      .argument('<videos...>')
      .option('-o, --output <output>', 'output directory path')
      .action(async (items: Array<string>, options: ProgramOptions) => {
        const { output = process.cwd() } = options;
        console.log(items);
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          try {
            console.log(`Processing "${item}"...`);
            await processMedia(item, output);
          } catch (e) {
            console.error(e);
          }
        }
        app.quit();
      });

    program.parse();
  });
}
