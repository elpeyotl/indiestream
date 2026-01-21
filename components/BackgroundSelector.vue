<template>
  <ResponsivePopover v-model:open="isOpen" title="Background Effect" placement="bottom-start" width="w-64">
    <template #trigger>
      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        icon="i-heroicons-sparkles"
        class="text-zinc-400 hover:text-violet-400"
      />
    </template>

    <div
      ref="panelRef"
      class="p-3 outline-none"
      tabindex="0"
      @keydown="onKeyDown"
    >
      <p class="text-xs font-medium text-zinc-400 mb-2 md:hidden">Select a background effect</p>
      <div class="space-y-1">
        <button
          v-for="(option, index) in backgroundOptions"
          :key="option.value"
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors touch-manipulation"
          :class="[
            currentEffect === option.value
              ? 'bg-violet-500/20 text-violet-400'
              : focusedIndex === index
                ? 'bg-zinc-800 text-zinc-300'
                : 'hover:bg-zinc-800 text-zinc-300'
          ]"
          @click="selectEffect(option.value)"
        >
          <UIcon
            :name="getIcon(option.value)"
            class="w-4 h-4 shrink-0"
          />
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">{{ option.label }}</p>
            <p class="text-xs text-zinc-500 truncate">{{ option.description }}</p>
          </div>
          <UIcon
            v-if="currentEffect === option.value"
            name="i-heroicons-check"
            class="w-4 h-4 ml-auto text-violet-400 shrink-0"
          />
        </button>
      </div>
    </div>
  </ResponsivePopover>
</template>

<script setup lang="ts">
import type { BackgroundEffect } from '~/composables/useBackgroundEffect'

const { currentEffect, setEffect, backgroundOptions } = useBackgroundEffect()

const isOpen = ref(false)
const focusedIndex = ref(-1)
const panelRef = ref<HTMLDivElement | null>(null)

// Select effect and close on mobile
const selectEffect = (effect: BackgroundEffect) => {
  setEffect(effect)
  // Close after selection on mobile for better UX
  isOpen.value = false
}

// Reset focus index when popover opens and focus the panel
watch(isOpen, (open) => {
  if (open) {
    // Set focus to current effect
    const currentIndex = backgroundOptions.findIndex(o => o.value === currentEffect.value)
    focusedIndex.value = currentIndex >= 0 ? currentIndex : 0
    // Focus the panel after it renders
    nextTick(() => {
      panelRef.value?.focus()
    })
  } else {
    focusedIndex.value = -1
  }
})

const onKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = (focusedIndex.value + 1) % backgroundOptions.length
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = (focusedIndex.value - 1 + backgroundOptions.length) % backgroundOptions.length
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < backgroundOptions.length) {
        selectEffect(backgroundOptions[focusedIndex.value].value)
      }
      break
    case 'Escape':
      e.preventDefault()
      isOpen.value = false
      break
  }
}

const getIcon = (effect: BackgroundEffect): string => {
  const icons: Record<BackgroundEffect, string> = {
    'none': 'i-heroicons-x-mark',
    'particles': 'i-heroicons-sparkles',
    'gradient-orbs': 'i-heroicons-sun',
    'noise': 'i-heroicons-fire',
    'bokeh': 'i-heroicons-light-bulb',
    'constellation': 'i-heroicons-star',
    'vinyl': 'i-heroicons-circle-stack',
    'equalizer': 'i-heroicons-bars-3-bottom-left',
    'trip': 'i-heroicons-eye',
    'tunnel': 'i-heroicons-arrow-path-rounded-square',
  }
  return icons[effect] || 'i-heroicons-sparkles'
}
</script>
