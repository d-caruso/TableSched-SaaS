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

// Explicit lifecycle namespace parity
const LIFECYCLE_KEYS = [
  'lifecycle.writeBlockedToast',
  'lifecycle.suspendedBanner',
  'lifecycle.suspendedTooltip',
  'lifecycle.restorePayment',
  'lifecycle.cancelledTitle',
  'lifecycle.cancelledBody',
  'lifecycle.cancelledCustomerBanner',
  'lifecycle.reactivateOnboard',
  'lifecycle.exportData',
  'lifecycle.reactivatedToast',
  'lifecycle.historyTitle',
  'lifecycle.eventReasonInvoicePaymentFailed',
  'lifecycle.eventReasonInvoicePaid',
  'lifecycle.eventReasonPlatformAdmin',
  'lifecycle.eventReasonOwnerCancelled',
  'lifecycle.pastDueBanner',
  'lifecycle.updatePayment',
];

test('all lifecycle keys are present in EN', () => {
  LIFECYCLE_KEYS.forEach((key) => {
    expect(enKeys).toContain(key);
  });
});

test('all lifecycle keys are present in IT', () => {
  LIFECYCLE_KEYS.forEach((key) => {
    expect(itKeys).toContain(key);
  });
});

test('all lifecycle keys are present in DE', () => {
  LIFECYCLE_KEYS.forEach((key) => {
    expect(deKeys).toContain(key);
  });
});

// Explicit platform namespace parity
const PLATFORM_KEYS = [
  'platform.title',
  'platform.returnToRestaurant',
  'platform.tenants.title',
  'platform.tenants.empty',
  'platform.tenants.search',
  'platform.tenants.filterAll',
  'platform.tenants.filterActive',
  'platform.tenants.filterPastDue',
  'platform.tenants.filterSuspended',
  'platform.tenants.filterCancelled',
  'platform.tenant.suspendConfirmTitle',
  'platform.tenant.suspendConfirmBody',
  'platform.tenant.cancelConfirmTitle',
  'platform.tenant.cancelConfirmBody',
  'platform.tenant.deleteConfirmTitle',
  'platform.tenant.deleteConfirmBody',
  'platform.tenant.deleteTypeSlugLabel',
  'platform.subscription.title',
  'platform.subscription.planLabel',
  'platform.subscription.locationOverrideLabel',
  'platform.subscription.trialEndsAtLabel',
  'platform.subscription.statusOverrideDisclosure',
  'platform.impersonate.confirmTitle',
  'platform.impersonate.confirmBody',
  'platform.impersonate.banner',
  'platform.impersonate.endSession',
  'platform.impersonate.callbackInProgress',
  'platform.impersonate.callbackError',
  'platform.actionLog.title',
  'platform.toasts.suspended',
  'platform.toasts.reactivated',
  'platform.toasts.cancelled',
  'platform.toasts.deletionScheduled',
  'platform.toasts.subscriptionUpdated',
];

test('all platform keys are present in EN', () => {
  PLATFORM_KEYS.forEach((key) => {
    expect(enKeys).toContain(key);
  });
});

test('all platform keys are present in IT', () => {
  PLATFORM_KEYS.forEach((key) => {
    expect(itKeys).toContain(key);
  });
});

test('all platform keys are present in DE', () => {
  PLATFORM_KEYS.forEach((key) => {
    expect(deKeys).toContain(key);
  });
});

// apiKeys namespace parity
const API_KEYS_KEYS = [
  'apiKeys.title',
  'apiKeys.subtitle',
  'apiKeys.rateLimitNote',
  'apiKeys.maxReached',
  'apiKeys.createButton',
  'apiKeys.createModalTitle',
  'apiKeys.createModalNameLabel',
  'apiKeys.createdModalTitle',
  'apiKeys.createdModalBody',
  'apiKeys.copyButton',
  'apiKeys.copyToast',
  'apiKeys.lastUsedNever',
  'apiKeys.lastUsedRelative',
  'apiKeys.revokeConfirmTitle',
  'apiKeys.revokeConfirmBody',
  'apiKeys.revokedToast',
  'apiKeys.renameError',
  'apiKeys.usageTitle',
  'apiKeys.usageThisMonth',
  'apiKeys.usageMonthRow',
  'apiKeys.rateLimitedToast',
  'apiKeys.upsellTitle',
  'apiKeys.upsellBody',
  'apiKeys.upsellCta',
  'platform.tenant.apiKeysSummaryTitle',
  'platform.tenant.apiKeysSummaryActiveCount',
  'platform.tenant.apiKeysSummaryRecent',
];

test('all apiKeys keys are present in EN', () => {
  API_KEYS_KEYS.forEach((key) => { expect(enKeys).toContain(key); });
});

test('all apiKeys keys are present in IT', () => {
  API_KEYS_KEYS.forEach((key) => { expect(itKeys).toContain(key); });
});

test('all apiKeys keys are present in DE', () => {
  API_KEYS_KEYS.forEach((key) => { expect(deKeys).toContain(key); });
});

// SMS gateway namespace parity
const SMS_KEYS = [
  'platform.sms.navLabel',
  'platform.sms.healthTitle',
  'platform.sms.healthSubtitle',
  'platform.sms.providerHealthy',
  'platform.sms.providerDegraded',
  'platform.sms.deliveryRate',
  'platform.sms.totalSent',
  'platform.sms.deliveryLogTitle',
  'platform.sms.deliveryLogEmpty',
  'platform.sms.filterProvider',
  'platform.sms.filterStatus',
  'platform.sms.filterDateFrom',
  'platform.sms.filterDateTo',
  'platform.sms.statusPending',
  'platform.sms.statusDelivered',
  'platform.sms.statusFailed',
  'platform.sms.routingTitle',
  'platform.sms.routingEmpty',
  'platform.sms.routingDefault',
  'platform.sms.errorCode',
];

test('all SMS keys are present in EN', () => {
  SMS_KEYS.forEach((key) => { expect(enKeys).toContain(key); });
});

test('all SMS keys are present in IT', () => {
  SMS_KEYS.forEach((key) => { expect(itKeys).toContain(key); });
});

test('all SMS keys are present in DE', () => {
  SMS_KEYS.forEach((key) => { expect(deKeys).toContain(key); });
});
