<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-bug-ant" class="w-8 h-8 text-violet-400" />
        </div>
        <h1 class="text-3xl font-bold text-zinc-100 mb-4">Report a Bug</h1>
        <p class="text-zinc-400">
          Found something that's not working right? Let us know and we'll fix it.
        </p>
      </div>

      <!-- Tally Form Embed -->
      <div ref="tallyContainer" class="rounded-2xl overflow-hidden" />

      <!-- Additional Info -->
      <div class="mt-8 text-center">
        <p class="text-zinc-500 text-sm">
          For urgent issues, reach out via
          <NuxtLink to="/contact" class="text-violet-400 hover:text-violet-300">
            contact form
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const tallyContainer = ref<HTMLElement | null>(null)

// Build technical context string
const buildTechnicalContext = () => {
  const info: string[] = []

  // User info
  if (user.value) {
    info.push(`User ID: ${user.value.id}`)
    info.push(`Email: ${user.value.email}`)
  } else {
    info.push('User: Not logged in')
  }

  // Browser & OS
  info.push(`User Agent: ${navigator.userAgent}`)

  // Screen info
  info.push(`Screen: ${window.screen.width}x${window.screen.height}`)
  info.push(`Viewport: ${window.innerWidth}x${window.innerHeight}`)
  info.push(`Pixel Ratio: ${window.devicePixelRatio}`)

  // Current URL (where they came from)
  if (document.referrer) {
    info.push(`Referrer: ${document.referrer}`)
  }

  // Timezone
  info.push(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)

  // Timestamp
  info.push(`Timestamp: ${new Date().toISOString()}`)

  return info.join('\n')
}

onMounted(() => {
  if (!tallyContainer.value) return

  const technicalContext = buildTechnicalContext()
  const encoded = encodeURIComponent(technicalContext)
  const tallyUrl = `https://tally.so/embed/9qZMY4?alignLeft=1&hideTitle=1&dynamicHeight=1&device=${encoded}`

  // Create iframe element
  const iframe = document.createElement('iframe')
  iframe.setAttribute('data-tally-src', tallyUrl)
  iframe.setAttribute('loading', 'lazy')
  iframe.setAttribute('width', '100%')
  iframe.setAttribute('height', '500')
  iframe.setAttribute('frameborder', '0')
  iframe.setAttribute('title', 'Bug Report')
  iframe.style.minHeight = '500px'

  tallyContainer.value.appendChild(iframe)

  // Load Tally embed script
  const script = document.createElement('script')
  script.src = 'https://tally.so/widgets/embed.js'
  script.async = true
  document.body.appendChild(script)
})

useHead({
  title: 'Report a Bug | Indiestream',
  meta: [
    { name: 'description', content: 'Report bugs and issues you find on Indiestream. Help us improve the platform.' },
  ],
})
</script>
