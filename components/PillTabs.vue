<template>
  <div>
    <!-- Tab Buttons -->
    <div :class="containerClass">
      <div class="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.slot || tab.key || index"
          @click="handleTabChange(index)"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start active:scale-95',
            modelValue === index
              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
          ]"
        >
          <UIcon v-if="tab.icon" :name="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge"
            :class="[
              'ml-1 flex-shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full min-w-[1.25rem]',
              modelValue === index
                ? 'bg-white/20 text-white'
                : 'bg-red-500 text-white'
            ]"
          >
            {{ tab.badge > 99 ? '99+' : tab.badge }}
          </span>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mt-6">
      <template v-for="(tab, index) in tabs" :key="tab.slot || tab.key || index">
        <div v-show="modelValue === index">
          <slot :name="tab.slot || tab.key || `tab-${index}`" :item="tab" :index="index" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  label: string
  icon?: string
  slot?: string
  key?: string
  badge?: number
}

const props = withDefaults(defineProps<{
  tabs: Tab[]
  modelValue: number
  sticky?: boolean
  stickyTop?: string
}>(), {
  sticky: false,
  stickyTop: 'top-[73px]',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const haptics = useHaptics()

const containerClass = computed(() => {
  if (props.sticky) {
    return `sticky ${props.stickyTop} z-40 -mx-4 px-4 py-3`
  }
  return ''
})

const handleTabChange = (index: number) => {
  if (props.modelValue !== index) {
    haptics.light()
    emit('update:modelValue', index)
  }
}
</script>
