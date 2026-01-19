<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">DMCA Policy</h1>
      <p class="text-zinc-500 mb-8">Digital Millennium Copyright Act Compliance</p>

      <div class="prose prose-invert prose-zinc max-w-none space-y-8">
        <!-- Introduction -->
        <section class="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">Our Commitment to Copyright Protection</h2>
          <p class="text-zinc-400">
            Fairstream respects the intellectual property rights of others and expects our users to do the same.
            In accordance with the Digital Millennium Copyright Act of 1998 (DMCA), we will respond expeditiously
            to claims of copyright infringement committed using our service.
          </p>
        </section>

        <!-- DMCA Agent Info -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">Designated DMCA Agent</h2>
          <div class="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <p class="text-zinc-400 mb-4">
              Our designated agent for receiving notifications of claimed infringement is:
            </p>
            <div class="space-y-2 text-zinc-300">
              <p><strong>Fairstream Copyright Agent</strong></p>
              <p>Email: <a href="mailto:dmca@fairstream.fm" class="text-violet-400 hover:text-violet-300">dmca@fairstream.fm</a></p>
            </div>
          </div>
        </section>

        <!-- How to File -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">How to File a DMCA Takedown Notice</h2>
          <p class="text-zinc-400 mb-4">
            If you believe your copyrighted work has been infringed on Fairstream, please provide our DMCA
            agent with the following information:
          </p>
          <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-6">
            <li>A physical or electronic signature of the copyright owner or authorized representative</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material on Fairstream that you claim is infringing, including the URL</li>
            <li>Your contact information (name, address, phone number, and email)</li>
            <li>A statement that you have a good faith belief that the use of the material is not authorized</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury,
              that you are authorized to act on behalf of the copyright owner</li>
          </ul>
        </section>

        <!-- Takedown Request Form -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">Submit a Takedown Request</h2>

          <div v-if="submitted" class="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div class="flex items-center gap-3 mb-4">
              <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500" />
              <h3 class="text-lg font-semibold text-green-400">Request Submitted</h3>
            </div>
            <p class="text-zinc-300 mb-4">
              Thank you for submitting your DMCA takedown request. Our team will review it and respond
              within 24-48 hours.
            </p>
            <p class="text-zinc-500 text-sm">
              Reference ID: {{ submittedId }}
            </p>
          </div>

          <form v-else @submit.prevent="submitDmca" class="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-6">
            <!-- Claimant Information -->
            <div>
              <h3 class="text-lg font-semibold text-zinc-100 mb-4">Your Information</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <UFormGroup label="Full Name" required>
                  <UInput
                    v-model="form.claimant_name"
                    placeholder="Your full legal name"
                    size="lg"
                  />
                </UFormGroup>
                <UFormGroup label="Email Address" required>
                  <UInput
                    v-model="form.claimant_email"
                    type="email"
                    placeholder="your@email.com"
                    size="lg"
                  />
                </UFormGroup>
              </div>
              <UFormGroup label="Mailing Address" required class="mt-4">
                <UTextarea
                  v-model="form.claimant_address"
                  placeholder="Street address, City, State/Province, Country, Postal Code"
                  :rows="2"
                  size="lg"
                />
              </UFormGroup>
              <UFormGroup label="Phone Number" hint="Optional" class="mt-4">
                <UInput
                  v-model="form.claimant_phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  size="lg"
                />
              </UFormGroup>
            </div>

            <UDivider />

            <!-- Copyright Work -->
            <div>
              <h3 class="text-lg font-semibold text-zinc-100 mb-4">Copyrighted Work Information</h3>
              <UFormGroup label="Description of Copyrighted Work" required>
                <UTextarea
                  v-model="form.copyrighted_work_description"
                  placeholder="Describe the copyrighted work that has been infringed. Include song title, album name, artist name, and any registration numbers if available."
                  :rows="4"
                  size="lg"
                />
              </UFormGroup>
            </div>

            <UDivider />

            <!-- Infringing Content -->
            <div>
              <h3 class="text-lg font-semibold text-zinc-100 mb-4">Infringing Content</h3>
              <UFormGroup label="URL of Infringing Content" required>
                <UInput
                  v-model="form.infringing_url"
                  type="url"
                  placeholder="https://fairstream.fm/artist/album"
                  size="lg"
                />
                <template #hint>
                  The direct link to the content on Fairstream that you believe infringes your copyright
                </template>
              </UFormGroup>
            </div>

            <UDivider />

            <!-- Statements -->
            <div>
              <h3 class="text-lg font-semibold text-zinc-100 mb-4">Required Statements</h3>
              <div class="space-y-4">
                <UCheckbox
                  v-model="form.good_faith_statement"
                >
                  <template #label>
                    <span class="text-zinc-300">
                      I have a good faith belief that the use of the material in the manner complained of is not
                      authorized by the copyright owner, its agent, or the law.
                    </span>
                  </template>
                </UCheckbox>
                <UCheckbox
                  v-model="form.accuracy_statement"
                >
                  <template #label>
                    <span class="text-zinc-300">
                      I swear, under penalty of perjury, that the information in this notification is accurate
                      and that I am the copyright owner, or am authorized to act on behalf of the owner of an
                      exclusive right that is allegedly infringed.
                    </span>
                  </template>
                </UCheckbox>
              </div>
            </div>

            <UDivider />

            <!-- Signature -->
            <div>
              <h3 class="text-lg font-semibold text-zinc-100 mb-4">Electronic Signature</h3>
              <UFormGroup label="Type your full legal name as your signature" required>
                <UInput
                  v-model="form.signature"
                  placeholder="Your full legal name"
                  size="lg"
                />
              </UFormGroup>
              <p class="text-sm text-zinc-500 mt-2">
                By typing your name above, you are providing an electronic signature in accordance with
                the Electronic Signatures in Global and National Commerce Act (E-Sign Act).
              </p>
            </div>

            <!-- Warning -->
            <div class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div class="flex gap-3">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-yellow-200 font-medium">Important Notice</p>
                  <p class="text-yellow-200/70 text-sm mt-1">
                    Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that
                    material is infringing may be subject to liability. Please ensure all information provided
                    is accurate before submitting.
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="flex justify-end">
              <UButton
                type="submit"
                color="violet"
                size="lg"
                :loading="submitting"
                :disabled="!canSubmit"
              >
                Submit DMCA Notice
              </UButton>
            </div>
          </form>
        </section>

        <!-- Counter-Notification -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">Counter-Notification</h2>
          <div class="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <p class="text-zinc-400 mb-4">
              If you believe your content was wrongly removed due to a DMCA takedown notice, you may file
              a counter-notification. To file a counter-notification, please email
              <a href="mailto:dmca@fairstream.fm" class="text-violet-400 hover:text-violet-300">dmca@fairstream.fm</a>
              with the following information:
            </p>
            <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li>Your physical or electronic signature</li>
              <li>Identification of the material that was removed and its location before removal</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the material
                was removed as a result of mistake or misidentification</li>
              <li>Your name, address, and phone number</li>
              <li>A statement that you consent to the jurisdiction of Federal District Court</li>
              <li>A statement that you will accept service of process from the person who filed the
                original notification</li>
            </ul>
          </div>
        </section>

        <!-- Repeat Infringers -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">Repeat Infringer Policy</h2>
          <div class="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <p class="text-zinc-400">
              In accordance with the DMCA, Fairstream has adopted a policy of terminating, in appropriate
              circumstances, users who are deemed to be repeat infringers. We may also, at our discretion,
              limit access to the service and/or terminate the accounts of any users who infringe any
              intellectual property rights of others, whether or not there is any repeat infringement.
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'DMCA Policy | Fairstream',
  meta: [
    { name: 'description', content: 'Fairstream DMCA Policy and takedown request form.' },
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

const canSubmit = computed(() => {
  return (
    form.claimant_name.trim() &&
    form.claimant_email.trim() &&
    form.claimant_address.trim() &&
    form.copyrighted_work_description.trim() &&
    form.infringing_url.trim() &&
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
