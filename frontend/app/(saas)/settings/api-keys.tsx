import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Input } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { ConfirmDestructiveModal } from '@saas/components/platform/ConfirmDestructiveModal';
import { ApiKeyUsageSheet } from '@saas/components/apiKeys/ApiKeyUsageSheet';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRenameApiKey,
  ApiKeyView,
  ApiKeyCreated,
} from '@saas/lib/api/apiKeys';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

const MAX_ACTIVE_KEYS = 5;

// ---------------------------------------------------------------------------
// Post-create modal — shows raw key once
// ---------------------------------------------------------------------------

type RawKeyModalProps = { data: ApiKeyCreated; onClose: () => void };

function RawKeyModal({ data, onClose }: RawKeyModalProps) {
  const { t } = useTranslation();

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(data.raw_key);
    }
    showToast(t('saas:apiKeys.copyToast'), TOAST_VARIANT.SUCCESS);
  }

  return (
    <YStack
      position="absolute"
      top={0} left={0} right={0} bottom={0}
      backgroundColor="rgba(0,0,0,0.6)"
      justifyContent="center"
      alignItems="center"
      testID="raw-key-modal"
    >
      <YStack
        backgroundColor="$background"
        borderRadius="$5"
        padding="$4"
        width={360}
        gap="$3"
      >
        <Text fontSize="$5" fontWeight="$7">{t('saas:apiKeys.createdModalTitle')}</Text>
        <Text>{t('saas:apiKeys.createdModalBody')}</Text>
        <Text fontFamily="monospace" testID="raw-key-value">{data.raw_key}</Text>
        <XStack gap="$2" justifyContent="flex-end">
          <AppButton variant="secondary" skipWriteGate onPress={handleCopy} testID="copy-btn">
            {t('saas:apiKeys.copyButton')}
          </AppButton>
          <AppButton variant="primary" skipWriteGate onPress={onClose} testID="done-btn">
            {t('saas:common.done')}
          </AppButton>
        </XStack>
      </YStack>
    </YStack>
  );
}

// ---------------------------------------------------------------------------
// Create modal
// ---------------------------------------------------------------------------

type CreateModalProps = { onSubmit: (name: string) => void; onCancel: () => void };

function CreateModal({ onSubmit, onCancel }: CreateModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  return (
    <YStack
      position="absolute"
      top={0} left={0} right={0} bottom={0}
      backgroundColor="rgba(0,0,0,0.6)"
      justifyContent="center"
      alignItems="center"
      testID="create-key-modal"
    >
      <YStack
        backgroundColor="$background"
        borderRadius="$5"
        padding="$4"
        width={320}
        gap="$3"
      >
        <Text fontSize="$5" fontWeight="$7">{t('saas:apiKeys.createModalTitle')}</Text>
        <Text>{t('saas:apiKeys.createModalNameLabel')}</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t('saas:apiKeys.createNamePlaceholder')}
          testID="key-name-input"
        />
        <XStack gap="$2" justifyContent="flex-end">
          <AppButton variant="ghost" skipWriteGate onPress={onCancel}>
            {t('saas:common.cancel')}
          </AppButton>
          <AppButton
            variant="primary"
            skipWriteGate
            disabled={name.trim().length === 0}
            onPress={() => name.trim() && onSubmit(name.trim())}
            testID="create-submit-btn"
          >
            {t('saas:common.create')}
          </AppButton>
        </XStack>
      </YStack>
    </YStack>
  );
}

// ---------------------------------------------------------------------------
// Key row
// ---------------------------------------------------------------------------

type KeyRowProps = {
  apiKey: ApiKeyView;
  onRevoke: () => void;
  onViewUsage: () => void;
};

