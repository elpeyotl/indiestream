<template>
  <div class="text-center py-16">
    <div
      class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
      :class="iconBgClass"
    >
      <UIcon :name="icon" class="w-10 h-10" :class="iconColorClass" />
    </div>
    <h3 class="text-xl font-semibold text-zinc-100 mb-2">{{ title }}</h3>
    <p class="text-zinc-400 mb-6 max-w-md mx-auto">{{ description }}</p>
    <UButton v-if="actionLabel" :color="color" :to="actionTo" @click="$emit('action')">
      <UIcon v-if="actionIcon" :name="actionIcon" class="w-4 h-4 mr-1" />
      {{ actionLabel }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
  actionIcon?: string
  color?: 'violet' | 'red' | 'green' | 'gray'
}>()

defineEmits<{
  action: []
}>()

const color = computed(() => props.color || 'violet')

const iconBgClass = computed(() => {
  const colors: Record<string, string> = {
    violet: 'bg-violet-500/20',
    red: 'bg-red-500/20',
    green: 'bg-green-500/20',
    gray: 'bg-zinc-500/20',
  }
  return colors[color.value] || colors.violet
})

const iconColorClass = computed(() => {
  const colors: Record<string, string> = {
    violet: 'text-violet-400',
    red: 'text-red-400',
    green: 'text-green-400',
    gray: 'text-zinc-400',
  }
  return colors[color.value] || colors.violet
})
</script>
