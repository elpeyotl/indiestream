<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <div class="text-center py-8">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-check" class="w-10 h-10 text-green-500" />
      </div>
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">Upload Complete!</h2>
      <p class="text-zinc-400 mb-8">Your release "{{ albumTitle }}" is now live.</p>

      <div class="flex justify-center gap-4">
        <UButton color="violet" :to="viewUrl">
          View Release
        </UButton>
        <UButton color="gray" variant="outline" @click="$emit('reset')">
          Upload Another
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  albumTitle: string
  viewUrl: string
}>()

defineEmits<{
  reset: []
}>()
</script>
