<template>
  <div class="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
    <div class="text-center">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <AppLogo size="lg" />
      </div>

      <!-- Error Icon -->
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
        <UIcon
          :name="is404 ? 'i-heroicons-map' : 'i-heroicons-exclamation-triangle'"
          class="w-10 h-10 text-violet-400"
        />
      </div>

      <!-- Error Message -->
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">
        {{ is404 ? 'Page Not Found' : 'Something Went Wrong' }}
      </h1>
      <p class="text-zinc-400 mb-8 max-w-md mx-auto">
        {{ is404
          ? "The page you're looking for doesn't exist or has been moved."
          : "We're having trouble loading this page. Please try again."
        }}
      </p>

      <!-- Error Code (subtle) -->
      <p v-if="error?.statusCode" class="text-zinc-600 text-sm mb-6">
        Error {{ error.statusCode }}
      </p>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <UButton color="violet" size="lg" to="/">
          <UIcon name="i-heroicons-home" class="w-5 h-5 mr-2" />
          Go Home
        </UButton>
        <UButton color="gray" variant="ghost" size="lg" @click="goBack">
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 mr-2" />
          Go Back
        </UButton>
      </div>

      <!-- Clear error button for non-404 errors -->
      <div v-if="!is404" class="mt-6">
        <UButton color="gray" variant="ghost" size="sm" @click="handleClearError">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
          Try Again
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  error: {
    statusCode: number
    message: string
  }
}>()

const is404 = computed(() => {
  const props = getCurrentInstance()?.props
  return (props?.error as any)?.statusCode === 404
})

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}

const handleClearError = () => {
  clearError({ redirect: '/' })
}

// Set page title
useHead({
  title: 'Error | Fairtune',
})
</script>
