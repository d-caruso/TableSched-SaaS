// @ts-nocheck
module.exports = {
  init: jest.fn(),
  Native: {
    setTag: jest.fn(),
    captureException: jest.fn(),
    withScope: jest.fn(),
  },
  Browser: {
    setTag: jest.fn(),
    captureException: jest.fn(),
  },
};
