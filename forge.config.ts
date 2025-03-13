/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';

import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { createLogger, format, transports } from 'winston';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

import type { ForgeConfig } from '@electron-forge/shared-types';

const logger = createLogger({
  level: 'info',
  format: format.simple(),
  transports: [new transports.File({ filename: path.resolve(__dirname, 'forge.config.log'), options: { flags: 'w' } })]
});

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpackDir: 'node_modules/ffmpeg-static'
    },
    ignore: [/^\/(?!(\.webpack|node_modules$|node_modules\/ffmpeg-static|package\.json))/]
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    }),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts'
            }
          }
        ]
      }
    })
  ],
  hooks: {
    postPackage: async (forgeConfig, options) => {
      console.info('Packages built at:', options.outputPaths);
    }
  }
};

export default config;
