const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add React shim to resolver
config.resolver.alias = {
  ...config.resolver.alias,
  'react-shim': path.resolve(__dirname, 'react-shim.js'),
};

// Ensure React 19 compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add React shim to the entry point
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve('./react-shim.js'),
  ],
};

module.exports = config;