const path = require('path');
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaConfig = singleSpaAngularWebpack(config, options);

  return {
    ...singleSpaConfig,
    output: {
      ...singleSpaConfig.output,
      publicPath: '/__mfe/booking/',
    },
  };
};
