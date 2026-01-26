<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12 border-b-2 border-zinc-800 pb-8">
      <h1 class="text-4xl font-black uppercase tracking-tighter text-white mb-4">$9.99. THAT'S IT.</h1>
      <p class="text-xl font-mono text-zinc-400 max-w-2xl mx-auto">
        <span class="text-fuchsia-500 font-bold">70% to artists. 15% to royalties. 15% keeps us running.</span>
      </p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
      <!-- Free Tier -->
      <div class="bg-zinc-950 border-2 border-zinc-800 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
        <div class="mb-6 border-b-2 border-zinc-800 pb-4">
          <h3 class="text-lg font-black uppercase tracking-tight text-zinc-400 mb-2">FREE</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-black text-white tracking-tighter">$0</span>
            <span class="text-zinc-500 font-mono text-sm">/month</span>
          </div>
        </div>
        <p class="text-zinc-400 font-mono text-sm mb-6">
          Preview tracks and discover new artists.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            30-second previews
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            Browse all artists
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            Create account
          </li>
          <li class="flex items-center gap-2 text-zinc-500 font-mono text-sm">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            Full track streaming
          </li>
          <li class="flex items-center gap-2 text-zinc-500 font-mono text-sm">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            Listening history
          </li>
        </ul>
        <NuxtLink
          to="/register"
          class="block text-center px-4 py-3 border-2 border-zinc-700 text-zinc-400 font-bold uppercase tracking-tight rounded-none hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors"
        >
          Get Started
        </NuxtLink>
      </div>

      <!-- Listener Tier -->
      <div class="bg-zinc-950 border-2 border-fuchsia-500 p-8 shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="px-3 py-1 bg-fuchsia-600 text-white text-xs font-bold uppercase">The only plan</span>
        </div>
        <div class="mb-6 border-b-2 border-zinc-800 pb-4">
          <h3 class="text-lg font-black uppercase tracking-tight text-fuchsia-500 mb-2">LISTENER</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-black text-white tracking-tighter">$9.99</span>
            <span class="text-zinc-500 font-mono text-sm">/month</span>
          </div>
        </div>
        <p class="text-zinc-400 font-mono text-sm mb-6">
          Everything. No tiers. No upsells.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            Unlimited streaming
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            High quality audio
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            See where your money goes
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            70% to artists you listen to
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            No ads. No algorithm. No pool.
          </li>
        </ul>
        <button
          class="w-full px-4 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
          :disabled="loading"
          @click="handleSubscribe"
        >
          {{ isSubscribed ? 'Already Subscribed' : user ? 'Start Free Trial' : 'Start Listening' }}
        </button>
      </div>

      <!-- Artist Tier -->
      <div class="bg-zinc-950 border-2 border-zinc-800 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
        <div class="mb-6 border-b-2 border-zinc-800 pb-4">
          <h3 class="text-lg font-black uppercase tracking-tight text-fuchsia-500 mb-2">ARTIST</h3>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-black text-white tracking-tighter">Free</span>
            <span class="text-zinc-500 font-mono text-sm">forever</span>
          </div>
        </div>
        <p class="text-zinc-400 font-mono text-sm mb-6">
          Upload. Get paid. That's it.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            Unlimited uploads
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            70% of your fans' money
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            Transparent stats
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            Monthly payouts
          </li>
          <li class="flex items-center gap-2 text-zinc-300 font-mono text-sm">
            <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500" />
            You keep your rights
          </li>
        </ul>
        <NuxtLink
          to="/dashboard/artist/new"
          class="block text-center px-4 py-3 border-2 border-fuchsia-500 text-fuchsia-500 font-bold uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
        >
          Start uploading
        </NuxtLink>
      </div>
    </div>

    <!-- How Payment Works -->
    <div class="max-w-4xl mx-auto mb-16">
      <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-8 border-b-2 border-zinc-800 pb-4">WHERE YOUR $9.99 GOES</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <span class="text-xl font-black text-fuchsia-500">$6.99</span>
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">70% TO ARTISTS</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Split between the artists you actually listened to. Your money, your artists.
          </p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 border-2 border-zinc-600 flex items-center justify-center">
            <span class="text-xl font-black text-white">$1.50</span>
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">15% TO ROYALTIES</h3>
          <p class="text-zinc-400 font-mono text-sm">
            To PROs (ASCAP, BMI, GEMA, SUISA). Songwriters get paid.
          </p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 border-2 border-zinc-600 flex items-center justify-center">
            <span class="text-xl font-black text-white">$1.50</span>
          </div>
          <h3 class="font-black uppercase tracking-tight text-white mb-2">15% PLATFORM</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Servers, bandwidth, payment processing. No investors. Just costs.
          </p>
        </div>
      </div>
    </div>

    <!-- Comparison -->
    <div class="max-w-3xl mx-auto mb-16">
      <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-8 border-b-2 border-zinc-800 pb-4">THE DIFFERENCE</h2>
      <div class="bg-zinc-950 border-2 border-zinc-800 overflow-hidden shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
        <table class="w-full">
          <thead>
            <tr class="border-b-2 border-zinc-800">
              <th class="text-left p-4 text-zinc-400 font-mono text-sm uppercase"></th>
              <th class="text-center p-4 text-fuchsia-500 font-black uppercase">Fairtune</th>
              <th class="text-center p-4 text-zinc-500 font-mono text-sm uppercase">Big streaming</th>
            </tr>
          </thead>
          <tbody class="divide-y-2 divide-zinc-800">
            <tr>
              <td class="p-4 text-zinc-300 font-mono text-sm">Direct to artist</td>
              <td class="p-4 text-center text-fuchsia-500 font-black">70%</td>
              <td class="p-4 text-center text-zinc-500 font-mono text-sm">~30% (after labels)</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300 font-mono text-sm">Your money goes to</td>
              <td class="p-4 text-center text-fuchsia-500 font-bold text-sm">Artists you listen to</td>
              <td class="p-4 text-center text-zinc-500 font-mono text-sm">A pool (mostly Drake)</td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300 font-mono text-sm">See where it goes</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500 mx-auto" />
              </td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-zinc-600 mx-auto" />
              </td>
            </tr>
            <tr>
              <td class="p-4 text-zinc-300 font-mono text-sm">Independent only</td>
              <td class="p-4 text-center">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-fuchsia-500 mx-auto" />
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
      <h2 class="text-2xl font-black uppercase tracking-tighter text-white text-center mb-8 border-b-2 border-zinc-800 pb-4">FAQ</h2>
      <UAccordion :items="faqItems" />
    </div>

    <!-- Subscription Modal -->
    <SubscriptionModal
      v-model="showSubscriptionModal"
      :price-id="LISTENER_PRICE_ID"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist'
})

const user = useSupabaseUser()
const subscriptionStore = useSubscriptionStore()
const { isSubscribed, loading } = subscriptionStore
const toast = useToast()

useHead({
  title: 'Pricing | Fairtune',
  meta: [
    { name: 'description', content: '$9.99/month. 70% to artists. 15% to royalties. 15% platform. We show you every cent.' },
  ],
})

const LISTENER_PRICE_ID = 'price_1SolWZDpO91TMxctZrzuoJ0v'
const showSubscriptionModal = ref(false)

const handleSubscribe = () => {
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

  showSubscriptionModal.value = true
}

const faqItems = [
  {
    label: 'How does the artist payment work?',
    content: 'Unlike traditional streaming services that use a royalty pool, your subscription is divided based on your actual listening. If you spend 50% of your listening time on one artist, they receive 50% of the artist share.',
  },
  {
    label: 'Do you pay royalties on every stream?',
    content: 'Yes! Every stream from a paying subscriber generates revenue for both artists and royalty societies. Our free tier only offers 30-second previews, ensuring all full-length plays are properly compensated.',
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
]
</script>
