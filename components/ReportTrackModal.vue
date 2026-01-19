<template>
  <UModal v-model="isOpen">
    <UCard class="bg-zinc-900 border-zinc-800">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-flag" class="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-zinc-100">Report Track</h3>
            <p class="text-sm text-zinc-400">{{ trackTitle }}</p>
          </div>
        </div>
      </template>

      <form @submit.prevent="submitReport" class="space-y-4">
        <!-- Reason -->
        <UFormGroup label="Reason for Report" required>
          <USelectMenu
            v-model="form.reason"
            :options="reasonOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Select a reason"
            size="lg"
          />
        </UFormGroup>

        <!-- Details -->
        <UFormGroup
          label="Details"
          :required="form.reason === 'copyright'"
          :hint="form.reason === 'copyright' ? 'Required for copyright claims' : 'Optional'"
        >
          <UTextarea
            v-model="form.details"
            :placeholder="detailsPlaceholder"
            :rows="4"
            size="lg"
          />
        </UFormGroup>

        <!-- Evidence URL (for copyright claims) -->
        <UFormGroup
          v-if="form.reason === 'copyright'"
          label="Evidence URL"
          hint="Link to the original work (Spotify, YouTube, etc.)"
        >
          <UInput
            v-model="form.evidenceUrl"
            placeholder="https://..."
            size="lg"
            type="url"
          />
        </UFormGroup>

        <!-- Email (for anonymous users) -->
        <UFormGroup
          v-if="!user"
          label="Your Email"
          hint="Optional - for follow-up if needed"
        >
          <UInput
            v-model="form.email"
            placeholder="your@email.com"
            size="lg"
            type="email"
          />
        </UFormGroup>

        <!-- Info box -->
        <div class="p-3 bg-zinc-800 rounded-lg">
          <p class="text-sm text-zinc-400">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4 inline mr-1" />
            Reports are reviewed by our moderation team. False reports may result in action against your account.
          </p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="isOpen = false">
            Cancel
          </UButton>
          <UButton
            color="red"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="submitReport"
          >
            Submit Report
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  trackId: string
  trackTitle: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'reported': []
}>()

const user = useSupabaseUser()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const form = reactive({
  reason: '' as string,
  details: '',
  evidenceUrl: '',
  email: '',
})

const submitting = ref(false)

const reasonOptions = [
  { label: 'Copyright Violation', value: 'copyright', description: 'This track infringes on copyrighted material' },
  { label: 'AI-Generated Content', value: 'ai_generated', description: 'This track appears to be AI-generated' },
  { label: 'Inappropriate Content', value: 'inappropriate', description: 'Hate speech, violence, or illegal content' },
  { label: 'Other', value: 'other', description: 'Other issue not listed above' },
]

const detailsPlaceholder = computed(() => {
  switch (form.reason) {
    case 'copyright':
      return 'Describe which copyrighted work is being infringed and how...'
    case 'ai_generated':
      return 'Explain why you believe this is AI-generated content...'
    case 'inappropriate':
      return 'Describe the inappropriate content...'
    default:
      return 'Provide additional details...'
  }
})

const canSubmit = computed(() => {
  if (!form.reason) return false
  if (form.reason === 'copyright' && (!form.details || form.details.trim().length < 10)) return false
  return true
})

const submitReport = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true

  try {
    await $fetch(`/api/tracks/${props.trackId}/report`, {
      method: 'POST',
      body: {
        reason: form.reason,
        details: form.details || undefined,
        evidence_url: form.evidenceUrl || undefined,
        reporter_email: form.email || undefined,
      },
    })

    emit('reported')
    isOpen.value = false
    resetForm()
  } catch (e: any) {
    toast.add({
      title: 'Failed to Submit',
      description: e.data?.message || 'Something went wrong. Please try again.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.reason = ''
  form.details = ''
  form.evidenceUrl = ''
  form.email = ''
}

// Reset form when modal opens
watch(isOpen, (value) => {
  if (value) {
    resetForm()
  }
})
</script>
