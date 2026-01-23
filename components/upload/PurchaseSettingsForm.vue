<template>
  <div class="space-y-6">
    <!-- Enable Purchases Toggle -->
    <div class="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
      <div>
        <p class="font-medium text-zinc-100">Enable album purchases</p>
        <p class="text-sm text-zinc-400 mt-1">
          Allow fans to buy and download this album
        </p>
      </div>
      <UToggle
        :model-value="modelValue.purchasable"
        color="violet"
        @update:model-value="updateField('purchasable', $event)"
      />
    </div>

    <!-- Pricing Options (shown when purchases enabled) -->
    <div v-if="modelValue.purchasable" class="space-y-6 pl-4 border-l-2 border-violet-500/30">
      <!-- Pricing Mode -->
      <div>
        <label class="block text-sm font-medium text-zinc-300 mb-2">
          Pricing model
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 rounded-lg border text-left transition-colors"
            :class="!modelValue.pay_what_you_want
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-zinc-700 hover:border-zinc-600'"
            @click="updateField('pay_what_you_want', false)"
          >
            <p class="font-medium text-zinc-100">Fixed price</p>
            <p class="text-sm text-zinc-400 mt-1">Set a single price for the album</p>
          </button>
          <button
            type="button"
            class="p-4 rounded-lg border text-left transition-colors"
            :class="modelValue.pay_what_you_want
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-zinc-700 hover:border-zinc-600'"
            @click="updateField('pay_what_you_want', true)"
          >
            <p class="font-medium text-zinc-100">Pay what you want</p>
            <p class="text-sm text-zinc-400 mt-1">Fans choose their price</p>
          </button>
        </div>
      </div>

      <!-- Fixed Price Input -->
      <div v-if="!modelValue.pay_what_you_want">
        <label class="block text-sm font-medium text-zinc-300 mb-2">
          Album price
        </label>
        <div class="flex items-center gap-2">
          <span class="text-zinc-400">CHF</span>
          <UInput
            :model-value="fixedPriceDisplay"
            type="number"
            min="1"
            step="0.50"
            placeholder="9.99"
            size="lg"
            class="w-32"
            @update:model-value="updatePrice($event)"
          />
        </div>
        <p class="text-xs text-zinc-500 mt-2">
          Minimum CHF 1.00. You'll receive 85% (CHF {{ artistShare }})
        </p>
      </div>

      <!-- Pay What You Want Settings -->
      <div v-else>
        <label class="block text-sm font-medium text-zinc-300 mb-2">
          Minimum price
        </label>
        <div class="flex items-center gap-2">
          <span class="text-zinc-400">CHF</span>
          <UInput
            :model-value="minimumPriceDisplay"
            type="number"
            min="1"
            step="0.50"
            placeholder="5.00"
            size="lg"
            class="w-32"
            @update:model-value="updateMinimumPrice($event)"
          />
        </div>
        <p class="text-xs text-zinc-500 mt-2">
          Minimum CHF 1.00. Fans can pay more if they choose
        </p>
      </div>

      <!-- Revenue Info -->
      <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-green-400">85% goes to you</p>
            <p class="text-sm text-zinc-400 mt-1">
              15% platform fee covers payment processing, hosting, and support.
              No hidden fees.
            </p>
          </div>
        </div>
      </div>

      <!-- Stripe Connect Reminder -->
      <div v-if="!stripeConnected" class="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-amber-400">Set up payments first</p>
            <p class="text-sm text-zinc-400 mt-1">
              Connect your Stripe account in the
              <NuxtLink to="/dashboard" class="text-violet-400 hover:underline">
                Artist Dashboard
              </NuxtLink>
              to receive payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PurchaseSettings {
  purchasable: boolean
  price_cents: number | null
  pay_what_you_want: boolean
  minimum_price_cents: number | null
}

interface Props {
  modelValue: PurchaseSettings
  stripeConnected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  stripeConnected: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: PurchaseSettings): void
}>()

// Computed display values
const fixedPriceDisplay = computed(() => {
  if (props.modelValue.price_cents) {
    return (props.modelValue.price_cents / 100).toFixed(2)
  }
  return ''
})

const minimumPriceDisplay = computed(() => {
  if (props.modelValue.minimum_price_cents) {
    return (props.modelValue.minimum_price_cents / 100).toFixed(2)
  }
  return ''
})

const artistShare = computed(() => {
  const price = props.modelValue.price_cents || 0
  return ((price * 0.85) / 100).toFixed(2)
})

// Update single field
const updateField = <K extends keyof PurchaseSettings>(
  field: K,
  value: PurchaseSettings[K]
) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}

// Update price (convert from display to cents)
const updatePrice = (value: string) => {
  const cents = Math.round(parseFloat(value || '0') * 100)
  updateField('price_cents', cents >= 100 ? cents : null)
}

// Update minimum price (convert from display to cents)
const updateMinimumPrice = (value: string) => {
  const cents = Math.round(parseFloat(value || '0') * 100)
  updateField('minimum_price_cents', cents >= 100 ? cents : null)
}
</script>