function KeyRow({ apiKey, onRevoke, onViewUsage }: KeyRowProps) {
  const { t } = useTranslation();
  const rename = useRenameApiKey();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(apiKey.name);

  function handleSave() {
    if (draftName.trim() && draftName !== apiKey.name) {
      rename.mutate({ id: apiKey.id, name: draftName.trim() }, {
        onError: () => showToast(t('saas:apiKeys.renameError'), TOAST_VARIANT.ERROR),
      });
    }
    setEditing(false);
  }

  const lastUsed = apiKey.last_used_at
    ? new Date(apiKey.last_used_at).toLocaleDateString()
    : t('saas:apiKeys.lastUsedNever');

  return (
    <XStack
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      gap="$3"
      alignItems="center"
      testID={`key-row-${apiKey.id}`}
    >
      {editing ? (
        <Input
          flex={2}
          value={draftName}
          onChangeText={setDraftName}
          onSubmitEditing={handleSave}
          onBlur={handleSave}
          autoFocus
          testID={`key-name-edit-${apiKey.id}`}
        />
      ) : (
        <Text flex={2} fontWeight="$7" onPress={() => setEditing(true)} testID={`key-name-${apiKey.id}`}>
          {apiKey.name}
        </Text>
      )}
      <Text flex={2} fontFamily="monospace" testID={`key-prefix-${apiKey.id}`}>
        {apiKey.key_prefix}…
      </Text>
      <Text flex={2} color="$colorSubtle">{lastUsed}</Text>
      <XStack gap="$1">
        <AppButton variant="ghost" skipWriteGate onPress={onViewUsage} testID={`view-usage-btn-${apiKey.id}`}>
          {t('saas:apiKeys.viewUsage')}
        </AppButton>
        <AppButton variant="danger" skipWriteGate onPress={onRevoke} testID={`revoke-btn-${apiKey.id}`}>
          {t('saas:apiKeys.revoke')}
        </AppButton>
      </XStack>
    </XStack>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ApiKeysScreen() {
  const { t } = useTranslation();
  const { data: keys = [] } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [createdData, setCreatedData] = useState<ApiKeyCreated | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyView | null>(null);
  const [usageTarget, setUsageTarget] = useState<string | null>(null);

  const activeKeys = keys.filter((k) => k.is_active);
  const atLimit = activeKeys.length >= MAX_ACTIVE_KEYS;

  async function handleCreate(name: string) {
    setShowCreate(false);
    try {
      const data = await createKey.mutateAsync({ name });
      setCreatedData(data as ApiKeyCreated);
    } catch {
      showToast(t('saas:apiKeys.createError'), TOAST_VARIANT.ERROR);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setRevokeTarget(null);
    try {
      await revokeKey.mutateAsync(id);
      showToast(t('saas:apiKeys.revokedToast'), TOAST_VARIANT.SUCCESS);
    } catch {
      showToast(t('saas:apiKeys.revokeError'), TOAST_VARIANT.ERROR);
    }
  }

  return (
    <YStack flex={1} padding="$4" gap="$4" testID="api-keys-screen">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="$7">{t('saas:apiKeys.title')}</Text>
        <AppButton
          variant="primary"
          skipWriteGate
          disabled={atLimit}
          onPress={atLimit ? undefined : () => setShowCreate(true)}
          testID="create-key-btn"
        >
          {t('saas:apiKeys.createButton')}
        </AppButton>
      </XStack>

      <Text color="$colorSubtle">{t('saas:apiKeys.subtitle')}</Text>
      <Text fontSize="$2" color="$colorSubtle">{t('saas:apiKeys.rateLimitNote')}</Text>

      {activeKeys.length === 0 ? (
        <Text color="$colorSubtle" testID="keys-empty">{t('saas:apiKeys.noKeys')}</Text>
      ) : (
        activeKeys.map((key) => (
          <KeyRow
            key={key.id}
            apiKey={key}
            onRevoke={() => setRevokeTarget(key)}
            onViewUsage={() => setUsageTarget(key.id)}
          />
        ))
      )}

      {showCreate && (
        <CreateModal onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      )}

      {createdData && (
        <RawKeyModal data={createdData} onClose={() => setCreatedData(null)} />
      )}

      <ConfirmDestructiveModal
        visible={revokeTarget !== null}
        title={t('saas:apiKeys.revokeConfirmTitle')}
        body={t('saas:apiKeys.revokeConfirmBody', { name: revokeTarget?.name ?? '' })}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />

      {usageTarget && (
        <YStack
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          backgroundColor="$background"
          testID="usage-sheet-overlay"
        >
          <ApiKeyUsageSheet
            keyId={usageTarget}
            keyName={activeKeys.find((k) => k.id === usageTarget)?.name ?? ''}
            onClose={() => setUsageTarget(null)}
          />
        </YStack>
      )}
    </YStack>
  );
}
