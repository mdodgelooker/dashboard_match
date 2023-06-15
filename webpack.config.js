/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = (env, args) => {
  // There is no built-in way to definitively detect hot-loading from
  // babel-loader, so we set an environment variable here to be read from
  // packages/babel-preset-react/index.js and apps/web/.babelrc.js
  // https://github.com/webpack/webpack-cli/issues/3599
  if (env.WEBPACK_SERVE && args.hot !== false) {
    process.env.LOOKER_WEBPACK_HOT = 'true'
  }

  return {
    devtool: 'source-map',
    entry: {
      bundle: path.join(__dirname, 'src/index.tsx'),
    },
    module: {
      rules: [
        {
          loader: 'babel-loader',
          options: {
            rootMode: 'upward',
            // c.f. https://github.com/babel/babel/issues/14873
            targets: 'extends @looker/browserslist-config',
          },
          test: /\.tsx?$/,
        },
      ],
    },
    output: {
      filename: 'bundle.js',
      path: path.join(__dirname, 'dist'),
    },
    plugins: [
      process.env.LOOKER_WEBPACK_HOT && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      mainFields: ['src', 'browser', 'module', 'main'],
    },
  }
}
