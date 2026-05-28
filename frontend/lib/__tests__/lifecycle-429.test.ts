jest.mock('@saas/lib/api/billing', () => ({ useSubscription: jest.fn() }));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { INFO: 'info', SUCCESS: 'success', ERROR: 'error' },
}));

import { showToast } from '@saas/lib/toast';
import { installSuspensionErrorHandler } from '../lifecycle';

const mockShowToast = showToast as jest.Mock;

function makeQueryClient() {
  let handler: ((err: unknown) => void) | undefined;
  return {
    setDefaultOptions: jest.fn((opts) => {
      handler = opts?.mutations?.onError;
    }),
    invalidateQueries: jest.fn(),
    triggerError: (err: unknown) => handler?.(err),
  };
}

beforeEach(() => jest.clearAllMocks());

describe('installSuspensionErrorHandler — 429 API key rate limit', () => {
  it('shows rate limit toast on 429 with API key detail', () => {
    const qc = makeQueryClient();
    installSuspensionErrorHandler(qc as never, (k: string) => k);
    qc.triggerError({ status: 429, body: { detail: 'API key rate limit exceeded.' } });
    expect(mockShowToast).toHaveBeenCalledWith('saas:apiKeys.rateLimitedToast', 'error');
  });

  it('does not fire rate limit toast on generic 429', () => {
    const qc = makeQueryClient();
    installSuspensionErrorHandler(qc as never, (k: string) => k);
    qc.triggerError({ status: 429, body: { detail: 'Request was throttled.' } });
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
