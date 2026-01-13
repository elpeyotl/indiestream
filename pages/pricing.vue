<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-zinc-100 mb-4">Simple, Fair Pricing</h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        <span class="text-teal-400 font-semibold">85% of your subscription supports music rights</span> - the highest in streaming.
      </p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
      <!-- Free Tier -->
      <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-zinc-400 mb-2">Free</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-bold text-zinc-100">$0</span>
            <span class="text-zinc-500">/month</span>
          </div>
        </div>
        <p class="text-zinc-400 mb-6">
          Preview tracks and discover new artists.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            30-second previews
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Browse all artists
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Create account
          </li>
          <li class="flex items-center gap-2 text-zinc-500">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            Full track streaming
          </li>
          <li class="flex items-center gap-2 text-zinc-500">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            Listening history
          </li>
        </ul>
        <UButton color="gray" variant="outline" block size="lg" to="/register">
          Get Started
        </UButton>
      </div>

      <!-- Listener Tier -->
      <div class="bg-gradient-to-b from-violet-900/50 to-zinc-900 rounded-2xl p-8 border-2 border-violet-500 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2">
          <UBadge color="violet" size="sm">Most Popular</UBadge>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-violet-400 mb-2">Listener</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-bold text-zinc-100">$9.99</span>
            <span class="text-zinc-500">/month</span>
          </div>
        </div>
        <p class="text-zinc-400 mb-6">
          Unlimited streaming. Support artists directly.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Unlimited full tracks
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            High quality audio
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Listening history
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Support artists directly
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            No ads, ever
          </li>
        </ul>
        <UButton
          color="violet"
          block
          size="lg"
          :loading="loading"
          @click="handleSubscribe"
        >
          {{ isSubscribed ? 'Already Subscribed' : user ? 'Start Free Trial' : 'Start Listening' }}
        </UButton>
      </div>

      <!-- Artist Tier -->
      <div class="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-fuchsia-400 mb-2">Artist</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-bold text-zinc-100">Free</span>
          </div>
        </div>
        <p class="text-zinc-400 mb-6">
          Upload your music and earn from streams.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Unlimited uploads
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Keep 70% of revenue
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Detailed analytics
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Artist profile page
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
            Monthly payouts
          </li>
        </ul>
        <UButton color="fuchsia" variant="outline" block size="lg" to="/dashboard/artist/new">
          Create Artist Profile
        </UButton>
      </div>
    </div>

    <!-- How Payment Works -->
    <div class="max-w-4xl mx-auto mb-16">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">How Your Money Supports Artists</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-violet-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">You Listen</h3>
          <p class="text-zinc-400 text-sm">
            Stream your favorite artists as much as you want with your subscription.
          </p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-chart-pie" class="w-8 h-8 text-fuchsia-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">We Calculate</h3>
          <p class="text-zinc-400 text-sm">
            Your subscription is split based on who you actually listened to.
          </p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-green-400" />
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">85% to Music Rights</h3>
          <p class="text-zinc-400 text-sm">
            70% direct to artists + 15% to royalty societies. Only 15% platform fee.
          </p>
        </div>
      </div>
    </div>

    <!-- Comparison -->
    <div class="max-w-3xl mx-auto mb-16">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">Why Indiestream?</h2>
      <div class="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left p-4 text-zinc-400 font-medium"></th>
              <th class="text-center p-4 text-violet-400 font-semibold">Indiestream</th>
              <th class="text-center p-4 text-zinc-500 font-medium">Others</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            <tr>
              <td class="p-4 text-zinc-300">To music rights</td>
              <td class="p-4 text-center text-green-400 font-semibold">85%</td>
              <td class="p-4 text-center text-zinc-500">~70%</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Direct to artist</td>
              <td class="p-4 text-center text-green-400 font-semibold">70%</td>
              <td class="p-4 text-center text-zinc-500">~30%</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Your money goes to</td>
              <td class="p-4 text-center text-green-400 font-semibold">Artists you listen to</td>
              <td class="p-4 text-center text-zinc-500">Royalty pool</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Transparent payouts</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mx-auto" />
              </td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-zinc-600 mx-auto" />
              </td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Independent artists focus</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mx-auto" />
              </td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-zinc-600 mx-auto" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- FAQ -->
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">Frequently Asked Questions</h2>
      <UAccordion :items="faqItems" />
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const { isSubscribed, startCheckout, loading } = useSubscription()
const toast = useToast()

useHead({
  title: 'Pricing | Indiestream',
  meta: [
    { name: 'description', content: 'Simple, fair pricing. Your subscription goes directly to the artists you listen to.' },
  ],
})

// Stripe Price ID for Listener plan ($9.99/month)
const LISTENER_PRICE_ID = 'price_1SolWZDpO91TMxctZrzuoJ0v'

const handleSubscribe = async () => {
  if (!user.value) {
    navigateTo('/register')
    return
  }

  if (isSubscribed.value) {
    toast.add({
      title: 'Already subscribed',
      description: 'You already have an active subscription.',
      color: 'blue',
    })
    return
  }

  await startCheckout(LISTENER_PRICE_ID)
}

const faqItems = [
  {
    label: 'How does the artist payment work?',
    content: 'Unlike traditional streaming services that use a royalty pool, your subscription is divided based on your actual listening. If you spend 50% of your listening time on one artist, they receive 50% of the artist share. Your $9.99 is split: 70% ($6.99) to artists, 15% ($1.50) to performance royalty societies (SUISA, GEMA, etc.), and 15% ($1.50) platform fee.',
  },
  {
    label: 'Can I cancel anytime?',
    content: 'Yes! You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
  },
  {
    label: 'How do artists get paid?',
    content: 'Artists receive monthly payouts via direct bank transfer or PayPal. We process payments on the 15th of each month for the previous month\'s streams.',
  },
  {
    label: 'Is there a free trial?',
    content: 'We offer a 7-day free trial for new subscribers. You can cancel anytime during the trial and won\'t be charged.',
  },
  {
    label: 'What audio quality do you offer?',
    content: 'We stream at 320kbps MP3 quality for all subscribers. We\'re working on adding lossless audio options soon.',
  },
  {
    label: 'How do I become a verified artist?',
    content: 'Once you\'ve created an artist profile and uploaded at least one release, you can apply for verification through your dashboard. We review applications within 48 hours.',
  },
]
</script>
