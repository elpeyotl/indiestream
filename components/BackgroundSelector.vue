<template>
  <div @click.stop @mousedown.stop @touchstart.stop>
    <UPopover v-model:open="isOpen" mode="click" :popper="{ placement: 'bottom-start' }" :ui="{ container: 'z-[100]' }">
      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        icon="i-heroicons-sparkles"
        class="text-zinc-400 hover:text-violet-400"
      />

      <template #panel>
        <div
          ref="panelRef"
          class="p-3 w-64 bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl outline-none"
          tabindex="0"
          @keydown="onKeyDown"
        >
          <p class="text-xs font-medium text-zinc-400 mb-2">Background Effect</p>
          <div class="space-y-1">
            <button
              v-for="(option, index) in backgroundOptions"
              :key="option.value"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
              :class="[
                currentEffect === option.value
                  ? 'bg-violet-500/20 text-violet-400'
                  : focusedIndex === index
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'hover:bg-zinc-800 text-zinc-300'
              ]"
              @click="setEffect(option.value)"
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
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import type { BackgroundEffect } from '~/composables/useBackgroundEffect'

const { currentEffect, setEffect, backgroundOptions } = useBackgroundEffect()

const isOpen = ref(false)
const focusedIndex = ref(-1)
const panelRef = ref<HTMLDivElement | null>(null)

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
        setEffect(backgroundOptions[focusedIndex.value].value)
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
