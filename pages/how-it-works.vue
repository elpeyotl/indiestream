<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-16 border-b-2 border-zinc-800 pb-8">
      <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">WHERE YOUR MONEY GOES</h1>
      <p class="text-xl font-mono text-zinc-400 max-w-2xl mx-auto">
        <span class="text-fuchsia-500 font-bold">$9.99/month. 70% to artists. 15% to royalties. 15% platform.</span> No pool. No mystery.
      </p>
    </div>

    <!-- For Listeners -->
    <div class="max-w-5xl mx-auto mb-20">
      <div class="flex items-center gap-3 mb-8 border-b-2 border-zinc-800 pb-4">
        <div class="w-10 h-10 border-2 border-fuchsia-500 flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-fuchsia-500" />
        </div>
        <h2 class="text-2xl font-black uppercase tracking-tighter text-white">FOR LISTENERS</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 border-2 border-fuchsia-500 flex items-center justify-center text-fuchsia-500 font-bold text-sm">
            1
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 ml-4 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <h3 class="font-black uppercase tracking-tight text-white mb-2">PAY $9.99/MONTH</h3>
            <p class="text-zinc-400 font-mono text-sm">
              Unlimited streaming. Every artist on the platform. No ads. No tiers.
            </p>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 border-2 border-fuchsia-500 flex items-center justify-center text-fuchsia-500 font-bold text-sm">
            2
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 ml-4 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <h3 class="font-black uppercase tracking-tight text-white mb-2">LISTEN TO WHAT YOU WANT</h3>
            <p class="text-zinc-400 font-mono text-sm">
              We track your listening time. Not to spy on you. To pay artists fairly.
            </p>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -left-4 top-0 w-8 h-8 border-2 border-fuchsia-500 flex items-center justify-center text-fuchsia-500 font-bold text-sm">
            3
          </div>
          <div class="bg-zinc-950 border-2 border-zinc-800 p-6 ml-4 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <h3 class="font-black uppercase tracking-tight text-white mb-2">SEE WHERE IT GOES</h3>
            <p class="text-zinc-400 font-mono text-sm">
              Every month, we show you exactly which artists got your money. Down to the cent.
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Example -->
      <div class="bg-zinc-950 border-2 border-zinc-800 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
        <h3 class="font-black uppercase tracking-tight text-white mb-6 text-center border-b-2 border-zinc-800 pb-4">REAL EXAMPLE: WHERE YOUR $9.99 GOES</h3>
        <div class="max-w-md mx-auto space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 border-2 border-teal-500 flex items-center justify-center">
                <span class="text-teal-400 font-black">A</span>
              </div>
              <div>
                <p class="text-white font-bold uppercase tracking-tight">Band you love</p>
                <p class="text-zinc-500 font-mono text-sm">60% of your listening</p>
              </div>
            </div>
            <span class="text-teal-400 font-black text-lg">$4.19</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 border-2 border-fuchsia-500 flex items-center justify-center">
                <span class="text-fuchsia-400 font-black">B</span>
              </div>
              <div>
                <p class="text-white font-bold uppercase tracking-tight">New discovery</p>
                <p class="text-zinc-500 font-mono text-sm">30% of your listening</p>
              </div>
            </div>
            <span class="text-teal-400 font-black text-lg">$2.10</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 border-2 border-violet-500 flex items-center justify-center">
                <span class="text-violet-400 font-black">C</span>
              </div>
              <div>
                <p class="text-white font-bold uppercase tracking-tight">That one album</p>
                <p class="text-zinc-500 font-mono text-sm">10% of your listening</p>
              </div>
            </div>
            <span class="text-teal-400 font-black text-lg">$0.70</span>
          </div>
          <div class="h-px bg-zinc-800 my-4" />
          <div class="flex items-center justify-between text-zinc-400 font-mono text-sm">
            <span>Royalties to PROs (songwriters)</span>
            <span class="text-white font-bold">$1.50</span>
          </div>
          <div class="flex items-center justify-between text-zinc-400 font-mono text-sm">
            <span>Platform costs (servers, bandwidth, team)</span>
            <span class="text-white font-bold">$1.50</span>
          </div>
        </div>
      </div>
    </div>

    <!-- For Artists -->
    <div class="max-w-5xl mx-auto mb-20">
      <div class="flex items-center gap-3 mb-8 border-b-2 border-zinc-800 pb-4">
        <div class="w-10 h-10 border-2 border-fuchsia-500 flex items-center justify-center">
          <UIcon name="i-heroicons-microphone" class="w-5 h-5 text-fuchsia-500" />
        </div>
        <h2 class="text-2xl font-black uppercase tracking-tighter text-white">FOR ARTISTS</h2>
      </div>

      <div class="grid md:grid-cols-4 gap-6 mb-12">
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <UIcon name="i-heroicons-user-plus" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">SIGN UP</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Free. No credit card. No approval process.
          </p>
        </div>
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">UPLOAD</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Unlimited tracks. Unlimited albums. No fees.
          </p>
        </div>
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">SEE EVERYTHING</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Who's listening. Where they are. What you earned.
          </p>
        </div>
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 mx-auto mb-4 border-2 border-teal-500 flex items-center justify-center">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-teal-400" />
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">GET PAID</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Every month. Direct to your bank.
          </p>
        </div>
      </div>

      <!-- Artist Benefits -->
      <div class="bg-zinc-950 border-2 border-fuchsia-500/50 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
        <h3 class="font-black uppercase tracking-tight text-white mb-6 text-center border-b-2 border-zinc-800 pb-4">THE FINE PRINT (THERE ISN'T MUCH)</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-fuchsia-500 mt-0.5" />
            <div>
              <p class="text-white font-bold uppercase tracking-tight">70% TO YOU</p>
              <p class="text-zinc-400 font-mono text-sm">From your fans. Not a pool. Directly proportional to listening time.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-fuchsia-500 mt-0.5" />
            <div>
              <p class="text-white font-bold uppercase tracking-tight">15% TO ROYALTIES</p>
              <p class="text-zinc-400 font-mono text-sm">We pay PROs (ASCAP, BMI, GEMA, etc.) so songwriters get their cut.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-fuchsia-500 mt-0.5" />
            <div>
              <p class="text-white font-bold uppercase tracking-tight">YOU OWN EVERYTHING</p>
              <p class="text-zinc-400 font-mono text-sm">Your music. Your rights. We're just the platform. Leave anytime.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-fuchsia-500 mt-0.5" />
            <div>
              <p class="text-white font-bold uppercase tracking-tight">NO GATEKEEPERS</p>
              <p class="text-zinc-400 font-mono text-sm">Upload. Publish. Done. Human moderation just keeps out spam.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="text-center bg-zinc-950 border-2 border-zinc-800 p-12 max-w-3xl mx-auto shadow-[8px_8px_0px_0px_rgba(139,92,246,0.5)]">
      <h2 class="text-3xl font-black uppercase tracking-tighter text-white mb-4">THAT'S IT. REALLY.</h2>
      <p class="text-zinc-400 font-mono text-sm mb-8">No tricks. No hidden fees. No VC investors to please.</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink
          to="/register"
          class="inline-block px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all"
        >
          Start listening
        </NuxtLink>
        <NuxtLink
          to="/dashboard/artist/new"
          class="inline-block px-6 py-3 border-2 border-fuchsia-500 text-fuchsia-500 font-bold uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
        >
          Upload music
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
  title: 'How It Works | Fairtune',
  meta: [
    { name: 'description', content: '$9.99/month. 70% to artists. 15% to royalties. 15% platform costs. We show you every cent.' },
  ],
})
</script>
