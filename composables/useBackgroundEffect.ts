// Background effect preference composable
export type BackgroundEffect =
  | 'none'
  | 'particles'
  | 'gradient-orbs'
  | 'noise'
  | 'bokeh'
  | 'constellation'
  | 'vinyl'
  | 'equalizer'

export interface BackgroundOption {
  value: BackgroundEffect
  label: string
  description: string
}

export const backgroundOptions: BackgroundOption[] = [
  { value: 'none', label: 'None', description: 'No background effect' },
  { value: 'particles', label: 'Particles', description: 'Floating particles' },
  { value: 'gradient-orbs', label: 'Gradient Orbs', description: 'Soft glowing orbs' },
  { value: 'noise', label: 'Film Grain', description: 'Subtle analog texture' },
  { value: 'bokeh', label: 'Bokeh Lights', description: 'Soft focus lights' },
  { value: 'constellation', label: 'Constellation', description: 'Connected stars' },
  { value: 'vinyl', label: 'Vinyl Grooves', description: 'Spinning record' },
  { value: 'equalizer', label: 'Equalizer', description: 'Audio bars' },
]

const STORAGE_KEY = 'fairstream-background-effect'

// Shared state
const currentEffect = ref<BackgroundEffect>('particles')

export const useBackgroundEffect = () => {
  // Load from localStorage on first use
  const loadPreference = () => {
    if (import.meta.server) return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && backgroundOptions.some(o => o.value === saved)) {
      currentEffect.value = saved as BackgroundEffect
    }
  }

  // Save preference
  const setEffect = (effect: BackgroundEffect) => {
    currentEffect.value = effect
    if (!import.meta.server) {
      localStorage.setItem(STORAGE_KEY, effect)
    }
  }

  // Initialize on mount
  onMounted(() => {
    loadPreference()
  })

  return {
    currentEffect: computed(() => currentEffect.value),
    setEffect,
    backgroundOptions,
  }
}
