<template>
  <UButton color="violet" size="lg" :loading="loading" @click="$emit('click')">
    <UIcon v-if="!loading" :name="playing ? 'i-heroicons-pause-solid' : 'i-heroicons-play'" class="w-5 h-5 mr-1" />
    {{ playing ? 'Pause' : 'Play All' }}
  </UButton>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean
  playing?: boolean
}>(), {
  playing: false,
})

defineEmits<{
  click: []
}>()
</script>
