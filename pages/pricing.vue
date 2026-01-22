<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-zinc-100 mb-4">$9.99. That's it.</h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        <span class="text-teal-400 font-semibold">70% to artists. 15% to royalties. 15% keeps us running.</span>
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
          <UBadge color="violet" size="sm">The only plan</UBadge>
        </div>
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-violet-400 mb-2">Listener</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-bold text-zinc-100">$9.99</span>
            <span class="text-zinc-500">/month</span>
          </div>
        </div>
        <p class="text-zinc-400 mb-6">
          Everything. No tiers. No upsells.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            Unlimited streaming
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            High quality audio
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            See where your money goes
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            70% to artists you listen to
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            No ads. No algorithm. No pool.
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
            <span class="text-zinc-500">forever</span>
          </div>
        </div>
        <p class="text-zinc-400 mb-6">
          Upload. Get paid. That's it.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            Unlimited uploads
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            70% of your fans' money
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            Transparent stats
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            Monthly payouts
          </li>
          <li class="flex items-center gap-2 text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500" />
            You keep your rights
          </li>
        </ul>
        <UButton color="fuchsia" variant="outline" block size="lg" to="/dashboard/artist/new">
          Start uploading
        </UButton>
      </div>
    </div>

    <!-- How Payment Works -->
    <div class="max-w-4xl mx-auto mb-16">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">Where your $9.99 goes</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
            <span class="text-xl font-bold text-teal-400">$6.99</span>
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">70% to artists</h3>
          <p class="text-zinc-400 text-sm">
            Split between the artists you actually listened to. Your money, your artists.
          </p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <span class="text-xl font-bold text-violet-400">$1.50</span>
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">15% to royalties</h3>
          <p class="text-zinc-400 text-sm">
            To PROs (ASCAP, BMI, GEMA, SUISA). Songwriters get paid.
          </p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
            <span class="text-xl font-bold text-fuchsia-400">$1.50</span>
          </div>
          <h3 class="font-semibold text-zinc-100 mb-2">15% platform</h3>
          <p class="text-zinc-400 text-sm">
            Servers, bandwidth, payment processing. No investors. Just costs.
          </p>
        </div>
      </div>
    </div>

    <!-- Comparison -->
    <div class="max-w-3xl mx-auto mb-16">
      <h2 class="text-2xl font-bold text-zinc-100 text-center mb-8">The difference</h2>
      <div class="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left p-4 text-zinc-400 font-medium"></th>
              <th class="text-center p-4 text-violet-400 font-semibold">Fairtune</th>
              <th class="text-center p-4 text-zinc-500 font-medium">Big streaming</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            <tr>
              <td class="p-4 text-zinc-300">Direct to artist</td>
              <td class="p-4 text-center text-teal-400 font-semibold">70%</td>
              <td class="p-4 text-center text-zinc-500">~30% (after labels)</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Your money goes to</td>
              <td class="p-4 text-center text-teal-400 font-semibold">Artists you listen to</td>
              <td class="p-4 text-center text-zinc-500">A pool (mostly Drake)</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">See where it goes</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500 mx-auto" />
              </td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-zinc-600 mx-auto" />
              </td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Independent only</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500 mx-auto" />
              </td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-zinc-600 mx-auto" />
              </td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Royalties on every stream</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-teal-500 mx-auto" />
              </td>
              <td class="p-4 text-center text-zinc-500">Only paid streams</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300">Free tier loophole</td>
              <td class="p-4 text-center text-teal-400 font-semibold">No free tier</td>
              <td class="p-4 text-center text-zinc-500">Unlimited free plays</td>
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
const subscriptionStore = useSubscriptionStore()
const { isSubscribed, startCheckout, loading } = subscriptionStore
const toast = useToast()

useHead({
  title: 'Pricing | Fairtune',
  meta: [
    { name: 'description', content: '$9.99/month. 70% to artists. 15% to royalties. 15% platform. We show you every cent.' },
  ],
})

// Stripe Price ID for Listener plan ($9.99/month)
const LISTENER_PRICE_ID = 'price_1SolWZDpO91TMxctZrzuoJ0v'

const handleSubscribe = async () => {
  if (!user.value) {
    navigateTo('/register')
    return
  }

  if (isSubscribed) {
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
    label: 'Do you pay royalties on every stream?',
    content: 'Yes! Unlike some platforms that allow unlimited free streaming (generating no royalties), every stream on Fairtune from a paying subscriber generates revenue for both artists and royalty societies (SUISA, GEMA, ASCAP, BMI, etc.). Our free tier only offers 30-second previews, ensuring all full-length plays are properly compensated. No loopholes.',
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
