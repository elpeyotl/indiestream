<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-zinc-100 mb-4">Contact Us</h1>
        <p class="text-zinc-400">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <!-- Contact Form -->
      <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-12">
        <form @submit.prevent="submitForm" class="space-y-6">
          <UFormGroup label="Name">
            <UInput
              v-model="form.name"
              placeholder="Your name"
              size="lg"
              :disabled="submitting"
            />
          </UFormGroup>

          <UFormGroup label="Email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="your@email.com"
              size="lg"
              :disabled="submitting"
            />
          </UFormGroup>

          <UFormGroup label="Subject">
            <USelectMenu
              v-model="form.subject"
              :options="subjectOptions"
              placeholder="Select a topic"
              size="lg"
              :disabled="submitting"
            />
          </UFormGroup>

          <UFormGroup label="Message">
            <UTextarea
              v-model="form.message"
              placeholder="How can we help?"
              :rows="6"
              :disabled="submitting"
            />
          </UFormGroup>

          <UButton
            type="submit"
            color="violet"
            size="lg"
            block
            :loading="submitting"
            :disabled="!isFormValid"
          >
            Send Message
          </UButton>
        </form>

        <!-- Success Message -->
        <div v-if="submitted" class="mt-6 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
          <div class="flex items-center gap-3 text-green-400">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
            <div>
              <p class="font-medium">Message sent!</p>
              <p class="text-sm text-green-400/80">We'll get back to you within 24-48 hours.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Times -->
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-clock" class="w-6 h-6 text-violet-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Quick Response</h3>
          <p class="text-zinc-400 text-sm">We typically respond within 24-48 hours</p>
        </div>

        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-lifebuoy" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Artist Support</h3>
          <p class="text-zinc-400 text-sm">Select "Artist Support" in the form above for priority help</p>
        </div>

        <NuxtLink to="/bugs" class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center hover:border-zinc-700 transition-colors">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-bug-ant" class="w-6 h-6 text-red-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Report a Bug</h3>
          <p class="text-zinc-400 text-sm">Found something broken? Let us know</p>
        </NuxtLink>
      </div>

      <!-- FAQ Link -->
      <div class="text-center mt-12">
        <p class="text-zinc-400 mb-4">Looking for quick answers?</p>
        <UButton color="gray" variant="ghost" to="/pricing#faq">
          View FAQ
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Contact | Fairtune',
  meta: [
    { name: 'description', content: 'Get in touch with the Fairtune team. We\'re here to help with any questions.' },
  ],
})

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const toast = useToast()
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const subjectOptions = [
  'General Inquiry',
  'Account Help',
  'Artist Support',
  'Payment Question',
  'Technical Issue',
  'Partnership',
  'Press',
  'Other',
]

const isFormValid = computed(() => {
  return form.name && form.email && form.subject && form.message
})

const submitForm = async () => {
  if (!isFormValid.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      },
    })

    submitted.value = true

    // Reset form
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''

    // Hide success message after 5 seconds
    setTimeout(() => {
      submitted.value = false
    }, 5000)
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || 'Failed to send message. Please try again.'
    toast.add({
      title: 'Error',
      description: errorMessage.value,
      color: 'red',
    })
  } finally {
    submitting.value = false
  }
}
</script>
