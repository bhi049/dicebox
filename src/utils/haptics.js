// src/utils/haptics.js
import * as Haptics from "expo-haptics";

let enabled = true;

export function setHapticsEnabled(v) {
  enabled = !!v;
}

export function isHapticsEnabled() {
  return enabled;
}

/**
 * Trigger a haptic effect.
 * Supported types:
 *  - "select", "light", "medium", "heavy"
 *  - "success", "warning", "error"
 */
export async function haptic(type = "light") {
  if (!enabled) return;
  try {
    const runners = {
      select: () => Haptics.selectionAsync(),
      light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    };

    const run = runners[type] || runners.light;
    return run();
  } catch {
    // No-op on simulators / unsupported devices
  }
}
