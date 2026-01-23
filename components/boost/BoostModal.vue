<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="p-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
          <UIcon name="i-heroicons-rocket-launch" class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-xl font-semibold text-zinc-100">
          {{ currentBoost ? 'Update Artist Boost' : 'Add Artist Boost' }}
        </h3>
        <p class="text-sm text-zinc-400 mt-1">100% goes to artists you listen to</p>
      </div>

      <!-- Tier Selection -->
      <div class="space-y-3 mb-6">
        <button
          v-for="tier in tiers"
          :key="tier.amount"
          :class="[
            'w-full p-4 rounded-xl border-2 transition-all text-left',
            selectedAmount === tier.amount
              ? 'border-teal-500 bg-teal-500/10'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50',
          ]"
          :disabled="loading"
          @click="selectedAmount = tier.amount"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-zinc-100">${{ tier.amount }}/mo</span>
                <UBadge
                  v-if="currentBoost?.amount_cents === tier.amount * 100"
                  color="teal"
                  variant="subtle"
                  size="xs"
                >
                  Current
                </UBadge>
              </div>
              <p class="text-sm text-zinc-400 mt-1">{{ tier.label }}</p>
            </div>
            <div
              :class="[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                selectedAmount === tier.amount
                  ? 'border-teal-500 bg-teal-500'
                  : 'border-zinc-600',
              ]"
            >
              <UIcon
                v-if="selectedAmount === tier.amount"
                name="i-heroicons-check"
                class="w-4 h-4 text-white"
              />
            </div>
          </div>
        </button>
      </div>

      <!-- Info Box -->
      <div class="p-4 bg-zinc-800/50 rounded-lg mb-6">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div class="text-sm text-zinc-400">
            <p class="mb-1">Your boost is distributed proportionally to artists based on your listening time.</p>
            <p>Fairtune takes $0 from boosts. Only Stripe's ~3% processing fee applies.</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <p v-if="errorMessage" class="text-sm text-red-400 mb-4 text-center">
        {{ errorMessage }}
      </p>

      <!-- Actions -->
      <div class="space-y-3">
        <UButton
          color="teal"
          size="lg"
          block
          :loading="loading"
          :disabled="!canSubmit"
          @click="submitBoost"
        >
          <UIcon v-if="!loading" name="i-heroicons-rocket-launch" class="w-5 h-5 mr-2" />
          {{ submitLabel }}
        </UButton>

        <UButton
          v-if="currentBoost"
          color="red"
          variant="ghost"
          size="lg"
          block
          :loading="canceling"
          @click="cancelBoost"
        >
          Cancel Boost
        </UButton>

        <UButton
          color="gray"
          variant="ghost"
          block
          @click="isOpen = false"
        >
          {{ currentBoost ? 'Close' : 'Not Now' }}
        </UButton>
      </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
interface BoostTier {
  amount: number
  label: string
}

interface Props {
  currentBoost?: {
    amount_cents: number
    status: string
  } | null
}

const props = defineProps<Props>()

const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const toast = useToast()

const tiers: BoostTier[] = [
  { amount: 5, label: 'Supporter - A little extra love' },
  { amount: 10, label: 'Champion - Double your impact' },
  { amount: 20, label: 'Superfan - Maximum artist support' },
]

const selectedAmount = ref(5)
const loading = ref(false)
const canceling = ref(false)
const errorMessage = ref('')

// Initialize selected amount from current boost
watch(isOpen, (open) => {
  if (open) {
    errorMessage.value = ''
    if (props.currentBoost) {
      selectedAmount.value = props.currentBoost.amount_cents / 100
    } else {
      selectedAmount.value = 5
    }
  }
})

const canSubmit = computed(() => {
  if (!selectedAmount.value) return false
  // If updating, check it's different from current
  if (props.currentBoost) {
    return selectedAmount.value * 100 !== props.currentBoost.amount_cents
  }
  return true
})

const submitLabel = computed(() => {
  if (props.currentBoost) {
    return `Update to $${selectedAmount.value}/mo`
  }
  return `Start $${selectedAmount.value}/mo Boost`
})

const submitBoost = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const endpoint = props.currentBoost ? '/api/boost/update' : '/api/boost/create'
    await $fetch(endpoint, {
      method: 'POST',
      body: { amountCents: selectedAmount.value * 100 },
    })

    toast.add({
      title: props.currentBoost ? 'Boost Updated!' : 'Boost Activated!',
      description: `You're now boosting artists with $${selectedAmount.value}/month`,
      color: 'green',
    })

    isOpen.value = false
    emit('updated')
  } catch (error: any) {
    console.error('Failed to submit boost:', error)
    errorMessage.value = error.data?.message || 'Failed to update boost. Please try again.'
  } finally {
    loading.value = false
  }
}

const cancelBoost = async () => {
  canceling.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{ message: string; cancelAt: string | null }>('/api/boost/cancel', {
      method: 'POST',
    })

    toast.add({
      title: 'Boost Canceled',
      description: response.message,
      color: 'gray',
    })

    isOpen.value = false
    emit('updated')
  } catch (error: any) {
    console.error('Failed to cancel boost:', error)
    errorMessage.value = error.data?.message || 'Failed to cancel boost. Please try again.'
  } finally {
    canceling.value = false
  }
}
</script>
