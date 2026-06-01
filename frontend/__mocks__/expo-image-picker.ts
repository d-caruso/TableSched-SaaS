// @ts-nocheck
// Metro (Expo dev server) also resolves this file, so guard against non-Jest environments.
export const launchImageLibraryAsync =
  typeof jest !== 'undefined'
    ? jest.fn()
    : () => Promise.resolve({ canceled: true, assets: [] });
export const MediaTypeOptions = { Images: 'Images' };
export const UIImagePickerPresentationStyle = {};
