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

      <!-- Alternative Contact -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-violet-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Email Us</h3>
          <p class="text-zinc-400 text-sm mb-3">For general inquiries</p>
          <a href="mailto:hello@indiestream.app" class="text-violet-400 hover:text-violet-300">
            hello@indiestream.app
          </a>
        </div>

        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-lifebuoy" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Artist Support</h3>
          <p class="text-zinc-400 text-sm mb-3">For artist-related questions</p>
          <a href="mailto:artists@indiestream.app" class="text-fuchsia-400 hover:text-fuchsia-300">
            artists@indiestream.app
          </a>
        </div>
      </div>

      <!-- FAQ Link -->
      <div class="text-center mt-12">
        <p class="text-zinc-400 mb-4">Looking for quick answers?</p>
        <UButton color="gray" variant="outline" to="/pricing#faq">
          View FAQ
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Contact | Indiestream',
  meta: [
    { name: 'description', content: 'Get in touch with the Indiestream team. We\'re here to help with any questions.' },
  ],
})

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const submitting = ref(false)
const submitted = ref(false)

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

  // Simulate form submission
  // In production, this would send to an API endpoint
  await new Promise(resolve => setTimeout(resolve, 1000))

  submitted.value = true
  submitting.value = false

  // Reset form
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''

  // Hide success message after 5 seconds
  setTimeout(() => {
    submitted.value = false
  }, 5000)
}
</script>
