import React from 'react';
import { render } from '@testing-library/react-native';

import { QuotaBar, quotaLevel, quotaFillColor } from '../QuotaBar';

describe('quotaLevel', () => {
  it('escalates ok → warning → danger by ratio', () => {
    expect(quotaLevel(0)).toBe('ok');
    expect(quotaLevel(0.79)).toBe('ok');
    expect(quotaLevel(0.8)).toBe('warning');
    expect(quotaLevel(0.99)).toBe('warning');
    expect(quotaLevel(1)).toBe('danger');
    expect(quotaLevel(1.5)).toBe('danger');
  });

  it('treats 0/0 (NaN) as empty/ok', () => {
    expect(quotaLevel(0 / 0)).toBe('ok');
  });

  it('treats usage against a zero cap (Infinity) as danger', () => {
    expect(quotaLevel(5 / 0)).toBe('danger');
  });
});

describe('quotaFillColor', () => {
  it('maps levels to semantic tokens', () => {
    expect(quotaFillColor(0)).toBe('$brand');
    expect(quotaFillColor(0.9)).toBe('$warning');
    expect(quotaFillColor(1)).toBe('$danger');
  });
});

describe('QuotaBar', () => {
  it('renders without producing a NaN% width on a zero cap', () => {
    expect(() => render(<QuotaBar ratio={0 / 0} testID="bar" />)).not.toThrow();
  });
});
