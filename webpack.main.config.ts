import TerserPlugin from 'terser-webpack-plugin';

import { plugins } from './webpack.plugins';
import { rules } from './webpack.rules';

import type { Configuration } from 'webpack';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules
  },
  plugins,
  optimization: {
    minimize: false,
    minimizer: [new TerserPlugin({ terserOptions: { ecma: 2020 } })]
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
  }
};
