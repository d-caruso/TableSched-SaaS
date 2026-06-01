import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@core/components/settings/NotificationTemplatesSection', () => ({
  NotificationTemplatesSection: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'core-notification-templates' });
  },
}));
jest.mock('@saas/components/billing/SmsQuotaBlock', () => ({
  SmsQuotaBlock: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'sms-quota-block' });
  },
}));

import { NotificationTemplatesSection } from '../NotificationTemplatesSection';

describe('NotificationTemplatesSection', () => {
  it('renders both SmsQuotaBlock and core NotificationTemplatesSection', () => {
    const { getByTestId } = render(<NotificationTemplatesSection />);
    expect(getByTestId('sms-quota-block')).toBeTruthy();
    expect(getByTestId('core-notification-templates')).toBeTruthy();
  });
});
