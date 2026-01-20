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
  | 'trip'
  | 'tunnel'

export interface BackgroundOption {
  value: BackgroundEffect
  label: string
  description: string
}

export const backgroundOptions: BackgroundOption[] = [
  { value: 'none', label: 'None', description: 'No background effect' },
  { value: 'particles', label: 'Particles', description: 'Floating particles' },
  { value: 'gradient-orbs', label: 'Gradient Orbs', description: 'Soft glowing orbs' },
  { value: 'noise', label: 'Inferno', description: 'Rising embers & flames' },
  { value: 'bokeh', label: 'Bokeh Lights', description: 'Soft focus lights' },
  { value: 'constellation', label: 'Constellation', description: 'Connected stars' },
  { value: 'vinyl', label: 'Vinyl Grooves', description: 'Spinning record' },
  { value: 'equalizer', label: 'Equalizer', description: 'Audio bars' },
  { value: 'trip', label: 'Trippy', description: 'Psychedelic visuals' },
  { value: 'tunnel', label: 'Tunnel', description: 'Hypnotic wormhole' },
]

const STORAGE_KEY = 'fairstream-background-effect'

export const useBackgroundEffect = () => {
  // Use Nuxt's useState for proper SSR-safe shared state
  const currentEffect = useState<BackgroundEffect>('background-effect', () => 'particles')

  // Load from localStorage on first use (client-side only)
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
    currentEffect,
    setEffect,
    backgroundOptions,
  }
}
