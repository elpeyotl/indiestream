<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <div class="text-center">
      <div v-if="icon" :class="['w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center', iconBgClass]">
        <UIcon :name="icon" :class="['w-5 h-5', iconColorClass]" />
      </div>
      <p :class="['text-3xl font-bold', valueColorClass]">{{ value }}</p>
      <p class="text-sm text-zinc-400 mt-1">{{ title }}</p>
      <p v-if="subtitle" class="text-xs text-zinc-500 mt-1">{{ subtitle }}</p>
      <div v-if="trend !== undefined && trend !== 0" class="mt-2">
        <span
          :class="[
            'text-xs font-medium',
            trend > 0 ? 'text-green-400' : 'text-red-400'
          ]"
        >
          <UIcon
            :name="trend > 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
            class="w-3 h-3 inline"
          />
          {{ trend > 0 ? '+' : '' }}{{ trend.toFixed(1) }}% vs last period
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: 'violet' | 'teal' | 'fuchsia' | 'orange' | 'blue' | 'zinc'
  trend?: number // Percentage change (positive or negative)
}

const props = withDefaults(defineProps<Props>(), {
  color: 'violet',
})

const iconBgClass = computed(() => {
  switch (props.color) {
    case 'violet': return 'bg-violet-500/20'
    case 'teal': return 'bg-teal-500/20'
    case 'fuchsia': return 'bg-fuchsia-500/20'
    case 'orange': return 'bg-orange-500/20'
    case 'blue': return 'bg-blue-500/20'
    case 'zinc': return 'bg-zinc-500/20'
    default: return 'bg-violet-500/20'
  }
})

const iconColorClass = computed(() => {
  switch (props.color) {
    case 'violet': return 'text-violet-400'
    case 'teal': return 'text-teal-400'
    case 'fuchsia': return 'text-fuchsia-400'
    case 'orange': return 'text-orange-400'
    case 'blue': return 'text-blue-400'
    case 'zinc': return 'text-zinc-400'
    default: return 'text-violet-400'
  }
})

const valueColorClass = computed(() => {
  switch (props.color) {
    case 'violet': return 'text-violet-400'
    case 'teal': return 'text-teal-400'
    case 'fuchsia': return 'text-fuchsia-400'
    case 'orange': return 'text-orange-400'
    case 'blue': return 'text-blue-400'
    case 'zinc': return 'text-zinc-100'
    default: return 'text-zinc-100'
  }
})
</script>
