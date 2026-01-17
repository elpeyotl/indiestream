<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold mb-4">
          <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Changelog</span>
        </h1>
        <p class="text-zinc-400 text-lg">
          Track all the updates and improvements to Fairstream.
        </p>
        <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
          <span class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
          <span class="text-violet-400 text-sm font-medium">Current version: {{ APP_VERSION }}</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mb-8 text-sm">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span class="text-zinc-400">Added</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
          <span class="text-zinc-400">Changed</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-amber-500"></span>
          <span class="text-zinc-400">Fixed</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-500"></span>
          <span class="text-zinc-400">Removed</span>
        </div>
      </div>

      <!-- Changelog entries -->
      <div class="space-y-8">
        <div
          v-for="entry in CHANGELOG"
          :key="entry.version"
          class="relative pl-8 pb-8 border-l-2 border-zinc-800 last:border-l-0"
        >
          <!-- Version marker -->
          <div class="absolute -left-3 top-0 w-6 h-6 rounded-full bg-zinc-900 border-2 border-violet-500 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-violet-500"></div>
          </div>

          <!-- Version header -->
          <div class="flex items-center gap-4 mb-4">
            <h2 class="text-xl font-bold text-zinc-100">v{{ entry.version }}</h2>
            <span class="text-sm text-zinc-500">{{ formatDate(entry.date) }}</span>
            <span
              v-if="entry.version === APP_VERSION"
              class="px-2 py-0.5 text-xs font-medium bg-violet-500/20 text-violet-400 rounded-full"
            >
              Latest
            </span>
          </div>

          <!-- Changes list -->
          <ul class="space-y-2">
            <li
              v-for="(change, idx) in entry.changes"
              :key="idx"
              class="flex items-start gap-3"
            >
              <span
                :class="[
                  'mt-1.5 w-2 h-2 rounded-full shrink-0',
                  {
                    'bg-emerald-500': change.type === 'added',
                    'bg-blue-500': change.type === 'changed',
                    'bg-amber-500': change.type === 'fixed',
                    'bg-red-500': change.type === 'removed',
                  }
                ]"
              ></span>
              <span class="text-zinc-300">{{ change.description }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 pt-8 border-t border-zinc-800 text-center">
        <p class="text-zinc-500 text-sm">
          Have a feature request or found a bug?
          <NuxtLink to="/contact" class="text-violet-400 hover:text-violet-300 transition-colors">
            Let us know
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { APP_VERSION, CHANGELOG } from '~/utils/version'

useHead({
  title: 'Changelog - Fairstream',
  meta: [
    { name: 'description', content: 'See what\'s new in Fairstream - all updates, improvements, and bug fixes.' },
  ],
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>
