<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
        Music streaming that's
        <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          fair for everyone
        </span>
      </h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        We built Fairstream because we believe artists deserve better. A platform where your support goes directly to the musicians you love.
      </p>
    </div>

    <!-- Mission -->
    <div class="max-w-4xl mx-auto mb-20">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-2xl font-bold text-zinc-100 mb-4">Our Mission</h2>
          <p class="text-zinc-400 mb-4">
            Traditional streaming platforms pay artists fractions of a cent per stream, pooling all subscription revenue and distributing it based on total platform plays.
          </p>
          <p class="text-zinc-400 mb-4">
            This means your subscription might end up supporting artists you've never even heard of, while the indie artists you actually listen to get almost nothing.
          </p>
          <p class="text-zinc-400">
            We're changing that. On Fairstream, your subscription is divided among only the artists you listen to. If you spend 100% of your time listening to one artist, 100% of your subscription (minus our small platform fee) goes to them.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div class="text-center mb-4">
            <div class="text-5xl font-bold text-green-400 mb-1">85%</div>
            <p class="text-zinc-300 font-medium">To Music Rights</p>
            <p class="text-zinc-500 text-xs mt-1">Highest in streaming</p>
          </div>
          <div class="h-px bg-zinc-800 my-4" />
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-violet-400">70%</div>
              <p class="text-zinc-400 text-xs">Direct to artists</p>
            </div>
            <div>
              <div class="text-2xl font-bold text-teal-400">15%</div>
              <p class="text-zinc-400 text-xs">Royalty societies</p>
            </div>
          </div>
          <div class="h-px bg-zinc-800 my-4" />
          <div class="text-center">
            <div class="text-2xl font-bold text-fuchsia-400 mb-1">15%</div>
            <p class="text-zinc-400 text-xs">Platform operations</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Values -->
    <div class="max-w-5xl mx-auto mb-20">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-12">What We Believe</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div class="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-violet-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">Fair Compensation</h3>
          <p class="text-zinc-400 text-sm">
            Artists should earn a living from their music. We ensure they get the largest possible share of listener subscriptions.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div class="w-12 h-12 rounded-lg bg-fuchsia-500/20 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-eye" class="w-6 h-6 text-fuchsia-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">Transparency</h3>
          <p class="text-zinc-400 text-sm">
            Artists can see exactly where their revenue comes from. Listeners can see exactly where their money goes.
          </p>
        </div>
        <div class="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div class="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-heart" class="w-6 h-6 text-green-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">Artist First</h3>
          <p class="text-zinc-400 text-sm">
            Every decision we make is guided by what's best for independent artists and their fans.
          </p>
        </div>
      </div>
    </div>

    <!-- Team placeholder -->
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-zinc-100 mb-4">Built by Music Lovers</h2>
      <p class="text-zinc-400 mb-8">
        Fairstream was created by a small team of developers and musicians who were frustrated with the current state of music streaming. We're building the platform we wish existed.
      </p>
      <UButton color="violet" to="/contact">
        Get in Touch
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About | Fairstream',
  meta: [
    { name: 'description', content: 'Fairstream is a music streaming platform where your subscription goes directly to the artists you listen to.' },
  ],
})
</script>
