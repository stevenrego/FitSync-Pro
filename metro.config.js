const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure react-shim loads before any other modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver to prioritize our shim
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Ensure proper module resolution order
config.transformer.minifierConfig = {
  keep_fnames: true,
};

// Add shim to the beginning of the entry file
config.serializer.createModuleIdFactory = function() {
  return function(path) {
    // Prioritize react-shim
    if (path.includes('react-shim')) {
      return 0;
    }
    return path;
  };
};

module.exports = config;