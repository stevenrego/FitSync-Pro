const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add React 19 compatibility resolver
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper React resolution
config.resolver.alias = {
  ...config.resolver.alias,
  'react': require.resolve('react'),
  'react-dom': require.resolve('react-dom'),
};

// Add transformer options for better compatibility
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;