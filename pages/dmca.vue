<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <div class="border-b-2 border-zinc-800 pb-6 mb-8">
        <h1 class="text-3xl font-black uppercase tracking-tighter text-white mb-2">DMCA POLICY</h1>
        <p class="text-zinc-500 font-mono text-sm">Digital Millennium Copyright Act Compliance</p>
      </div>

      <div class="space-y-8">
        <!-- Introduction -->
        <section class="bg-zinc-950 border-2 border-zinc-800 p-6">
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-4 border-b-2 border-zinc-800 pb-3">OUR COMMITMENT</h2>
          <p class="text-zinc-400 font-mono text-sm">
            Fairtune respects the intellectual property rights of others and expects our users to do the same.
            In accordance with the Digital Millennium Copyright Act of 1998 (DMCA), we will respond expeditiously
            to claims of copyright infringement committed using our service.
          </p>
        </section>

        <!-- DMCA Agent Info -->
        <section class="bg-zinc-950 border-2 border-zinc-800 p-6">
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-4 border-b-2 border-zinc-800 pb-3">DESIGNATED DMCA AGENT</h2>
          <p class="text-zinc-400 font-mono text-sm mb-4">
            Our designated agent for receiving notifications of claimed infringement is:
          </p>
          <div class="space-y-2 text-zinc-300 font-mono">
            <p class="font-bold">Fairtune Copyright Agent</p>
            <p>Email: <a href="mailto:dmca@fairtune.fm" class="text-fuchsia-500 hover:text-fuchsia-400">dmca@fairtune.fm</a></p>
          </div>
        </section>

        <!-- How to File -->
        <section class="bg-zinc-950 border-2 border-zinc-800 p-6">
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-4 border-b-2 border-zinc-800 pb-3">HOW TO FILE A TAKEDOWN NOTICE</h2>
          <p class="text-zinc-400 font-mono text-sm mb-4">
            If you believe your copyrighted work has been infringed on Fairtune, please provide our DMCA
            agent with the following information:
          </p>
          <ul class="list-disc list-inside text-zinc-400 font-mono text-sm space-y-2 ml-4 mb-6">
            <li>A physical or electronic signature of the copyright owner or authorized representative</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material on Fairtune that you claim is infringing, including the URL</li>
            <li>Your contact information (name, address, phone number, and email)</li>
            <li>A statement that you have a good faith belief that the use of the material is not authorized</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury,
              that you are authorized to act on behalf of the copyright owner</li>
          </ul>
        </section>

        <!-- Takedown Request Form -->
        <section class="bg-zinc-950 border-2 border-fuchsia-500/50 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-4 border-b-2 border-zinc-800 pb-3">SUBMIT A TAKEDOWN REQUEST</h2>

          <div v-if="submitted" class="p-6 border-2 border-green-500 bg-green-500/10">
            <div class="flex items-center gap-3 mb-4">
              <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500" />
              <h3 class="text-lg font-bold uppercase tracking-tight text-green-400">REQUEST SUBMITTED</h3>
            </div>
            <p class="text-zinc-300 font-mono text-sm mb-4">
              Thank you for submitting your DMCA takedown request. Our team will review it and respond
              within 24-48 hours.
            </p>
            <p class="text-zinc-500 font-mono text-sm">
              Reference ID: {{ submittedId }}
            </p>
          </div>

          <form v-else @submit.prevent="submitDmca" class="space-y-6">
            <!-- Claimant Information -->
            <div>
              <h3 class="text-lg font-bold uppercase tracking-tight text-white mb-4">YOUR INFORMATION</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Full Name *</label>
                  <input
                    v-model="form.claimant_name"
                    type="text"
                    placeholder="Your full legal name"
                    class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Email Address *</label>
                  <input
                    v-model="form.claimant_email"
                    type="email"
                    placeholder="your@email.com"
                    class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div class="mt-4">
                <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Mailing Address *</label>
                <textarea
                  v-model="form.claimant_address"
                  placeholder="Street address, City, State/Province, Country, Postal Code"
                  rows="2"
                  class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div class="mt-4">
                <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Phone Number <span class="text-zinc-500 font-normal">(Optional)</span></label>
                <input
                  v-model="form.claimant_phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div class="h-px bg-zinc-800" />

            <!-- Copyright Work -->
            <div>
              <h3 class="text-lg font-bold uppercase tracking-tight text-white mb-4">COPYRIGHTED WORK INFORMATION</h3>
              <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Description of Copyrighted Work *</label>
              <textarea
                v-model="form.copyrighted_work_description"
                placeholder="Describe the copyrighted work that has been infringed. Include song title, album name, artist name, and any registration numbers if available."
                rows="4"
                class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div class="h-px bg-zinc-800" />

            <!-- Infringing Content -->
            <div>
              <h3 class="text-lg font-bold uppercase tracking-tight text-white mb-4">INFRINGING CONTENT</h3>
              <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">URL of Infringing Content *</label>
              <input
                v-model="form.infringing_url"
                type="url"
                placeholder="https://fairtune.fm/artist/album"
                class="w-full px-4 py-3 bg-black border-2 text-white font-mono rounded-none focus:outline-none transition-colors"
                :class="urlError ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-fuchsia-500'"
              />
              <p v-if="urlError" class="text-red-400 font-mono text-sm mt-2">{{ urlError }}</p>
              <p v-else class="text-zinc-500 font-mono text-sm mt-2">The direct link to the content on Fairtune that you believe infringes your copyright</p>
            </div>

            <div class="h-px bg-zinc-800" />

            <!-- Statements -->
            <div>
              <h3 class="text-lg font-bold uppercase tracking-tight text-white mb-4">REQUIRED STATEMENTS</h3>
              <div class="space-y-4">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="form.good_faith_statement"
                    type="checkbox"
                    class="w-5 h-5 mt-0.5 border-2 border-zinc-800 bg-black text-fuchsia-500 focus:ring-fuchsia-500 rounded-none"
                  />
                  <span class="text-zinc-300 font-mono text-sm">
                    I have a good faith belief that the use of the material in the manner complained of is not
                    authorized by the copyright owner, its agent, or the law.
                  </span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="form.accuracy_statement"
                    type="checkbox"
                    class="w-5 h-5 mt-0.5 border-2 border-zinc-800 bg-black text-fuchsia-500 focus:ring-fuchsia-500 rounded-none"
                  />
                  <span class="text-zinc-300 font-mono text-sm">
                    I swear, under penalty of perjury, that the information in this notification is accurate
                    and that I am the copyright owner, or am authorized to act on behalf of the owner of an
                    exclusive right that is allegedly infringed.
                  </span>
                </label>
              </div>
            </div>

            <div class="h-px bg-zinc-800" />

            <!-- Signature -->
            <div>
              <h3 class="text-lg font-bold uppercase tracking-tight text-white mb-4">ELECTRONIC SIGNATURE</h3>
              <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Type your full legal name as your signature *</label>
              <input
                v-model="form.signature"
                type="text"
                placeholder="Your full legal name"
                class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              />
              <p class="text-zinc-500 font-mono text-sm mt-2">
                By typing your name above, you are providing an electronic signature in accordance with
                the Electronic Signatures in Global and National Commerce Act (E-Sign Act).
              </p>
            </div>

            <!-- Warning -->
            <div class="p-4 border-2 border-yellow-500 bg-yellow-500/10">
              <div class="flex gap-3">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-yellow-200 font-bold uppercase tracking-tight">IMPORTANT NOTICE</p>
                  <p class="text-yellow-200/70 font-mono text-sm mt-1">
                    Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that
                    material is infringing may be subject to liability. Please ensure all information provided
                    is accurate before submitting.
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
                :disabled="!canSubmit || submitting"
              >
                {{ submitting ? 'Submitting...' : 'Submit DMCA Notice' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Counter-Notification -->
        <section class="bg-zinc-950 border-2 border-zinc-800 p-6">
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-4 border-b-2 border-zinc-800 pb-3">COUNTER-NOTIFICATION</h2>
          <p class="text-zinc-400 font-mono text-sm mb-4">
            If you believe your content was wrongly removed due to a DMCA takedown notice, you may file
            a counter-notification. To file a counter-notification, please email
            <a href="mailto:dmca@fairtune.fm" class="text-fuchsia-500 hover:text-fuchsia-400">dmca@fairtune.fm</a>
            with the following information:
          </p>
          <ul class="list-disc list-inside text-zinc-400 font-mono text-sm space-y-2 ml-4">
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief that the material
              was removed as a result of mistake or misidentification</li>
            <li>Your name, address, and phone number</li>
            <li>A statement that you consent to the jurisdiction of Federal District Court</li>
            <li>A statement that you will accept service of process from the person who filed the
              original notification</li>
          </ul>
        </section>

        <!-- Repeat Infringers -->
        <section class="bg-zinc-950 border-2 border-zinc-800 p-6">
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-4 border-b-2 border-zinc-800 pb-3">REPEAT INFRINGER POLICY</h2>
          <p class="text-zinc-400 font-mono text-sm">
            In accordance with the DMCA, Fairtune has adopted a policy of terminating, in appropriate
            circumstances, users who are deemed to be repeat infringers. We may also, at our discretion,
            limit access to the service and/or terminate the accounts of any users who infringe any
            intellectual property rights of others, whether or not there is any repeat infringement.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist'
})

