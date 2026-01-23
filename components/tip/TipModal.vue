<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="p-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-zinc-800">
          <NuxtImg
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="artistName"
            :width="80"
            :height="80"
            format="webp"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="w-8 h-8 text-zinc-600" />
          </div>
        </div>
        <h3 class="text-xl font-semibold text-zinc-100">Tip {{ artistName }}</h3>
        <p class="text-sm text-zinc-400 mt-1">100% goes to the artist</p>
        <UBadge color="pink" variant="subtle" size="xs" class="mt-2">
          <UIcon name="i-heroicons-heart" class="w-3 h-3 mr-1" />
          Direct support
        </UBadge>
      </div>

      <!-- Amount Selection -->
      <div class="mb-6">
        <p class="text-sm text-zinc-400 mb-3 text-center">Choose an amount</p>

        <!-- Preset Amounts -->
        <div class="grid grid-cols-4 gap-2 mb-4">
          <button
            v-for="amount in presetAmounts"
            :key="amount"
            :class="[
              'py-3 px-2 rounded-lg font-semibold transition-all',
              selectedAmount === amount && !isCustom
                ? 'bg-pink-500 text-white ring-2 ring-pink-400'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
            ]"
            @click="selectPreset(amount)"
          >
            ${{ amount }}
          </button>
        </div>

        <!-- Custom Amount -->
        <div class="flex items-center gap-3">
          <button
            :class="[
              'py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap',
              isCustom
                ? 'bg-pink-500 text-white ring-2 ring-pink-400'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
            ]"
            @click="enableCustom"
          >
            Custom
          </button>
          <div v-if="isCustom" class="flex-1 flex items-center gap-2">
            <span class="text-zinc-400">$</span>
            <UInput
              v-model="customAmount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              size="lg"
              class="flex-1"
              autofocus
            />
          </div>
        </div>

        <!-- Validation message -->
        <p v-if="validationError" class="text-sm text-red-400 mt-2 text-center">
          {{ validationError }}
        </p>
      </div>

      <!-- Optional Message -->
      <div class="mb-6">
        <UTextarea
          v-model="message"
          placeholder="Add a message (optional)"
          :rows="2"
          :maxlength="500"
          :ui="{ base: 'resize-none' }"
        />
        <div class="flex items-center gap-2 mt-2">
          <UCheckbox v-model="isAnonymous" />
          <span class="text-sm text-zinc-400">Send anonymously</span>
        </div>
      </div>

      <!-- Summary & Action -->
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <span class="text-zinc-400">Your tip</span>
          <span class="text-xl font-bold text-zinc-100">${{ displayAmount }}</span>
        </div>

        <p class="text-xs text-zinc-500 text-center">
          Only Stripe's ~3% processing fee applies. Fairtune takes $0.
        </p>

        <UButton
          color="pink"
          size="lg"
          block
          :loading="loading"
          :disabled="!canTip"
          @click="createTip"
        >
          <UIcon v-if="!loading" name="i-heroicons-heart" class="w-5 h-5 mr-2" />
          Send ${{ displayAmount }} Tip
        </UButton>

        <UButton
          color="gray"
          variant="ghost"
          block
          @click="isOpen = false"
        >
          Cancel
        </UButton>
      </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
interface Props {
  band: {
    id: string
    name: string
    slug: string
  }
  artistName?: string
  avatarUrl?: string | null
}

const props = defineProps<Props>()

const isOpen = defineModel<boolean>({ default: false })

const artistName = computed(() => props.artistName || props.band.name)

// State
const presetAmounts = [2, 5, 10, 20]
const selectedAmount = ref(5) // Default to $5
const isCustom = ref(false)
const customAmount = ref('')
const message = ref('')
const isAnonymous = ref(false)
const loading = ref(false)

// Reset when modal opens/closes
watch(isOpen, (open) => {
  if (open) {
    selectedAmount.value = 5
    isCustom.value = false
    customAmount.value = ''
    message.value = ''
    isAnonymous.value = false
  }
})

const selectPreset = (amount: number) => {
  selectedAmount.value = amount
  isCustom.value = false
  customAmount.value = ''
}

const enableCustom = () => {
  isCustom.value = true
  customAmount.value = ''
}

const currentAmount = computed(() => {
  if (isCustom.value) {
    const parsed = parseFloat(customAmount.value)
    return isNaN(parsed) ? 0 : parsed
  }
  return selectedAmount.value
})

const displayAmount = computed(() => {
  return currentAmount.value.toFixed(2)
})

const validationError = computed(() => {
  if (isCustom.value && customAmount.value) {
    const amount = parseFloat(customAmount.value)
    if (amount < 1) return 'Minimum tip is $1'
    if (amount > 500) return 'Maximum tip is $500'
  }
  return ''
})

const canTip = computed(() => {
  if (validationError.value) return false
  return currentAmount.value >= 1
})

const createTip = async () => {
  if (!canTip.value) return

  loading.value = true

  try {
    const response = await $fetch<{ checkoutUrl: string }>('/api/tips/create', {
      method: 'POST',
      body: {
        bandId: props.band.id,
        amountCents: Math.round(currentAmount.value * 100),
        message: message.value || undefined,
        isAnonymous: isAnonymous.value,
      },
    })

    // Redirect to Stripe Checkout
    if (response.checkoutUrl) {
      window.location.href = response.checkoutUrl
    }
  } catch (error: any) {
    console.error('Failed to create tip:', error)
    // Show error toast
    const toast = useToast()
    toast.add({
      title: 'Failed to create tip',
      description: error.data?.message || 'Please try again',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}
</script>
