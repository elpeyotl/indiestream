<template>
  <div>
    <!-- Tab Buttons -->
    <div :class="containerClass">
      <div class="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.slot || tab.key || index"
          @click="handleTabChange(index)"
          :title="tab.label"
          :class="[
            'relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-bold uppercase tracking-tight whitespace-nowrap transition-all duration-200 active:scale-95',
            modelValue === index
              ? 'bg-fuchsia-600 text-white shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)]'
              : 'bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:border-fuchsia-500 hover:text-fuchsia-500'
          ]"
        >
          <UIcon v-if="tab.icon" :name="tab.icon" class="w-4 h-4" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span
            v-if="tab.badge"
            :class="[
              'flex-shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold min-w-[1.25rem]',
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
        <!-- Use v-if with KeepAlive for lazy loading: only mount when first visited, then cache -->
        <KeepAlive>
          <div v-if="visitedTabs.has(index) && modelValue === index">
            <slot :name="tab.slot || tab.key || `tab-${index}`" :item="tab" :index="index" />
          </div>
        </KeepAlive>
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

// Track visited tabs for lazy loading - only mount a tab when first visited
const visitedTabs = ref(new Set<number>([props.modelValue]))

// Mark current tab as visited when it changes
watch(() => props.modelValue, (newVal) => {
  visitedTabs.value.add(newVal)
}, { immediate: true })

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
