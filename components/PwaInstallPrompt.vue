<template>
  <Transition name="slide-up">
    <div
      v-if="showPrompt && !dismissed"
      class="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
    >
      <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl">
        <div class="flex items-start gap-3">
          <!-- App Icon -->
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-lg">IS</span>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-zinc-100 text-sm">Install Indiestream</h3>
            <p class="text-zinc-400 text-xs mt-0.5">
              Get lock screen controls, faster loading, and a native app experience.
            </p>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 mt-3">
              <UButton
                color="violet"
                size="xs"
                @click="handleInstall"
              >
                <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-1" />
                Install
              </UButton>
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                @click="dismiss"
              >
                Not now
              </UButton>
            </div>
          </div>

          <!-- Close button -->
          <button
            class="text-zinc-500 hover:text-zinc-300 transition-colors"
            @click="dismiss"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const showPrompt = ref(false)
const dismissed = ref(false)
const deferredPrompt = ref<any>(null)

// Check if already installed or dismissed
const isInstalled = computed(() => {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
})

// Check if user dismissed prompt recently (24 hours)
const wasDismissedRecently = () => {
  if (typeof localStorage === 'undefined') return false
  const dismissedAt = localStorage.getItem('pwa-prompt-dismissed')
  if (!dismissedAt) return false
  const dismissedTime = parseInt(dismissedAt, 10)
  const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
  return hoursSinceDismissed < 24
}

// Handle the beforeinstallprompt event
const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault()
  deferredPrompt.value = e

  // Only show if not installed and not recently dismissed
  if (!isInstalled.value && !wasDismissedRecently()) {
    // Delay showing prompt for better UX
    setTimeout(() => {
      showPrompt.value = true
    }, 3000)
  }
}

// Handle install button click
const handleInstall = async () => {
  if (!deferredPrompt.value) {
    // Fallback: show manual install instructions
    showManualInstructions()
    return
  }

  // Show the install prompt
  deferredPrompt.value.prompt()

  // Wait for the user's response
  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === 'accepted') {
    showPrompt.value = false
  }

  deferredPrompt.value = null
}

// Show manual install instructions for browsers that don't support beforeinstallprompt
const showManualInstructions = () => {
  const toast = useToast()
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  if (isIOS) {
    toast.add({
      title: 'Install Indiestream',
      description: 'Tap the Share button, then "Add to Home Screen"',
      icon: 'i-heroicons-arrow-up-on-square',
      timeout: 8000,
    })
  } else if (isAndroid) {
    toast.add({
      title: 'Install Indiestream',
      description: 'Tap the menu (3 dots), then "Add to Home Screen" or "Install App"',
      icon: 'i-heroicons-ellipsis-vertical',
      timeout: 8000,
    })
  } else {
    toast.add({
      title: 'Install Indiestream',
      description: 'Use the browser menu to install this app',
      icon: 'i-heroicons-information-circle',
      timeout: 5000,
    })
  }

  dismiss()
}

// Dismiss the prompt
const dismiss = () => {
  dismissed.value = true
  showPrompt.value = false
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }
}

// Setup event listeners
onMounted(() => {
  if (typeof window === 'undefined') return

  // Don't show if already installed
  if (isInstalled.value) return

  // Listen for the install prompt event
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

  // For iOS/Safari where beforeinstallprompt isn't supported
  // Show prompt after a delay if on mobile and not installed
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isChrome = /Chrome/i.test(navigator.userAgent)

  if (isMobile && !isChrome && !wasDismissedRecently()) {
    setTimeout(() => {
      if (!deferredPrompt.value) {
        showPrompt.value = true
      }
    }, 5000)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
