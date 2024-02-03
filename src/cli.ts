import { app } from 'electron';

import { Command } from 'commander';

import { processMedia } from './youtube';

export function runCliApp(): void {
  const program = new Command();

  program.argument('<videos...>').action(async (items: Array<string>) => {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      try {
        console.log(`Processing "${item}"...`);
        await processMedia(item);
      } catch (e) {
        console.error(e);
      }
    }
    app.quit();
  });

  program.parse();
}
