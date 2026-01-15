/**
 * Composable for haptic feedback on supported devices
 *
 * Provides native-feeling vibration patterns for user interactions
 */

interface HapticsOptions {
  /**
   * Enable haptics globally (default: true)
   */
  enabled?: boolean
}

/**
 * Vibration patterns for different interaction types
 */
const PATTERNS = {
  /** Light tap (10ms) - for selection, button press */
  light: 10,
  /** Medium tap (20ms) - for toggling, confirmation */
  medium: 20,
  /** Heavy tap (30ms) - for important actions */
  heavy: 30,
  /** Success pattern - for completed actions */
  success: [10, 50, 10] as number[],
  /** Error pattern - for failed actions */
  error: [10, 100, 10, 100, 10] as number[],
  /** Selection pattern - for picking items */
  selection: [5, 30, 5] as number[],
  /** Long press pattern - for context menus */
  longPress: [0, 100, 30] as number[],
}

/**
 * Composable for haptic feedback
 *
 * @example
 * const haptics = useHaptics()
 *
 * // Light tap on button press
 * haptics.light()
 *
 * // Success pattern on save
 * haptics.success()
 *
 * // Custom vibration pattern
 * haptics.vibrate([10, 50, 10, 50, 10])
 */
export const useHaptics = (options: HapticsOptions = {}) => {
  const { enabled = true } = options

  /**
   * Check if haptics are supported and enabled
   */
  const isSupported = computed(() => {
    return process.client && 'vibrate' in navigator && enabled
  })

  /**
   * Vibrate with a custom pattern
   * @param pattern - Single duration (ms) or array of durations [vibrate, pause, vibrate, ...]
   */
  const vibrate = (pattern: number | number[]) => {
    if (!isSupported.value) return false

    try {
      return navigator.vibrate(pattern)
    } catch (e) {
      console.warn('Haptic vibration failed:', e)
      return false
    }
  }

  /**
   * Light tap haptic - for subtle feedback
   * Use for: button presses, toggles, selections
   */
  const light = () => vibrate(PATTERNS.light)

  /**
   * Medium tap haptic - for standard feedback
   * Use for: confirmations, form submissions, saves
   */
  const medium = () => vibrate(PATTERNS.medium)

  /**
   * Heavy tap haptic - for strong feedback
   * Use for: errors, warnings, important actions
   */
  const heavy = () => vibrate(PATTERNS.heavy)

  /**
   * Success pattern - for completed actions
   * Use for: successful saves, uploads, submissions
   */
  const success = () => vibrate(PATTERNS.success)

  /**
   * Error pattern - for failed actions
   * Use for: validation errors, failed requests
   */
  const error = () => vibrate(PATTERNS.error)

  /**
   * Selection pattern - for picking items
   * Use for: selecting from list, choosing options
   */
  const selection = () => vibrate(PATTERNS.selection)

  /**
   * Long press pattern - for context menus
   * Use for: opening context menus, drag start
   */
  const longPress = () => vibrate(PATTERNS.longPress)

  /**
   * Cancel any ongoing vibration
   */
  const cancel = () => {
    if (!isSupported.value) return false
    return navigator.vibrate(0)
  }

  return {
    isSupported,
    vibrate,
    light,
    medium,
    heavy,
    success,
    error,
    selection,
    longPress,
    cancel,
    PATTERNS,
  }
}
