import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-native';
import { YStack, XStack, Text, Input } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  requireTypedSlug?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDestructiveModal({
  visible,
  title,
  body,
  confirmLabel,
  requireTypedSlug,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');

  const canConfirm = requireTypedSlug ? typed === requireTypedSlug : true;

  return (
    <Modal visible={visible} transparent animationType="fade" testID="confirm-modal">
      <YStack
        flex={1}
        backgroundColor="rgba(0,0,0,0.5)"
        justifyContent="center"
        alignItems="center"
      >
        <YStack
          backgroundColor="$background"
          borderRadius="$3"
          padding="$4"
          width={340}
          gap="$3"
          testID="confirm-modal-content"
        >
          <Text fontSize="$5" fontWeight="700">{title}</Text>
          <Text>{body}</Text>
          {requireTypedSlug && (
            <YStack gap="$1">
              <Text fontSize="$2">{t('saas:platform.tenant.deleteTypeSlugLabel')}</Text>
              <Input
                value={typed}
                onChangeText={setTyped}
                autoCapitalize="none"
                testID="slug-confirm-input"
              />
            </YStack>
          )}
          <XStack gap="$2" justifyContent="flex-end">
            <AppButton variant="ghost" skipWriteGate onPress={onCancel} testID="modal-cancel-btn">
              {t('saas:common.cancel')}
            </AppButton>
            <AppButton
              variant="danger"
              skipWriteGate
              disabled={!canConfirm}
              opacity={canConfirm ? 1 : 0.4}
              onPress={canConfirm ? onConfirm : undefined}
              testID="modal-confirm-btn"
            >
              {confirmLabel ?? t('saas:common.confirm')}
            </AppButton>
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
