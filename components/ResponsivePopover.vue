<template>
  <!-- Desktop: UPopover -->
  <UPopover
    v-if="!isMobile"
    v-model:open="isOpen"
    mode="click"
    :popper="{ placement }"
    :ui="{ container: 'z-[100]' }"
  >
    <slot name="trigger" />
    <template #panel>
      <div :class="[width, 'bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl']">
        <slot />
      </div>
    </template>
  </UPopover>

  <!-- Mobile: Bottom Sheet -->
  <template v-else>
    <div @click="isOpen = true">
      <slot name="trigger" />
    </div>

    <Teleport to="body">
      <!-- Backdrop -->
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          @click="isOpen = false"
        />
      </Transition>

      <!-- Sheet -->
      <Transition name="slide-up">
        <div
          v-if="isOpen"
          class="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl border-t border-zinc-800"
        >
          <!-- Drag Handle -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 bg-zinc-700 rounded-full" />
          </div>

          <!-- Header with title and close -->
          <div
            v-if="title"
            class="flex items-center justify-between px-4 pb-3 border-b border-zinc-800"
          >
            <h3 class="font-semibold text-zinc-100">{{ title }}</h3>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="sm"
              @click="isOpen = false"
            />
          </div>

          <!-- Content -->
          <div class="max-h-[70vh] overflow-y-auto overscroll-contain">
            <slot />
          </div>

          <!-- Safe area padding -->
          <div class="h-safe" />
        </div>
      </Transition>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    placement?: 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top'
    width?: string
  }>(),
  {
    placement: 'bottom-start',
    width: 'w-64',
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})
</script>

<style scoped>
.h-safe {
  height: max(env(safe-area-inset-bottom, 16px), 16px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
