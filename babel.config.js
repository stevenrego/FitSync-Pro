module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxImportSource: undefined,
        jsxRuntime: 'automatic'
      }]
    ],
    plugins: [
      // Ensure React 19 compatibility
      ['@babel/plugin-transform-react-jsx', {
        runtime: 'automatic'
      }],
      // Required for expo-router
      'expo-router/babel',
      // Add reanimated plugin if needed
      'react-native-reanimated/plugin'
    ],
  };
};