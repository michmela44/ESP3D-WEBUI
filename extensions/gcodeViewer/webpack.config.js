const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');

const htmlFileName = 'gcodeViewer.html';

module.exports = {
  entry: `./src/${htmlFileName}`,
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `./src/${htmlFileName}`,
      filename: htmlFileName,
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
      inject: false,
    }),
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.html$/,
      threshold: 0,
      minRatio: 1,
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          delete: [`dist/${htmlFileName}`, 'dist/main.js'],
        },
      },
    }),
  ],
};
