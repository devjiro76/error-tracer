const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    'errortracer': './src/errortracer.js',
    'errortracer.bundle': './src/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '',
    filename: '[name].js',
    // sourceMapFilename: "[name].js.map",
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: [
        path.resolve(__dirname, "src")
      ],
      exclude: [
        path.resolve(__dirname, "node_modules")
      ],
    }]
  }
};
