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
  mode: 'production',
  output: {
    publicPath: 'http://localhost:3003/',
    clean: true,
  },
  optimization: {
    runtimeChunk: false,
    minimize: true,
    usedExports: true,
    sideEffects: false,
  },
});
