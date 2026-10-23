import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

const ICONS = {
  share: { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  sent: { ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' },
  received: { ios: 'arrow.down', android: 'arrow_downward', web: 'arrow_downward' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  open: { ios: 'arrow.up.right.square', android: 'open_in_new', web: 'open_in_new' },
  rebroadcast: { ios: 'arrow.clockwise', android: 'replay', web: 'replay' },
  listen: { ios: 'ear', android: 'hearing', web: 'hearing' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type AppIconName = keyof typeof ICONS;

export function AppIcon({
  name,
  size = 18,
  color,
}: {
  name: AppIconName;
  size?: number;
  color: ColorValue;
}) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
