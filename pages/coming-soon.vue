<template>
  <div class="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <!-- Background gradient -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 text-center max-w-2xl">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <AppLogo size="xl" />
      </div>

      <!-- Heading -->
      <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-4">
        Something Amazing is Coming
      </h1>

      <!-- Tagline -->
      <p class="text-xl text-zinc-400 mb-8">
        Stream Fair. Support Direct.
      </p>

      <p class="text-zinc-500 mb-12 max-w-md mx-auto">
        A new way to stream music where your subscription directly supports the artists you love.
      </p>

      <!-- Email signup (optional placeholder) -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
        <a
          href="mailto:hello@fairtune.fm"
          class="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
        >
          Get Notified
        </a>
      </div>

      <!-- Social links or additional info -->
      <p class="text-zinc-600 text-sm">
        Coming soon in 2026
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'Coming Soon - Fairtune',
  meta: [
    { name: 'description', content: 'Fairtune - Stream Fair. Support Direct. A new music streaming platform coming soon.' },
  ],
})
</script>
