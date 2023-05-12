const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var BrotliPlugin = require('brotli-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const WebpackBundleAnalyzer = require('webpack-bundle-analyzer')

const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = false //(nodeEnv !== 'production');

const config = {
  mode: nodeEnv,
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'h5p-as4l-controller.css'
    })
  ],
  entry: {
    dist: './js/h5p-as4l-controller.js',
  },
  output: {
    filename: 'h5p-as4l-controller.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
      {      
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
          },
          "sass-loader"
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        include: path.join(__dirname, 'src/fonts'),
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      }
    ]
  }
  ,
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'h5p-as4l-controller.css'
    }),
    ]
};

if(isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;
