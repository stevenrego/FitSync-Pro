module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxRuntime: 'automatic' }]
    ],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      'react-native-reanimated/plugin'
    ]
  };
};