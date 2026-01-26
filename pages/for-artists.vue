<template>
  <div>
    <!-- Hero -->
    <div class="border-b-2 border-zinc-800 py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6">
          KEEP <span class="text-fuchsia-500">70%</span>
        </h1>
        <p class="text-xl font-mono text-zinc-400 max-w-2xl mx-auto mb-8">
          Your fans pay. You get paid. No pool. No mystery math. No label required.
        </p>
        <NuxtLink
          to="/dashboard/artist/new"
          class="inline-block px-8 py-4 bg-fuchsia-600 text-white font-bold text-lg uppercase tracking-tight rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all"
        >
          Upload Your Music
        </NuxtLink>
      </div>
    </div>

    <div class="container mx-auto px-4 py-16">
      <!-- Stats -->
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20 border-2 border-zinc-800 p-8">
        <div class="text-center border-r-2 border-zinc-800 last:border-r-0">
          <div class="text-5xl font-black text-fuchsia-500 tracking-tighter mb-2">70%</div>
          <p class="text-zinc-400 font-mono text-sm uppercase">Direct to you</p>
        </div>
        <div class="text-center border-r-2 border-zinc-800 last:border-r-0">
          <div class="text-5xl font-black text-white tracking-tighter mb-2">15%</div>
          <p class="text-zinc-400 font-mono text-sm uppercase">To royalties (PROs)</p>
        </div>
        <div class="text-center">
          <div class="text-5xl font-black text-white tracking-tighter mb-2">15%</div>
          <p class="text-zinc-400 font-mono text-sm uppercase">Platform costs</p>
        </div>
      </div>

      <!-- The Problem -->
      <div class="max-w-4xl mx-auto mb-20">
        <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-8 border-b-2 border-zinc-800 pb-4">YOU KNOW THE DEAL</h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.3)]">
            <div class="flex items-center gap-2 text-red-400 mb-4 border-b-2 border-zinc-800 pb-3">
              <UIcon name="i-heroicons-x-circle" class="w-6 h-6" />
              <span class="font-black uppercase tracking-tight">Big streaming</span>
            </div>
            <ul class="space-y-3 font-mono text-sm">
              <li class="flex items-start gap-2 text-zinc-400">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Your fans' money goes into a pool
              </li>
              <li class="flex items-start gap-2 text-zinc-400">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Drake gets paid from your fans
              </li>
              <li class="flex items-start gap-2 text-zinc-400">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                ~$0.003 per stream (if you're lucky)
              </li>
              <li class="flex items-start gap-2 text-zinc-400">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                No idea how payouts are calculated
              </li>
              <li class="flex items-start gap-2 text-zinc-400">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                Algorithms decide who gets heard
              </li>
            </ul>
          </div>
          <div class="bg-zinc-950 border-2 border-fuchsia-500/50 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <div class="flex items-center gap-2 text-fuchsia-500 mb-4 border-b-2 border-zinc-800 pb-3">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
              <span class="font-black uppercase tracking-tight">Fairtune</span>
            </div>
            <ul class="space-y-3 font-mono text-sm">
              <li class="flex items-start gap-2 text-zinc-300">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                Your fans' money goes to you
              </li>
              <li class="flex items-start gap-2 text-zinc-300">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                No major labels. Just indie artists.
              </li>
              <li class="flex items-start gap-2 text-zinc-300">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                70% of what your fans pay
              </li>
              <li class="flex items-start gap-2 text-zinc-300">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                Dashboard shows every cent
              </li>
              <li class="flex items-start gap-2 text-zinc-300">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                Human curation, not algorithm gaming
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="max-w-5xl mx-auto mb-20">
        <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-12 border-b-2 border-zinc-800 pb-4">NO GATEKEEPERS</h2>
        <div class="grid md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
              <span class="text-2xl font-black text-fuchsia-500">1</span>
            </div>
            <h3 class="font-black uppercase tracking-tight text-white mb-2">SIGN UP</h3>
            <p class="text-zinc-400 font-mono text-sm">Free. No credit card.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
              <span class="text-2xl font-black text-fuchsia-500">2</span>
            </div>
            <h3 class="font-black uppercase tracking-tight text-white mb-2">CREATE PROFILE</h3>
            <p class="text-zinc-400 font-mono text-sm">Bio, photo, links. Done.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
              <span class="text-2xl font-black text-fuchsia-500">3</span>
            </div>
            <h3 class="font-black uppercase tracking-tight text-white mb-2">UPLOAD MUSIC</h3>
            <p class="text-zinc-400 font-mono text-sm">Unlimited. No fees.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
              <span class="text-2xl font-black text-fuchsia-500">4</span>
            </div>
            <h3 class="font-black uppercase tracking-tight text-white mb-2">GET PAID</h3>
            <p class="text-zinc-400 font-mono text-sm">Monthly. Direct deposit.</p>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="max-w-5xl mx-auto mb-20">
        <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-12 border-b-2 border-zinc-800 pb-4">WHAT YOU GET</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-fuchsia-500 mb-4" />
            <h3 class="font-black uppercase tracking-tight text-white mb-2">UNLIMITED UPLOADS</h3>
            <p class="text-zinc-400 font-mono text-sm">
              As many albums and tracks as you want. No limits. No fees. Ever.
            </p>
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <UIcon name="i-heroicons-chart-bar-square" class="w-8 h-8 text-fuchsia-500 mb-4" />
            <h3 class="font-black uppercase tracking-tight text-white mb-2">TRANSPARENT STATS</h3>
            <p class="text-zinc-400 font-mono text-sm">
              See who's listening, where they are, and exactly how much you've earned.
            </p>
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <UIcon name="i-heroicons-eye" class="w-8 h-8 text-fuchsia-500 mb-4" />
            <h3 class="font-black uppercase tracking-tight text-white mb-2">NO MYSTERY MATH</h3>
            <p class="text-zinc-400 font-mono text-sm">
              Every payout shows exactly where it came from. Fan by fan.
            </p>
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-fuchsia-500 mb-4" />
            <h3 class="font-black uppercase tracking-tight text-white mb-2">MONTHLY PAYOUTS</h3>
            <p class="text-zinc-400 font-mono text-sm">
              Direct to your bank. No waiting months. No weird thresholds.
            </p>
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <UIcon name="i-heroicons-hand-raised" class="w-8 h-8 text-fuchsia-500 mb-4" />
            <h3 class="font-black uppercase tracking-tight text-white mb-2">YOU OWN IT ALL</h3>
            <p class="text-zinc-400 font-mono text-sm">
              Your music, your rights. We're just the platform. Leave anytime.
            </p>
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 text-fuchsia-500 mb-4" />
            <h3 class="font-black uppercase tracking-tight text-white mb-2">YOUR PAGE, YOUR LOOK</h3>
            <p class="text-zinc-400 font-mono text-sm">
              Custom colors, bio, links. Make it yours.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center bg-zinc-950 border-2 border-zinc-800 p-12 max-w-3xl mx-auto shadow-[8px_8px_0px_0px_rgba(139,92,246,0.5)]">
        <h2 class="text-3xl font-black uppercase tracking-tighter text-white mb-4">YOUR FANS ARE WAITING</h2>
        <p class="text-zinc-400 font-mono text-sm mb-8">
          Upload your music. Get paid fairly. See where every dollar comes from.
        </p>
        <NuxtLink
          to="/dashboard/artist/new"
          class="inline-block px-8 py-4 bg-fuchsia-600 text-white font-bold text-lg uppercase tracking-tight rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all"
        >
          Start uploading
        </NuxtLink>
        <p class="text-zinc-500 font-mono text-xs mt-4 uppercase">Free forever. No credit card. No catch.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist'
})

useHead({
  title: 'For Artists | Fairtune',
  meta: [
    { name: 'description', content: '70% to you. 15% to royalties. 15% platform costs. Your fans pay, you get paid. No pool. No mystery math.' },
  ],
})
</script>
