<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <div class="text-center py-8">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-check" class="w-10 h-10 text-green-500" />
      </div>
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">{{ moderationEnabled ? 'Upload Complete!' : 'Release Published!' }}</h2>
      <p class="text-zinc-400 mb-4">
        {{ moderationEnabled
          ? `Your release "${albumTitle}" has been submitted.`
          : `Your release "${albumTitle}" is now live.`
        }}
      </p>

      <!-- Moderation Notice (only when moderation is enabled) -->
      <div v-if="moderationEnabled" class="max-w-md mx-auto mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-amber-400">Pending Review</p>
            <p class="text-sm text-zinc-400 mt-1">
              Your release will be reviewed by our team before going live. This usually takes 24-48 hours.
              You'll receive a notification once it's approved.
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-center gap-4">
        <UButton color="violet" :to="viewUrl">
          {{ moderationEnabled ? 'Preview Release' : 'View Release' }}
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
  moderationEnabled: boolean
}>()

defineEmits<{
  reset: []
}>()
</script>
