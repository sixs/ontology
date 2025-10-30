const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_AI_ASSISTANT_URL': JSON.stringify('http://10.159.200.245:5918/chat/88OkcGe2dK8IVFki'),
      'process.env.REACT_APP_BACKEND_API_URL': JSON.stringify('http://localhost:5000/api'),
    }),

  ],
  devServer: {
    static: './dist',
    open: true,
    hot: true,
    port: 3001,
    allowedHosts: 'all'
  },
};