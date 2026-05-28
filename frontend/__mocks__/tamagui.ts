// @ts-nocheck
/**
 * Tamagui mock for Jest + @testing-library/react-native.
 *
 * RNTL queries the React Native component tree, so Tamagui stubs must back
 * onto RN host components (View, Text, TextInput, Switch, Pressable).
 * This is not a workaround — it is the only approach that works with RNTL,
 * as documented by the community (no official Tamagui Jest preset exists).
 */
const React = require('react');
const { View, Text, TextInput, Switch, Pressable, ScrollView } = require('react-native');

const stack = ({ children, onPress, accessibilityRole, accessibilityLabel, accessibilityState, testID, role, 'aria-label': ariaLabel }: any) =>
  React.createElement(
    Pressable,
    { onPress, accessibilityRole: role ?? accessibilityRole, accessibilityLabel: ariaLabel ?? accessibilityLabel, accessibilityState, testID },
    typeof children === 'string' ? React.createElement(Text, null, children) : (children ?? null),
  );

const view = ({ children, testID, accessibilityLabel, accessibilityRole, accessibilityState, accessibilityValue, onPress, role, 'aria-label': ariaLabel, 'aria-disabled': ariaDisabled, 'aria-selected': ariaSelected, 'aria-checked': ariaChecked, 'aria-valuenow': ariaValueNow, 'aria-valuemin': ariaValueMin, 'aria-valuemax': ariaValueMax }: any) => {
  const mergedState = {
    ...accessibilityState,
    ...(ariaDisabled != null && { disabled: ariaDisabled }),
    ...(ariaSelected != null && { selected: ariaSelected }),
    ...(ariaChecked != null && { checked: ariaChecked }),
  };
  const mergedValue = {
    ...accessibilityValue,
    ...(ariaValueNow != null && { now: ariaValueNow }),
    ...(ariaValueMin != null && { min: ariaValueMin }),
    ...(ariaValueMax != null && { max: ariaValueMax }),
  };
  return React.createElement(
    View,
    {
      testID,
      accessibilityLabel: ariaLabel ?? accessibilityLabel,
      accessibilityRole: role ?? accessibilityRole,
      accessibilityState: Object.keys(mergedState).length > 0 ? mergedState : undefined,
      accessibilityValue: Object.keys(mergedValue).length > 0 ? mergedValue : undefined,
      onPress,
      ...((role ?? accessibilityRole) != null && { accessible: true }),
    },
    children ?? null,
  );
};

const text = ({ children, testID, accessibilityLabel }: any) =>
  React.createElement(Text, { testID, accessibilityLabel }, children ?? null);

module.exports = {
  Stack: stack,
  XStack: view,
  YStack: view,
  Text: text,
  SizableText: text,
  Button: stack,
  Spinner: () => null,
  ScrollView: ({ children }: any) => React.createElement(ScrollView, null, children ?? null),
  Input: ({ accessibilityLabel, 'aria-label': ariaLabel, value, onChangeText, placeholder, testID }: any) =>
    React.createElement(TextInput, { accessibilityLabel: ariaLabel ?? accessibilityLabel, value, onChangeText, placeholder, testID }),
  TextArea: ({ accessibilityLabel, 'aria-label': ariaLabel, value, onChangeText, placeholder, testID }: any) =>
    React.createElement(TextInput, { accessibilityLabel: ariaLabel ?? accessibilityLabel, value, onChangeText, placeholder, testID, multiline: true }),
  Switch: ({ checked, onCheckedChange, accessibilityRole, testID }: any) =>
    React.createElement(Switch, { value: checked ?? false, onValueChange: onCheckedChange, accessibilityRole: accessibilityRole ?? 'switch', testID }),
  Select: view,
  Sheet: Object.assign(view, {
    Frame:   view,
    Overlay: () => null,
    Handle:  () => null,
  }),
  Adapt: view,
  H1: text,
  H2: text,
  Separator: () => React.createElement(View, null),
  Theme: ({ children }: any) => children ?? null,
  TamaguiProvider: ({ children }: any) => children,
  useMedia: jest.fn(() => ({})),
  createTamagui: (config: any) => config,
  createTheme:   (theme: any)  => theme,
};
