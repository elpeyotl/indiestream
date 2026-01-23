<template>
  <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
          <UIcon name="i-heroicons-rocket-launch" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-zinc-100">Artist Boost</h3>
          <p class="text-sm text-zinc-400">100% goes to artists</p>
        </div>
      </div>
      <UBadge
        v-if="boost?.status === 'active'"
        color="teal"
        variant="soft"
      >
        Active
      </UBadge>
    </div>

    <!-- Active Boost Display -->
    <div v-if="boost?.status === 'active'" class="space-y-4">
      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-bold text-teal-400">${{ (boost.amount_cents / 100).toFixed(0) }}</span>
        <span class="text-zinc-400">/month</span>
      </div>

      <p class="text-sm text-zinc-400">
        Your boost is distributed to artists based on your listening time each month.
      </p>

      <div class="flex gap-2">
        <UButton
          color="teal"
          variant="soft"
          size="sm"
          @click="showBoostModal = true"
        >
          <UIcon name="i-heroicons-pencil" class="w-4 h-4 mr-1" />
          Change Tier
        </UButton>
      </div>
    </div>

    <!-- No Boost CTA -->
    <div v-else class="space-y-4">
      <p class="text-zinc-300">
        Support the artists you love even more. Add a monthly boost to increase your impact.
      </p>

      <div class="flex items-center gap-2 text-sm text-zinc-400">
        <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-teal-400" />
        <span>Starts at $5/month</span>
      </div>

      <UButton
        color="teal"
        size="sm"
        @click="showBoostModal = true"
      >
        <UIcon name="i-heroicons-rocket-launch" class="w-4 h-4 mr-1" />
        Add Artist Boost
      </UButton>
    </div>

    <!-- Boost Modal -->
    <BoostModal
      v-model="showBoostModal"
      :current-boost="boost"
      @updated="$emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  boost?: {
    amount_cents: number
    status: string
    current_period_end?: string | null
  } | null
}

defineProps<Props>()

defineEmits<{
  (e: 'refresh'): void
}>()

const showBoostModal = ref(false)
</script>
