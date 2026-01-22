<template>
  <div>
    <!-- Hero -->
    <div class="bg-gradient-to-b from-fuchsia-900/30 to-zinc-950 py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
          Keep
          <span class="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            70%
          </span>
        </h1>
        <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          Your fans pay. You get paid. No pool. No mystery math. No label required.
        </p>
        <UButton color="fuchsia" size="xl" to="/dashboard/artist/new">
          Upload Your Music
        </UButton>
      </div>
    </div>

    <div class="container mx-auto px-4 py-16">
      <!-- Stats -->
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
        <div class="text-center">
          <div class="text-5xl font-bold text-teal-400 mb-2">70%</div>
          <p class="text-zinc-400">Direct to you</p>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-violet-400 mb-2">15%</div>
          <p class="text-zinc-400">To royalties (PROs)</p>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-fuchsia-400 mb-2">15%</div>
          <p class="text-zinc-400">Platform costs</p>
        </div>
      </div>

      <!-- The Problem -->
      <div class="max-w-4xl mx-auto mb-20">
        <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">You know the deal</h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div class="flex items-center gap-2 text-red-400 mb-4">
              <UIcon name="i-heroicons-x-circle" class="w-6 h-6" />
              <span class="font-semibold">Big streaming</span>
            </div>
            <ul class="space-y-3 text-zinc-400 text-sm">
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Your fans' money goes into a pool
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Drake gets paid from your fans
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                ~$0.003 per stream (if you're lucky)
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                No idea how payouts are calculated
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Algorithms decide who gets heard
              </li>
            </ul>
          </div>
          <div class="bg-gradient-to-br from-fuchsia-900/30 to-violet-900/30 rounded-xl p-6 border border-fuchsia-500/30">
            <div class="flex items-center gap-2 text-teal-400 mb-4">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
              <span class="font-semibold">Fairtune</span>
            </div>
            <ul class="space-y-3 text-zinc-300 text-sm">
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                Your fans' money goes to you
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                No major labels. Just indie artists.
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                70% of what your fans pay
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                Dashboard shows every cent
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                Human curation, not algorithm gaming
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="max-w-5xl mx-auto mb-20">
        <h2 class="text-2xl font-bold text-zinc-100 text-center mb-12">No gatekeepers</h2>
        <div class="grid md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-fuchsia-400">1</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Sign up</h3>
            <p class="text-zinc-400 text-sm">Free. No credit card.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-fuchsia-400">2</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Create profile</h3>
            <p class="text-zinc-400 text-sm">Bio, photo, links. Done.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-fuchsia-400">3</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Upload music</h3>
            <p class="text-zinc-400 text-sm">Unlimited. No fees.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
              <span class="text-2xl font-bold text-teal-400">4</span>
            </div>
            <h3 class="font-semibold text-zinc-100 mb-2">Get paid</h3>
            <p class="text-zinc-400 text-sm">Monthly. Direct deposit.</p>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="max-w-5xl mx-auto mb-20">
        <h2 class="text-2xl font-bold text-zinc-100 text-center mb-12">What you get</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-fuchsia-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Unlimited uploads</h3>
            <p class="text-zinc-400 text-sm">
              As many albums and tracks as you want. No limits. No fees. Ever.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-chart-bar-square" class="w-8 h-8 text-fuchsia-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Transparent stats</h3>
            <p class="text-zinc-400 text-sm">
              See who's listening, where they are, and exactly how much you've earned.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-eye" class="w-8 h-8 text-fuchsia-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">No mystery math</h3>
            <p class="text-zinc-400 text-sm">
              Every payout shows exactly where it came from. Fan by fan.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-teal-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Monthly payouts</h3>
            <p class="text-zinc-400 text-sm">
              Direct to your bank. No waiting months. No weird thresholds.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-hand-raised" class="w-8 h-8 text-violet-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">You own it all</h3>
            <p class="text-zinc-400 text-sm">
              Your music, your rights. We're just the platform. Leave anytime.
            </p>
          </div>
          <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 text-violet-400 mb-4" />
            <h3 class="font-semibold text-zinc-100 mb-2">Your page, your look</h3>
            <p class="text-zinc-400 text-sm">
              Custom colors, bio, links. Make it yours.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center bg-gradient-to-r from-fuchsia-900/30 to-violet-900/30 rounded-2xl p-12 border border-fuchsia-500/30 max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-zinc-100 mb-4">Your fans are waiting</h2>
        <p class="text-zinc-400 mb-8">
          Upload your music. Get paid fairly. See where every dollar comes from.
        </p>
        <UButton color="fuchsia" size="xl" to="/dashboard/artist/new">
          Start uploading
        </UButton>
        <p class="text-zinc-500 text-sm mt-4">Free forever. No credit card. No catch.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'For Artists | Fairtune',
  meta: [
    { name: 'description', content: '70% to you. 15% to royalties. 15% platform costs. Your fans pay, you get paid. No pool. No mystery math.' },
  ],
})
</script>
