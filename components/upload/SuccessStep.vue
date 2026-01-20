<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <div class="text-center py-8">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-check" class="w-10 h-10 text-green-500" />
      </div>
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">{{ successTitle }}</h2>
      <p class="text-zinc-400 mb-4">
        {{ successMessage }}
      </p>

      <!-- Moderation Notice (only when moderation is enabled and not edit mode) -->
      <div v-if="moderationEnabled && !isEditMode" class="max-w-md mx-auto mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
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
          View Release
        </UButton>
        <UButton v-if="!isEditMode" color="gray" variant="outline" @click="$emit('reset')">
          Upload Another
        </UButton>
        <UButton v-else color="gray" variant="outline" to="/dashboard">
          Back to Dashboard
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  albumTitle: string
  viewUrl: string
  moderationEnabled: boolean
  isEditMode?: boolean
}>()

defineEmits<{
  reset: []
}>()

const successTitle = computed(() => {
  if (props.isEditMode) return 'Changes Saved!'
  return props.moderationEnabled ? 'Upload Complete!' : 'Release Published!'
})

const successMessage = computed(() => {
  if (props.isEditMode) return `Your release "${props.albumTitle}" has been updated.`
  return props.moderationEnabled
    ? `Your release "${props.albumTitle}" has been submitted.`
    : `Your release "${props.albumTitle}" is now live.`
})
</script>
