<template>
  <div>
    <!-- Hero -->
    <div class="bg-gradient-to-b from-fuchsia-900/30 to-zinc-950 py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
          Your music deserves
          <span class="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            better
          </span>
        </h1>
        <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          Keep 70% of your streaming revenue. Get paid directly by your fans. No label required.
        </p>
        <UButton color="fuchsia" size="xl" to="/dashboard/artist/new">
          Create Your Artist Profile
        </UButton>
      </div>
    </div>

    <div class="container mx-auto px-4 py-16">
      <!-- Stats -->
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
        <div class="text-center">
          <div class="text-5xl font-bold text-fuchsia-400 mb-2">70%</div>
          <p class="text-zinc-400">Direct to you</p>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-violet-400 mb-2">$0</div>
          <p class="text-zinc-400">Upload fees</p>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-green-400 mb-2">Monthly</div>
          <p class="text-zinc-400">Payouts</p>
        </div>
      </div>

      <!-- The Problem -->
      <div class="max-w-4xl mx-auto mb-20">
        <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">The Problem With Traditional Streaming</h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div class="flex items-center gap-2 text-red-400 mb-4">
              <UIcon name="i-heroicons-x-circle" class="w-6 h-6" />
              <span class="font-semibold">Traditional Platforms</span>
            </div>
            <ul class="space-y-3 text-zinc-400 text-sm">
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                All revenue goes into a pool
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Major labels take the biggest share
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                ~$0.003 per stream
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Opaque payout calculations
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Free streaming loopholes = no royalties
              </li>
            </ul>
          </div>
          <div class="bg-gradient-to-br from-fuchsia-900/30 to-violet-900/30 rounded-xl p-6 border border-fuchsia-500/30">
            <div class="flex items-center gap-2 text-green-400 mb-4">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
              <span class="font-semibold">Fairtune</span>
            </div>
            <ul class="space-y-3 text-zinc-300 text-sm">
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Revenue goes directly to you
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Independent artists only
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                ~$0.007 per stream (or more)
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Transparent earnings dashboard
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Every stream generates royalties
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="max-w-5xl mx-auto mb-20">
        <h2 class="text-2xl font-bold text-zinc-100 text-center mb-12">Get Started in Minutes</h2>
        <div class="grid md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-fuchsia-400">1</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Create Account</h3>
            <p class="text-zinc-400 text-sm">Sign up for free in seconds</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-fuchsia-400">2</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Set Up Profile</h3>
            <p class="text-zinc-400 text-sm">Add your bio, photo, and links</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-fuchsia-400">3</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Upload Music</h3>
            <p class="text-zinc-400 text-sm">Drag and drop your tracks</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-green-400">4</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Start Earning</h3>
            <p class="text-zinc-400 text-sm">Get paid every month</p>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="max-w-5xl mx-auto mb-20">
        <h2 class="text-2xl font-bold text-zinc-100 text-center mb-12">Everything You Need</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-fuchsia-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Unlimited Uploads</h3>
            <p class="text-zinc-400 text-sm">
              Upload as many albums and tracks as you want. No limits, no extra fees.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-chart-bar-square" class="w-8 h-8 text-fuchsia-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Real-Time Analytics</h3>
            <p class="text-zinc-400 text-sm">
              See exactly who's listening, where they're from, and how much you're earning.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-fuchsia-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Fan Insights</h3>
            <p class="text-zinc-400 text-sm">
              Understand your audience and build a direct connection with your fans.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-green-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Fast Payouts</h3>
            <p class="text-zinc-400 text-sm">
              Get paid on the 15th of every month. Direct deposit or PayPal.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-check-badge" class="w-8 h-8 text-violet-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Verification</h3>
            <p class="text-zinc-400 text-sm">
              Get verified to stand out and build trust with your audience.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 text-violet-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Custom Profile</h3>
            <p class="text-zinc-400 text-sm">
              Customize your artist page with your branding and colors.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center bg-gradient-to-r from-fuchsia-900/30 to-violet-900/30 rounded-2xl p-12 border border-fuchsia-500/30 max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-zinc-100 mb-4">Ready to Share Your Music?</h2>
        <p class="text-zinc-400 mb-8">
          Join Fairtune today and start earning what you deserve.
        </p>
        <UButton color="fuchsia" size="xl" to="/dashboard/artist/new">
          Create Your Artist Profile
        </UButton>
        <p class="text-zinc-500 text-sm mt-4">Free to join. No credit card required.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'For Artists | Fairtune',
  meta: [
    { name: 'description', content: 'Keep 70% of your streaming revenue on Fairtune. Upload your music for free and get paid directly by your fans.' },
  ],
})
</script>
