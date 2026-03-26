<script setup lang="ts">
const stripeConnectStore = useStripeConnectStore()
const { startOnboarding, getAccountLink, fetchConnectStatus } = stripeConnectStore

const status = ref<string | null>(null)
const loading = ref(false)
const toast = useToast()

const handleSetup = async () => {
  loading.value = true
  try {
    if (status.value === 'pending') {
      await getAccountLink()
    } else {
      await startOnboarding()
    }
  } catch (e: any) {
    toast.add({
      title: 'Connection Failed',
      description: e.data?.message || 'Failed to start Stripe setup',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const result = await fetchConnectStatus()
  status.value = result?.status || 'not_connected'
})
</script>

<template>
  <div
    v-if="status && status !== 'active'"
    class="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-yellow-400" />
        </div>
        <div class="min-w-0">
          <h3 class="font-semibold text-zinc-100 text-sm">Set up payouts to start earning</h3>
          <p class="text-xs text-zinc-400 truncate">
            {{ status === 'pending' ? 'Complete your Stripe account setup to receive payouts.' : 'Connect your Stripe account to receive revenue from your music.' }}
          </p>
        </div>
      </div>
      <UButton
        color="yellow"
        variant="soft"
        size="sm"
        :loading="loading"
        @click="handleSetup"
        class="shrink-0"
      >
        {{ status === 'pending' ? 'Complete Setup' : 'Connect Stripe' }}
      </UButton>
    </div>
  </div>
</template>
