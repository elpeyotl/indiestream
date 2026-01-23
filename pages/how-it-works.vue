<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">Where your money goes</h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        $9.99/month. 70% to artists. 15% to royalties. 15% platform. No pool. No mystery.
      </p>
    </div>

    <!-- For Listeners -->
    <div class="max-w-5xl mx-auto mb-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-100">For listeners</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
            1
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 ml-4">
            <h3 class="font-semibold text-zinc-100 mb-2">Pay $9.99/month</h3>
            <p class="text-zinc-400 text-sm">
              Unlimited streaming. Every artist on the platform. No ads. No tiers.
            </p>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
            2
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 ml-4">
            <h3 class="font-semibold text-zinc-100 mb-2">Listen to what you want</h3>
            <p class="text-zinc-400 text-sm">
              We track your listening time. Not to spy on you. To pay artists fairly.
            </p>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
            3
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 ml-4">
            <h3 class="font-semibold text-zinc-100 mb-2">See where it goes</h3>
            <p class="text-zinc-400 text-sm">
              Every month, we show you exactly which artists got your money. Down to the cent.
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Example -->
      <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <h3 class="font-semibold text-zinc-100 mb-6 text-center">Real example: Where your $9.99 goes</h3>
        <div class="max-w-md mx-auto space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
                <span class="text-teal-300 font-bold">A</span>
              </div>
              <div>
                <p class="text-zinc-100 font-medium">Band you love</p>
                <p class="text-zinc-500 text-sm">60% of your listening</p>
              </div>
            </div>
            <span class="text-teal-400 font-semibold">$4.19</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-fuchsia-500/30 flex items-center justify-center">
                <span class="text-fuchsia-300 font-bold">B</span>
              </div>
              <div>
                <p class="text-zinc-100 font-medium">New discovery</p>
                <p class="text-zinc-500 text-sm">30% of your listening</p>
              </div>
            </div>
            <span class="text-teal-400 font-semibold">$2.10</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-violet-500/30 flex items-center justify-center">
                <span class="text-violet-300 font-bold">C</span>
              </div>
              <div>
                <p class="text-zinc-100 font-medium">That one album</p>
                <p class="text-zinc-500 text-sm">10% of your listening</p>
              </div>
            </div>
            <span class="text-teal-400 font-semibold">$0.70</span>
          </div>
          <div class="h-px bg-zinc-700 my-4" />
          <div class="flex items-center justify-between text-zinc-400">
            <span>Royalties to PROs (songwriters)</span>
            <span>$1.50</span>
          </div>
          <div class="flex items-center justify-between text-zinc-400">
            <span>Platform costs (servers, bandwidth, team)</span>
            <span>$1.50</span>
          </div>
        </div>
      </div>
    </div>

    <!-- For Artists -->
    <div class="max-w-5xl mx-auto mb-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-microphone" class="w-5 h-5 text-fuchsia-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-100">For artists</h2>
      </div>

      <div class="grid md:grid-cols-4 gap-6 mb-12">
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-user-plus" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Sign up</h3>
          <p class="text-zinc-400 text-sm">
            Free. No credit card. No approval process.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Upload</h3>
          <p class="text-zinc-400 text-sm">
            Unlimited tracks. Unlimited albums. No fees.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">See everything</h3>
          <p class="text-zinc-400 text-sm">
            Who's listening. Where they are. What you earned.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-teal-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Get paid</h3>
          <p class="text-zinc-400 text-sm">
            Every month. Direct to your bank.
          </p>
        </div>
      </div>

      <!-- Artist Benefits -->
      <div class="bg-gradient-to-r from-fuchsia-900/30 to-violet-900/30 rounded-2xl p-8 border border-fuchsia-500/30">
        <h3 class="font-semibold text-zinc-100 mb-6 text-center">The fine print (there isn't much)</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-teal-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">70% to you</p>
              <p class="text-zinc-400 text-sm">From your fans. Not a pool. Directly proportional to listening time.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-teal-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">15% to royalties</p>
              <p class="text-zinc-400 text-sm">We pay PROs (ASCAP, BMI, GEMA, etc.) so songwriters get their cut.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-teal-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">You own everything</p>
              <p class="text-zinc-400 text-sm">Your music. Your rights. We're just the platform. Leave anytime.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-teal-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">No gatekeepers</p>
              <p class="text-zinc-400 text-sm">Upload. Publish. Done. Human moderation just keeps out spam.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="text-center">
      <h2 class="text-2xl font-bold text-zinc-100 mb-4">That's it. Really.</h2>
      <p class="text-zinc-400 mb-8">No tricks. No hidden fees. No VC investors to please.</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton color="violet" size="lg" to="/register">
          Start listening
        </UButton>
        <UButton color="fuchsia" variant="ghost" size="lg" to="/dashboard/artist/new">
          Upload music
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'How It Works | Fairtune',
  meta: [
    { name: 'description', content: '$9.99/month. 70% to artists. 15% to royalties. 15% platform costs. We show you every cent.' },
  ],
})
</script>
