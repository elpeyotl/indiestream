<template>
  <UButton color="violet" size="lg" :loading="loading" @click="$emit('click')">
    <UIcon v-if="!loading" name="i-heroicons-play" class="w-5 h-5 mr-1" />
    Play All
  </UButton>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
