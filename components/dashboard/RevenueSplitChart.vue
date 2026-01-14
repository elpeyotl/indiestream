<template>
  <div class="flex flex-col items-center">
    <!-- Donut Chart -->
    <div class="relative w-48 h-48 mb-6">
      <!-- SVG Donut Chart -->
      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          stroke-width="16"
          class="text-zinc-800"
        />

        <!-- Artist segment (70%) -->
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          stroke-width="16"
          :stroke-dasharray="`${artistSegment} ${100 - artistSegment}`"
          stroke-dashoffset="0"
          class="text-teal-500 transition-all duration-500"
        />

        <!-- CMO segment (15%) -->
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          stroke-width="16"
          :stroke-dasharray="`${cmoSegment} ${100 - cmoSegment}`"
          :stroke-dashoffset="`-${artistSegment}`"
          class="text-violet-500 transition-all duration-500"
        />

        <!-- Platform segment (15%) -->
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          stroke-width="16"
          :stroke-dasharray="`${platformSegment} ${100 - platformSegment}`"
          :stroke-dashoffset="`-${artistSegment + cmoSegment}`"
          class="text-zinc-500 transition-all duration-500"
        />
      </svg>

      <!-- Center Text -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="text-2xl font-bold text-zinc-100">{{ formattedTotal }}</p>
        <p class="text-xs text-zinc-400">{{ totalLabel }}</p>
      </div>
    </div>

    <!-- Legend -->
    <div class="space-y-3 w-full max-w-xs">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-teal-500"></div>
          <span class="text-sm text-zinc-300">Artists</span>
        </div>
        <div class="text-right">
          <p class="text-sm font-semibold text-zinc-100">{{ formatCurrency(artistPoolCents) }}</p>
          <p class="text-xs text-zinc-500">70%</p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-violet-500"></div>
          <span class="text-sm text-zinc-300">CMOs</span>
        </div>
        <div class="text-right">
          <p class="text-sm font-semibold text-zinc-100">{{ formatCurrency(cmoFeeCents) }}</p>
          <p class="text-xs text-zinc-500">15%</p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-zinc-500"></div>
          <span class="text-sm text-zinc-300">Platform</span>
        </div>
        <div class="text-right">
          <p class="text-sm font-semibold text-zinc-100">{{ formatCurrency(platformFeeCents) }}</p>
          <p class="text-xs text-zinc-500">15%</p>
        </div>
      </div>
    </div>

    <!-- Info Text -->
    <p class="text-xs text-zinc-500 text-center mt-4 max-w-md">
      CMO fees fund performance royalties for composers and songwriters through SUISA, GEMA, PRS, ASCAP, and BMI.
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  totalPaidCents: number
  artistPoolCents: number
  cmoFeeCents: number
  platformFeeCents: number
  monthsSubscribed?: number
}

const props = withDefaults(defineProps<Props>(), {
  monthsSubscribed: 1,
})

// Calculate circle circumference and segments
// For a radius of 40, circumference = 2 * π * r = ~251.33
// We need to convert to percentage of circumference for stroke-dasharray
// Since SVG uses circumference units, we calculate percentage * circumference

const circumference = 2 * Math.PI * 40 // ~251.33

// Convert percentages to circumference units
const artistSegment = (70 / 100) * circumference // 70%
const cmoSegment = (15 / 100) * circumference // 15%
const platformSegment = (15 / 100) * circumference // 15%

const formattedTotal = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.totalPaidCents / 100)
})

const totalLabel = computed(() => {
  return props.monthsSubscribed === 1 ? 'per month' : `${props.monthsSubscribed} months`
})

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
</script>