useHead({
  title: 'DMCA Policy | Fairtune',
  meta: [
    { name: 'description', content: 'Fairtune DMCA Policy and takedown request form.' },
  ],
})

const toast = useToast()

const form = reactive({
  claimant_name: '',
  claimant_email: '',
  claimant_address: '',
  claimant_phone: '',
  copyrighted_work_description: '',
  infringing_url: '',
  good_faith_statement: false,
  accuracy_statement: false,
  signature: '',
})

const submitting = ref(false)
const submitted = ref(false)
const submittedId = ref('')

// Validate that URL is a Fairtune content URL (artist or album page)
const isFairtuneContentUrl = (url: string): boolean => {
  if (!url.trim()) return false
  try {
    const parsed = new URL(url)
    const validHosts = ['fairtune.fm', 'www.fairtune.fm', 'dev.fairtune.fm']
    // Also allow localhost for development
    if (import.meta.dev) {
      validHosts.push('localhost', '127.0.0.1')
    }
    const isValidHost = validHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))
    if (!isValidHost) return false

    // Must have a path that points to content (artist or album)
    // Valid: /artist-slug, /artist-slug/album-slug
    // Invalid: /, /about, /contact, /dmca, /terms, /admin, etc.
    const pathSegments = parsed.pathname.split('/').filter(Boolean)
    if (pathSegments.length === 0) return false

    // Reject known non-content routes
    const staticRoutes = [
      'about', 'admin', 'artists', 'auth', 'bugs', 'changelog', 'charts',
      'coming-soon', 'confirm', 'contact', 'dashboard', 'discover', 'dmca',
      'docs', 'for-artists', 'genres', 'impact', 'index', 'library', 'login',
      'playlist', 'pricing', 'privacy', 'register', 'settings', 'subscribe',
      'terms', 'user', 'api'
    ]
    const firstSegment = pathSegments[0].toLowerCase()
    if (staticRoutes.includes(firstSegment)) return false

    return true
  } catch {
    return false
  }
}

const urlError = computed(() => {
  const url = form.infringing_url.trim()
  if (!url) return undefined
  if (!isFairtuneContentUrl(url)) {
    return 'Please enter a valid Fairtune artist or album URL (e.g., https://fairtune.fm/artist-name or https://fairtune.fm/artist-name/album-name)'
  }
  return undefined
})

const canSubmit = computed(() => {
  return (
    form.claimant_name.trim() &&
    form.claimant_email.trim() &&
    form.claimant_address.trim() &&
    form.copyrighted_work_description.trim() &&
    form.infringing_url.trim() &&
    isFairtuneContentUrl(form.infringing_url) &&
    form.good_faith_statement &&
    form.accuracy_statement &&
    form.signature.trim()
  )
})

const submitDmca = async () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true

  try {
    const result = await $fetch<{ success: boolean; requestId: string }>('/api/dmca/submit', {
      method: 'POST',
      body: form,
    })

    submittedId.value = result.requestId
    submitted.value = true

    toast.add({
      title: 'DMCA Notice Submitted',
      description: 'We will review your request and respond within 24-48 hours.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    toast.add({
      title: 'Submission Failed',
      description: e.data?.message || 'Something went wrong. Please try again.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    submitting.value = false
  }
}
</script>
