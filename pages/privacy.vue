<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Privacy Policy</h1>
      <p class="text-zinc-500 mb-8">Last updated: January 2026</p>

      <div class="prose prose-invert prose-zinc max-w-none">
        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">1. Introduction</h2>
          <p class="text-zinc-400 mb-4">
            Indiestream ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our music streaming service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">2. Information We Collect</h2>

          <h3 class="text-lg font-medium text-zinc-200 mb-3">Information You Provide</h3>
          <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
            <li>Account information (email, password, display name)</li>
            <li>Profile information (bio, avatar, location)</li>
            <li>Payment information (processed securely by Stripe)</li>
            <li>Content you upload (music, artwork, descriptions)</li>
          </ul>

          <h3 class="text-lg font-medium text-zinc-200 mb-3">Information We Collect Automatically</h3>
          <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4">
            <li>Listening history and streaming data</li>
            <li>Device information and browser type</li>
            <li>IP address and approximate location</li>
            <li>Usage patterns and preferences</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">3. How We Use Your Information</h2>
          <p class="text-zinc-400 mb-4">We use your information to:</p>
          <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4">
            <li>Provide and improve our streaming service</li>
            <li>Calculate and distribute payments to artists</li>
            <li>Personalize your listening experience</li>
            <li>Send you important service updates</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">4. Revenue Distribution</h2>
          <p class="text-zinc-400 mb-4">
            We track your listening history to fairly distribute subscription revenue to artists. This data is used to calculate how much of your subscription goes to each artist you listen to. Artists can see aggregate listening statistics but cannot identify individual listeners.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">5. Information Sharing</h2>
          <p class="text-zinc-400 mb-4">We share your information only in the following circumstances:</p>
          <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4">
            <li><strong class="text-zinc-300">Service Providers:</strong> With companies that help us operate (hosting, payments, analytics)</li>
            <li><strong class="text-zinc-300">Artists:</strong> Aggregate listening statistics (not personal data)</li>
            <li><strong class="text-zinc-300">Legal Requirements:</strong> When required by law or to protect rights</li>
            <li><strong class="text-zinc-300">Business Transfers:</strong> In case of merger or acquisition</li>
          </ul>
          <p class="text-zinc-400 mt-4">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">6. Data Storage and Security</h2>
          <p class="text-zinc-400 mb-4">
            We use industry-standard security measures to protect your data. Your information is stored on secure servers and encrypted in transit. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">7. Your Rights</h2>
          <p class="text-zinc-400 mb-4">You have the right to:</p>
          <ul class="list-disc list-inside text-zinc-400 space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">8. Cookies</h2>
          <p class="text-zinc-400 mb-4">
            We use essential cookies to keep you logged in and remember your preferences. We may also use analytics cookies to understand how you use our service. You can control cookie settings in your browser.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">9. Children's Privacy</h2>
          <p class="text-zinc-400 mb-4">
            Indiestream is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">10. International Users</h2>
          <p class="text-zinc-400 mb-4">
            If you are accessing our service from outside the United States, please be aware that your information may be transferred to and processed in the United States.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">11. Changes to This Policy</h2>
          <p class="text-zinc-400 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the Service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">12. Contact Us</h2>
          <p class="text-zinc-400">
            If you have questions about this Privacy Policy, please contact us at
            <NuxtLink to="/contact" class="text-violet-400 hover:text-violet-300">our contact page</NuxtLink>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy | Indiestream',
  meta: [
    { name: 'description', content: 'Privacy Policy for Indiestream music streaming platform. Learn how we collect, use, and protect your data.' },
  ],
})
</script>
