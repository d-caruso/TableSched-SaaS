import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Input, Sheet } from 'tamagui';
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

/**
 * Destructive-confirmation modal built on the shared `Sheet` dialog primitive
 * (same surface as core `ConfirmDialog`). Core `ConfirmDialog` has no body slot,
 * so the optional slug-typed confirmation lives here on the same primitive — a
 * single dialog component with one tokenised scrim (`Sheet.Overlay`), not a
 * hand-rolled translucent overlay.
 */
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

  if (!visible) return null;

  return (
    <Sheet
      open={visible}
      onOpenChange={(val: boolean) => { if (!val) onCancel(); }}
      snapPoints={[45]}
      dismissOnSnapToBottom
      modal
    >
      <Sheet.Overlay />
      <Sheet.Frame
        padding="$4"
        gap="$3"
        borderRadius="$5"
        role="dialog"
        testID="confirm-modal-content"
      >
        <Sheet.Handle />
        <Text fontSize="$5" fontWeight="$7">{title}</Text>
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
      </Sheet.Frame>
    </Sheet>
  );
}
