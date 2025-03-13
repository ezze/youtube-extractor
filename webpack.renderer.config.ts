import TerserPlugin from 'terser-webpack-plugin';

import { plugins } from './webpack.plugins';
import { rules } from './webpack.rules';

import type { Configuration } from 'webpack';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
});

export const rendererConfig: Configuration = {
  module: {
    rules
  },
  plugins,
  optimization: {
    minimize: false,
    minimizer: [new TerserPlugin({ terserOptions: { ecma: 2020 } })]
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  }
};
