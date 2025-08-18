import * as Haptics from 'expo-haptics';

let enabled = true;
export function setHapticsEnabled(v){ enabled = !! v; }
export function haptic(type="light") {
  if (!enabled) return;
  const map = {
    light: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    error: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  };
  return map[type] || map.light;
}