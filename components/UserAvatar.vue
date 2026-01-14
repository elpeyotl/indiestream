<script setup lang="ts">
interface Props {
  user: {
    displayName?: string | null
    avatarUrl?: string | null
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showInitials?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showInitials: true
})

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl'
}

const getInitials = (name?: string | null): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const initials = computed(() => getInitials(props.user.displayName))
</script>

<template>
  <div
    :class="[
      'rounded-full flex items-center justify-center overflow-hidden',
      sizeClasses[size]
    ]"
  >
    <img
      v-if="user.avatarUrl"
      :src="user.avatarUrl"
      :alt="user.displayName || 'User avatar'"
      class="w-full h-full object-cover"
    />
    <div
      v-else-if="showInitials"
      class="w-full h-full flex items-center justify-center bg-violet-500 text-white font-semibold"
    >
      {{ initials }}
    </div>
    <div
      v-else
      class="w-full h-full bg-zinc-800"
    />
  </div>
</template>
