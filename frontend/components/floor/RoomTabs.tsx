import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PRESS_STYLE, FOCUS_STYLE } from '@core/constants/styles';
import { YStack, Text, XStack } from 'tamagui';
import type { Room } from '@core/lib/api/types';
import { useLimitState } from '@saas/lib/limits';

// Floor-plan tab sizing. The pill-box treatment is a deliberate floor-plan
// affordance (room "buttons"), an intentional divergence from the core
// FilterTabs/SegmentedControl tab language — see docs/UX-critique-report.md.
const ROOM_TAB_MIN_WIDTH = 106;
const ADD_ROOM_MIN_WIDTH = 126;
const ROOM_TAB_HEIGHT = 54;

type Props = {
  rooms: Room[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddRoom?: () => void;
};

export function RoomTabs({ rooms, activeId, onSelect, onAddRoom }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { atLimit, cap } = useLimitState('rooms');

  return (
    <XStack gap="$2" flexWrap="wrap">
      {rooms.map(room => {
        const selected = room.id === activeId;

        return (
          <YStack
            key={room.id}
            role="tab"
            aria-label={room.name}
            aria-selected={selected}
            onPress={() => onSelect(room.id)}
            pressStyle={PRESS_STYLE}
            focusStyle={FOCUS_STYLE}
            cursor="pointer"
            backgroundColor={selected ? '$brand' : '$background'}
            borderWidth={1}
            borderColor={selected ? '$brand' : '$inputBorder'}
            borderRadius="$4"
            minWidth={ROOM_TAB_MIN_WIDTH}
            height={ROOM_TAB_HEIGHT}
            justifyContent="center"
            alignItems="center"
            paddingHorizontal="$4"
          >
            <Text
              fontSize="$6"
              fontWeight={selected ? '$7' : '$4'}
              color={selected ? '$background' : '$placeholderColor'}
            >
              {room.name}
            </Text>
          </YStack>
        );
      })}
      <YStack
        borderWidth={1}
        borderStyle="dashed"
        borderColor={atLimit ? '$borderColor' : '$inputBorder'}
        borderRadius="$4"
        minWidth={ADD_ROOM_MIN_WIDTH}
        height={ROOM_TAB_HEIGHT}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="$4"
        opacity={atLimit ? 0.4 : 0.85}
        onPress={atLimit ? () => router.push('/(saas)/billing/upgrade') : onAddRoom}
        cursor={atLimit ? 'not-allowed' : 'pointer'}
        pressStyle={atLimit ? undefined : PRESS_STYLE}
        focusStyle={FOCUS_STYLE}
      >
        <Text fontSize="$6" fontWeight="$4" color="$placeholderColor">
          {atLimit
            ? t('saas:limits.roomsReached', { cap })
            : t('staff.floor.addRoom')}
        </Text>
      </YStack>
    </XStack>
  );
}
