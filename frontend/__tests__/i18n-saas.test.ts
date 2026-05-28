import enSaas from '../lib/i18n/locales/en.json';
import itSaas from '../lib/i18n/locales/it.json';
import deSaas from '../lib/i18n/locales/de.json';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return flattenKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

const enKeys = flattenKeys(enSaas as unknown as Record<string, unknown>);
const itKeys = flattenKeys(itSaas as unknown as Record<string, unknown>);
const deKeys = flattenKeys(deSaas as unknown as Record<string, unknown>);

test('all EN saas keys are present in IT', () => {
  enKeys.forEach((key) => {
    expect(itKeys).toContain(key);
  });
});

test('all EN saas keys are present in DE', () => {
  enKeys.forEach((key) => {
    expect(deKeys).toContain(key);
  });
});

test('IT has no extra keys not in EN', () => {
  itKeys.forEach((key) => {
    expect(enKeys).toContain(key);
  });
});

test('DE has no extra keys not in EN', () => {
  deKeys.forEach((key) => {
    expect(enKeys).toContain(key);
  });
});
