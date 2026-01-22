<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
        We're not trying to
        <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          disrupt anything
        </span>
      </h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        We just want artists to get paid fairly and fans to know where their money goes. That's it.
      </p>
    </div>

    <!-- Mission -->
    <div class="max-w-4xl mx-auto mb-20">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-2xl font-bold text-zinc-100 mb-4">The problem is simple</h2>
          <p class="text-zinc-400 mb-4">
            Big streaming platforms pool everyone's money together. Your subscription helps pay Drake, whether you listen to him or not. The math is opaque. The artists you love get fractions of a cent.
          </p>
          <p class="text-zinc-400 mb-4">
            We think that's bullshit.
          </p>
          <p class="text-zinc-400">
            On Fairtune, your money goes to the artists you actually listen to. Listen to one band all month? They get your $6.99. No pool. No mystery. You see exactly where every cent goes.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div class="text-center mb-4">
            <div class="text-lg font-semibold text-zinc-300 mb-2">Your $9.99/month</div>
          </div>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-zinc-400">To artists</span>
              <span class="text-2xl font-bold text-teal-400">$6.99</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-zinc-400">To royalties (PROs)</span>
              <span class="text-2xl font-bold text-violet-400">$1.50</span>
            </div>
            <div class="h-px bg-zinc-800" />
            <div class="flex justify-between items-center">
              <span class="text-zinc-400">Platform costs</span>
              <span class="text-2xl font-bold text-fuchsia-400">$1.50</span>
            </div>
          </div>
          <p class="text-zinc-500 text-xs mt-4 text-center">
            No investors. No VC money. Just costs.
          </p>
        </div>
      </div>
    </div>

    <!-- Values -->
    <div class="max-w-5xl mx-auto mb-20">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-12">What we're about</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div class="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-teal-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">70% to artists</h3>
          <p class="text-zinc-400 text-sm">
            Not 30% after labels take their cut. 70% of what your fans pay, directly to you.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div class="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-eye" class="w-6 h-6 text-violet-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">No secrets</h3>
          <p class="text-zinc-400 text-sm">
            Artists see where their money comes from. Fans see where their money goes. Every cent, accounted for.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div class="w-12 h-12 rounded-lg bg-fuchsia-500/20 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-hand-raised" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">Independent only</h3>
          <p class="text-zinc-400 text-sm">
            No major labels. No algorithm-bait. Just artists who own their music and fans who give a shit.
          </p>
        </div>
      </div>
    </div>

    <!-- Team placeholder -->
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-zinc-100 mb-4">No exit strategy</h2>
      <p class="text-zinc-400 mb-4">
        We're not looking for VC funding. We're not trying to get acquired. We're aiming to become a non-profit or NGO so this can exist forever.
      </p>
      <p class="text-zinc-400 mb-8">
        Built by people who collect vinyl, go to shows, and got tired of watching streaming pay artists nothing. We wanted something that worked like Bandcamp but let you stream.
      </p>
      <UButton color="violet" to="/contact">
        Get in touch
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About | Fairtune',
  meta: [
    { name: 'description', content: '70% to artists. 15% to royalties. 15% platform. No investors. No VC. Aiming for non-profit status.' },
  ],
})
</script>
