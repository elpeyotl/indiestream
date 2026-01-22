<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100">Your Stats</h1>
      <p class="text-zinc-400 mt-2">Track your listening and see how you support artists</p>
    </div>

    <!-- Tabs -->
    <PillTabs v-model="activeTab" :tabs="tabs">
      <!-- Impact Tab -->
      <template #impact>
        <StatsImpactTab />
      </template>

      <!-- Listening Tab -->
      <template #listening>
        <StatsListeningTab />
      </template>
    </PillTabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Your Stats | Fairtune',
  meta: [
    { name: 'description', content: 'Track your listening history and see how your subscription supports independent artists.' },
  ],
})

const tabs = [
  { label: 'My Impact', icon: 'i-heroicons-heart', slot: 'impact' },
  { label: 'Listening Stats', icon: 'i-heroicons-chart-bar', slot: 'listening' },
]

const activeTab = ref(0)
</script>
