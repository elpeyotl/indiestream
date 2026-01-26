<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12 border-b-2 border-zinc-800 pb-8">
        <h1 class="text-3xl font-black uppercase tracking-tighter text-white mb-4">CONTACT US</h1>
        <p class="text-zinc-400 font-mono text-sm">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <!-- Contact Form -->
      <div class="bg-zinc-950 border-2 border-zinc-800 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] mb-12">
        <form @submit.prevent="submitForm" class="space-y-6">
          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Your name"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              :disabled="submitting"
            />
          </div>

          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="your@email.com"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              :disabled="submitting"
            />
          </div>

          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Subject</label>
            <select
              v-model="form.subject"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors appearance-none cursor-pointer"
              :disabled="submitting"
            >
              <option value="" disabled>Select a topic</option>
              <option v-for="option in subjectOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Message</label>
            <textarea
              v-model="form.message"
              placeholder="How can we help?"
              rows="6"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors resize-none"
              :disabled="submitting"
            />
          </div>

          <button
            type="submit"
            class="w-full px-4 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
            :disabled="!isFormValid || submitting"
          >
            {{ submitting ? 'Sending...' : 'Send Message' }}
          </button>
        </form>

        <!-- Success Message -->
        <div v-if="submitted" class="mt-6 p-4 border-2 border-green-500 bg-green-500/10">
          <div class="flex items-center gap-3 text-green-400">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
            <div>
              <p class="font-bold uppercase tracking-tight">Message sent!</p>
              <p class="text-sm font-mono text-green-400/80">We'll get back to you within 24-48 hours.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Times -->
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <UIcon name="i-heroicons-clock" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">QUICK RESPONSE</h3>
          <p class="text-zinc-400 font-mono text-sm">We typically respond within 24-48 hours</p>
        </div>

        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <UIcon name="i-heroicons-lifebuoy" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">ARTIST SUPPORT</h3>
          <p class="text-zinc-400 font-mono text-sm">Select "Artist Support" in the form above for priority help</p>
        </div>

        <NuxtLink to="/bugs" class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:border-fuchsia-500 transition-colors">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-red-500 flex items-center justify-center">
            <UIcon name="i-heroicons-bug-ant" class="w-6 h-6 text-red-400" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">REPORT A BUG</h3>
          <p class="text-zinc-400 font-mono text-sm">Found something broken? Let us know</p>
        </NuxtLink>
      </div>

      <!-- FAQ Link -->
      <div class="text-center mt-12 py-8 border-t-2 border-zinc-800">
        <p class="text-zinc-400 font-mono text-sm mb-4">Looking for quick answers?</p>
        <NuxtLink
          to="/pricing#faq"
          class="inline-block px-6 py-3 border-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight rounded-none hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors"
        >
          View FAQ
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist'
})

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
