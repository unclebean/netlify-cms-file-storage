const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const uglifyWebpackPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    'file-storage-backend': './index.js'
  },
  output: {
    path: path.join(__dirname, 'app/dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        exclude: [/node_modules/],
        loader: 'svg-inline-loader',
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },

    ]
  },
  plugins: [
    // Minify and optimize the JavaScript
    new uglifyWebpackPlugin({
      test: /\.js($|\?)/i
    }),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true
    }),
  ]
}