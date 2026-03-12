// Reactive online/offline detection composable
export const useNetworkStatus = () => {
  const isOnline = ref(true)

  if (import.meta.client) {
    isOnline.value = navigator.onLine

    const setOnline = () => { isOnline.value = true }
    const setOffline = () => { isOnline.value = false }

    onMounted(() => {
      window.addEventListener('online', setOnline)
      window.addEventListener('offline', setOffline)
    })

    onUnmounted(() => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    })
  }

  return { isOnline: readonly(isOnline) }
}
