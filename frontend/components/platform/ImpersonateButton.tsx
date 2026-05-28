import { useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCreateImpersonationToken } from '@saas/lib/api/platform';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';
import { ConfirmDestructiveModal } from './ConfirmDestructiveModal';
import { AppButton } from '@saas/components/ui/AppButton';

type Props = { tenantId: number; tenantName: string; restaurantId: string };

export function ImpersonateButton({ tenantId, tenantName, restaurantId }: Props) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const create = useCreateImpersonationToken(tenantId);

  async function handleConfirm() {
    setModalVisible(false);
    try {
      const { token } = await create.mutateAsync();
      const url = `/platform/impersonate/callback?token=${encodeURIComponent(token)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
      Linking.openURL(url);
    } catch {
      showToast(t('saas:platform.impersonate.tokenError'), TOAST_VARIANT.ERROR);
    }
  }

  return (
    <>
      <AppButton
        variant="primary"
        skipWriteGate
        onPress={() => setModalVisible(true)}
        testID="impersonate-btn"
      >
        {t('saas:platform.impersonate.button')}
      </AppButton>
      <ConfirmDestructiveModal
        visible={modalVisible}
        title={t('saas:platform.impersonate.confirmTitle')}
        body={t('saas:platform.impersonate.confirmBody', { tenant: tenantName })}
        confirmLabel={t('saas:platform.impersonate.button')}
        onConfirm={handleConfirm}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
}
