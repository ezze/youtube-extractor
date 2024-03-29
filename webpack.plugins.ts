/* eslint-disable import/no-extraneous-dependencies */
import ESLintWebpackPlugin from 'eslint-webpack-plugin';

import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure'
  }),
  new ESLintWebpackPlugin({
    extensions: ['ts', 'tsx']
  })
];
