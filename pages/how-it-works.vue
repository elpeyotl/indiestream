<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">How Fairtune Works</h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        A fairer way to stream music. Your subscription supports the artists you actually listen to.
      </p>
    </div>

    <!-- For Listeners -->
    <div class="max-w-5xl mx-auto mb-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-100">For Listeners</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
            1
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 ml-4">
            <h3 class="font-semibold text-zinc-100 mb-2">Subscribe</h3>
            <p class="text-zinc-400 text-sm">
              Sign up for $9.99/month and get unlimited access to all music on the platform.
            </p>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
            2
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 ml-4">
            <h3 class="font-semibold text-zinc-100 mb-2">Listen</h3>
            <p class="text-zinc-400 text-sm">
              Stream as much as you want. Discover new artists or dive deep into your favorites.
            </p>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
            3
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 ml-4">
            <h3 class="font-semibold text-zinc-100 mb-2">Support</h3>
            <p class="text-zinc-400 text-sm">
              Your subscription is divided among the artists you listen to. The more you listen, the more they earn.
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Example -->
      <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <h3 class="font-semibold text-zinc-100 mb-6 text-center">Example: Where Your $9.99 Goes</h3>
        <div class="max-w-md mx-auto space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-violet-500/30 flex items-center justify-center">
                <span class="text-violet-300 font-bold">A</span>
              </div>
              <div>
                <p class="text-zinc-100 font-medium">Artist A</p>
                <p class="text-zinc-500 text-sm">60% of your listening</p>
              </div>
            </div>
            <span class="text-green-400 font-semibold">$5.09</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-fuchsia-500/30 flex items-center justify-center">
                <span class="text-fuchsia-300 font-bold">B</span>
              </div>
              <div>
                <p class="text-zinc-100 font-medium">Artist B</p>
                <p class="text-zinc-500 text-sm">30% of your listening</p>
              </div>
            </div>
            <span class="text-green-400 font-semibold">$2.55</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/30 flex items-center justify-center">
                <span class="text-cyan-300 font-bold">C</span>
              </div>
              <div>
                <p class="text-zinc-100 font-medium">Artist C</p>
                <p class="text-zinc-500 text-sm">10% of your listening</p>
              </div>
            </div>
            <span class="text-green-400 font-semibold">$0.85</span>
          </div>
          <div class="h-px bg-zinc-700 my-4" />
          <div class="flex items-center justify-between text-zinc-400">
            <span>Platform fee (15%)</span>
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
        <h2 class="text-2xl font-bold text-zinc-100">For Artists</h2>
      </div>

      <div class="grid md:grid-cols-4 gap-6 mb-12">
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-user-plus" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Create Profile</h3>
          <p class="text-zinc-400 text-sm">
            Set up your artist page with bio, photos, and links.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Upload Music</h3>
          <p class="text-zinc-400 text-sm">
            Upload unlimited tracks and albums for free.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Track Stats</h3>
          <p class="text-zinc-400 text-sm">
            See who's listening and how much you're earning.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-green-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">Get Paid</h3>
          <p class="text-zinc-400 text-sm">
            Monthly payouts directly to your bank account.
          </p>
        </div>
      </div>

      <!-- Artist Benefits -->
      <div class="bg-gradient-to-r from-fuchsia-900/30 to-violet-900/30 rounded-2xl p-8 border border-fuchsia-500/30">
        <h3 class="font-semibold text-zinc-100 mb-6 text-center">Why Artists Love Fairtune</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">Keep 70% of revenue</p>
              <p class="text-zinc-400 text-sm">Plus 15% goes to royalty societies on your behalf</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">Direct fan support</p>
              <p class="text-zinc-400 text-sm">Your fans' money goes to you, not a pool</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">No gatekeepers</p>
              <p class="text-zinc-400 text-sm">Upload and publish instantly</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-400 mt-0.5" />
            <div>
              <p class="text-zinc-100 font-medium">Keep your rights</p>
              <p class="text-zinc-400 text-sm">You own your music, always</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="text-center">
      <h2 class="text-2xl font-bold text-zinc-100 mb-4">Ready to Get Started?</h2>
      <p class="text-zinc-400 mb-8">Join thousands of artists and listeners on Fairtune.</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton color="violet" size="lg" to="/register">
          Start Listening
        </UButton>
        <UButton color="fuchsia" variant="outline" size="lg" to="/dashboard/artist/new">
          Upload Your Music
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'How It Works | Fairtune',
  meta: [
    { name: 'description', content: 'Learn how Fairtune works for listeners and artists. Fair streaming where your subscription supports the artists you love.' },
  ],
})
</script>
