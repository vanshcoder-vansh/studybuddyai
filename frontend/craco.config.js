module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        { module: /node_modules/, message: /Failed to parse source map/ },
      ];
      return webpackConfig;
    },
  },
};
