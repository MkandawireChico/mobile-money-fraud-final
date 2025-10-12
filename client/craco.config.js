// client/craco.config.js
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {

      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);

      if (oneOfRule) {
        
        const cssRule = oneOfRule.oneOf.find(
          (rule) =>
            rule.test &&
            rule.test.toString().includes('css') &&
            Array.isArray(rule.use) &&
            rule.use.some((use) => typeof use === 'object' && use.loader && use.loader.includes('postcss-loader'))
        );

        if (cssRule) {
          
          const postcssLoader = cssRule.use.find(
            (use) => typeof use === 'object' && use.loader && use.loader.includes('postcss-loader')
          );

          if (postcssLoader) {
            postcssLoader.options = {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            };
          }
        }
      }
      return webpackConfig;
    },
  },
  
};
