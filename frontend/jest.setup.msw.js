// Integration project only: starts MSW server and sets the API base URL so
// fetch calls produce absolute URLs that MSW can intercept.
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost';

const { server } = require('./test-utils/msw/server');
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
