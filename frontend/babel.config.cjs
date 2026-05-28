module.exports = function (api) {
  api.cache(false);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: true,
          exclude: [/OpeningHoursEditor/, /TimeSelect/],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
