const { mergeWithCustomize } = require('webpack-merge');
const commonConfig = require('./webpack.config.js');

module.exports = mergeWithCustomize({
  customizeArray(a, b, key) {
    if (key === 'plugins') {
      return [...a, ...b];
    }
    return undefined;
  },
  customizeObject(a, b, key) {
    if (key === 'output' || key === 'externals') {
      return Object.assign({}, a, b);
    }
    return undefined;
  },
})(commonConfig, {
  mode: 'development',
  output: {
    publicPath: 'http://localhost:3003/',
    devtoolModuleFilenameTemplate:
      '[resource-path]?[loaders]',
  },
  optimization: {
    runtimeChunk: true,
  },
  devServer: {
    port: 3003,
    historyApiFallback: true,
    allowedHosts: 'auto',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});
