<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-16 border-b-2 border-zinc-800 pb-12">
      <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">
        WE'RE NOT TRYING TO
        <span class="text-fuchsia-500">DISRUPT ANYTHING</span>
      </h1>
      <p class="text-xl font-mono text-zinc-400 max-w-2xl mx-auto">
        We just want artists to get paid fairly and fans to know where their money goes. That's it.
      </p>
    </div>

    <!-- Mission -->
    <div class="max-w-4xl mx-auto mb-20">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-2xl font-black uppercase tracking-tighter text-white mb-4">THE PROBLEM IS SIMPLE</h2>
          <p class="text-zinc-400 font-mono text-sm mb-4">
            Big streaming platforms pool everyone's money together. Your subscription helps pay Drake, whether you listen to him or not. The math is opaque. The artists you love get fractions of a cent.
          </p>
          <p class="text-fuchsia-500 font-black uppercase mb-4">
            We think that's bullshit.
          </p>
          <p class="text-zinc-400 font-mono text-sm">
            On Fairtune, your money goes to the artists you actually listen to. Listen to one band all month? They get your $6.99. No pool. No mystery. You see exactly where every cent goes.
          </p>
        </div>
        <div class="bg-zinc-950 border-2 border-zinc-800 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="text-center mb-4 border-b-2 border-zinc-800 pb-4">
            <div class="text-lg font-black uppercase tracking-tight text-white">Your $9.99/month</div>
          </div>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-zinc-400 font-mono text-sm">To artists</span>
              <span class="text-2xl font-black text-fuchsia-500">$6.99</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-zinc-400 font-mono text-sm">To royalties (PROs)</span>
              <span class="text-2xl font-black text-white">$1.50</span>
            </div>
            <div class="h-px bg-zinc-800" />
            <div class="flex justify-between items-center">
              <span class="text-zinc-400 font-mono text-sm">Platform costs</span>
              <span class="text-2xl font-black text-white">$1.50</span>
            </div>
          </div>
          <p class="text-zinc-500 font-mono text-xs mt-4 text-center uppercase">
            No investors. No VC money. Just costs.
          </p>
        </div>
      </div>
    </div>

    <!-- Values -->
    <div class="max-w-5xl mx-auto mb-20">
      <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-12 border-b-2 border-zinc-800 pb-4">WHAT WE'RE ABOUT</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 border-2 border-fuchsia-500 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="text-lg font-black uppercase tracking-tight text-white mb-2">70% TO ARTISTS</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Not 30% after labels take their cut. 70% of what your fans pay, directly to you.
          </p>
        </div>
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 border-2 border-fuchsia-500 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-eye" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="text-lg font-black uppercase tracking-tight text-white mb-2">NO SECRETS</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Artists see where their money comes from. Fans see where their money goes. Every cent, accounted for.
          </p>
        </div>
        <div class="bg-zinc-950 border-2 border-zinc-800 p-6 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="w-12 h-12 border-2 border-fuchsia-500 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-hand-raised" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="text-lg font-black uppercase tracking-tight text-white mb-2">INDEPENDENT ONLY</h3>
          <p class="text-zinc-400 font-mono text-sm">
            No major labels. No algorithm-bait. Just artists who own their music and fans who give a shit.
          </p>
        </div>
      </div>
    </div>

    <!-- Team placeholder -->
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="text-2xl font-black uppercase tracking-tighter text-white mb-4">NO EXIT STRATEGY</h2>
      <p class="text-zinc-400 font-mono text-sm mb-4">
        We're not looking for VC funding. We're not trying to get acquired. We're aiming to become a non-profit or NGO so this can exist forever.
      </p>
      <p class="text-zinc-400 font-mono text-sm mb-8">
        Built by people who collect vinyl, go to shows, and got tired of watching streaming pay artists nothing. We wanted something that worked like Bandcamp but let you stream.
      </p>
      <NuxtLink
        to="/contact"
        class="inline-block px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all"
      >
        Get in touch
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist'
})

useHead({
  title: 'About | Fairtune',
  meta: [
    { name: 'description', content: '70% to artists. 15% to royalties. 15% platform. No investors. No VC. Aiming for non-profit status.' },
  ],
})
</script>
