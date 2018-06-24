const path = require('path')

module.exports = {
  mode: 'development',
  entry: ['./src/index.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '',
    filename: 'errortracer.bundle.js',
    sourceMapFilename: "errortracer.bundle.js.map",
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
  },
  devServer: {
    contentBase: path.join(__dirname, 'test'),
    compress: false,
    port: 9000,
  },
  devtool: 'inline-source-map',
  resolve: {
    modules: [path.resolve('./node_modules')],
    extensions: ['.js', '.json', '.jsx', '.css'],
  },
  node: {
    fs: 'empty'
  }
};
