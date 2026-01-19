<template>
  <div v-if="band" class="container mx-auto px-4 py-8">
    <!-- Pending Approval Banner -->
    <div v-if="band.status === 'pending'" class="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 class="font-semibold text-orange-200">Profile Pending Approval</h3>
          <p class="text-sm text-orange-200/80 mt-1">
            Your artist profile is being reviewed by our team. You'll receive a notification once it's approved.
            Until then, your profile won't be visible to other users and you won't be able to upload music.
          </p>
        </div>
      </div>
    </div>

    <!-- Suspended Banner -->
    <div v-if="band.status === 'suspended'" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 class="font-semibold text-red-200">Profile Suspended</h3>
          <p class="text-sm text-red-200/80 mt-1">
            Your artist profile has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-16 h-16 rounded-xl overflow-hidden shrink-0"
            :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
          >
            <img
              v-if="band.avatar_url"
              :src="band.avatar_url"
              :alt="band.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-2xl font-bold text-white">
                {{ band.name.charAt(0).toUpperCase() }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-zinc-100">{{ band.name }}</h1>
              <UBadge v-if="band.status === 'pending'" color="orange" variant="subtle" size="xs">
                Pending
              </UBadge>
              <UIcon
                v-if="band.is_verified"
                name="i-heroicons-check-badge"
                class="w-6 h-6 text-violet-400"
              />
            </div>
            <NuxtLink
              v-if="band.status === 'active'"
              :to="`/${band.slug}`"
              class="text-sm text-violet-400 hover:text-violet-300"
              target="_blank"
            >
              fairstream.fm/{{ band.slug }}
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 inline" />
            </NuxtLink>
            <span v-else class="text-sm text-zinc-500">
              fairstream.fm/{{ band.slug }} (not visible until approved)
            </span>
          </div>
        </div>
      </div>

      <UButton
        color="violet"
        :to="band.status === 'active' ? '/dashboard/artist/upload' : undefined"
        :disabled="band.status !== 'active'"
        :title="band.status !== 'active' ? 'You can upload music once your profile is approved' : ''"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Upload Music
      </UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(band.total_streams) }}</p>
          <p class="text-sm text-zinc-400">Total Streams</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-teal-400">${{ (band.total_earnings_cents / 100).toFixed(2) }}</p>
          <p class="text-sm text-zinc-400">Total Earnings</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ albums.length }}</p>
          <p class="text-sm text-zinc-400">Releases</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">{{ formatNumber(band.follower_count || 0) }}</p>
          <p class="text-sm text-zinc-400">Followers</p>
        </div>
      </UCard>
    </div>

    <!-- Tabs -->
    <PillTabs v-model="currentTab" :tabs="tabs">
      <template #releases>
          <div v-if="albums.length === 0" class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-violet-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100 mb-2">No releases yet</h3>
            <p v-if="band?.status === 'active'" class="text-zinc-400 mb-6">Upload your first album or single to get started.</p>
            <p v-else class="text-zinc-400 mb-6">Once your profile is approved, you'll be able to upload music here.</p>
            <UButton
              color="violet"
              :to="band?.status === 'active' ? '/dashboard/artist/upload' : undefined"
              :disabled="band?.status !== 'active'"
            >
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Upload Music
            </UButton>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="album in albums"
              :key="album.id"
              class="group relative"
            >
              <!-- Draft Badge -->
              <div v-if="!album.is_published" class="absolute top-2 left-2 z-10">
                <UBadge color="amber" variant="solid" size="xs">
                  <UIcon name="i-heroicons-pencil" class="w-3 h-3 mr-1" />
                  Draft
                </UBadge>
              </div>

              <!-- Album Link -->
              <NuxtLink
                :to="album.is_published ? `/${band?.slug}/${album.slug}` : undefined"
                :class="{ 'cursor-default': !album.is_published }"
              >
                <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img
                    v-if="albumCovers[album.id]"
                    :src="albumCovers[album.id]"
                    :alt="album.title"
                    class="w-full h-full object-cover"
                    :class="{ 'opacity-60': !album.is_published }"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
                  </div>
                </div>
                <h3 class="font-medium text-zinc-100 truncate" :class="{ 'group-hover:text-violet-400': album.is_published }">
                  {{ album.title }}
                </h3>
                <p class="text-sm text-zinc-400">
                  {{ album.release_type === 'ep' ? 'EP' : album.release_type === 'single' ? 'Single' : 'Album' }}
                  · {{ album.tracks?.length || 0 }} tracks
                </p>
              </NuxtLink>

              <!-- Album Actions -->
              <div class="mt-2 flex gap-2">
                <UButton color="gray" variant="ghost" size="xs" @click="openEditAlbum(album)">
                  <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                  Edit
                </UButton>
                <UButton color="red" variant="ghost" size="xs" @click="confirmDeleteAlbum(album)">
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  Delete
                </UButton>
              </div>
            </div>
          </div>
      </template>

      <!-- Analytics Tab -->
      <template #analytics>
        <div class="py-6 space-y-6">
          <!-- Time Period Filter -->
          <div class="flex gap-2">
            <UButton
              v-for="period in analyticsPeriods"
              :key="period.value"
              :color="selectedAnalyticsPeriod === period.value ? 'violet' : 'gray'"
              :variant="selectedAnalyticsPeriod === period.value ? 'solid' : 'ghost'"
              size="sm"
              @click="selectedAnalyticsPeriod = period.value"
            >
              {{ period.label }}
            </UButton>
          </div>

          <!-- Loading -->
          <div v-if="analyticsLoading" class="flex items-center justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
          </div>

          <template v-else>
            <!-- Empty State -->
            <div v-if="analytics.totalStreams === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No streams yet. Share your music to start getting plays!</p>
            </div>

            <template v-else>
              <!-- Stats Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <div class="text-center">
                    <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(analytics.totalStreams) }}</p>
                    <p class="text-sm text-zinc-400">Total Streams</p>
                  </div>
                </UCard>
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <div class="text-center">
                    <p class="text-3xl font-bold text-violet-400">{{ formatNumber(analytics.uniqueListeners) }}</p>
                    <p class="text-sm text-zinc-400">Unique Listeners</p>
                  </div>
                </UCard>
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <div class="text-center">
                    <p class="text-3xl font-bold text-teal-400">{{ formatListeningTime(analytics.totalSeconds) }}</p>
                    <p class="text-sm text-zinc-400">Listening Time</p>
                  </div>
                </UCard>
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <div class="text-center">
                    <p class="text-3xl font-bold text-fuchsia-400">{{ analytics.completionRate }}%</p>
                    <p class="text-sm text-zinc-400">Completion Rate</p>
                  </div>
                </UCard>
              </div>

              <!-- Charts Row -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Streams Over Time -->
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <template #header>
                    <h3 class="text-lg font-semibold text-zinc-100">Streams Over Time</h3>
                  </template>
                  <div class="h-48">
                    <div class="flex items-end justify-between h-full gap-1">
                      <div
                        v-for="(day, index) in analytics.streamsByDay"
                        :key="index"
                        class="flex-1 bg-violet-500/80 rounded-t transition-all hover:bg-violet-400"
                        :style="{ height: `${getBarHeight(day.count)}%` }"
                        :title="`${day.date}: ${day.count} streams`"
                      />
                    </div>
                    <div class="flex justify-between mt-2 text-xs text-zinc-500">
                      <span>{{ analytics.streamsByDay[0]?.date || '' }}</span>
                      <span>{{ analytics.streamsByDay[analytics.streamsByDay.length - 1]?.date || '' }}</span>
                    </div>
                  </div>
                </UCard>

                <!-- Top Tracks -->
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <template #header>
                    <h3 class="text-lg font-semibold text-zinc-100">Top Tracks</h3>
                  </template>
                  <div v-if="analytics.topTracks.length === 0" class="text-center py-8 text-zinc-500">
                    No track data yet
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="(track, index) in analytics.topTracks"
                      :key="track.track_id"
                      class="flex items-center gap-3"
                    >
                      <span class="text-lg font-bold text-zinc-500 w-6">{{ index + 1 }}</span>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-zinc-100 truncate">{{ track.title }}</p>
                        <div class="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                          <div
                            class="bg-violet-500 h-1.5 rounded-full"
                            :style="{ width: `${getTrackBarWidth(track.play_count)}%` }"
                          />
                        </div>
                      </div>
                      <span class="text-sm text-zinc-400">{{ track.play_count }}</span>
                    </div>
                  </div>
                </UCard>
              </div>

              <!-- Charts Row 2: Album Performance & Listener Locations -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Albums -->
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <template #header>
                    <h3 class="text-lg font-semibold text-zinc-100">Album Performance</h3>
                  </template>
                  <div v-if="analytics.albumStats.length === 0" class="text-center py-8 text-zinc-500">
                    No album data yet
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="album in analytics.albumStats.slice(0, 5)"
                      :key="album.album_id"
                      class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div class="w-12 h-12 rounded-lg bg-zinc-700 shrink-0 overflow-hidden">
                        <img
                          v-if="albumCovers[album.album_id]"
                          :src="albumCovers[album.album_id]"
                          :alt="album.title"
                          class="w-full h-full object-cover"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center">
                          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-500" />
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-zinc-100 truncate">{{ album.title }}</p>
                        <div class="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                          <div
                            class="bg-fuchsia-500 h-1.5 rounded-full"
                            :style="{ width: `${getAlbumBarWidth(album.stream_count)}%` }"
                          />
                        </div>
                      </div>
                      <span class="text-sm text-zinc-400">{{ album.stream_count }}</span>
                    </div>
                  </div>
                </UCard>

                <!-- Listener Locations -->
                <UCard class="bg-zinc-900/50 border-zinc-800">
                  <template #header>
                    <h3 class="text-lg font-semibold text-zinc-100">Listener Locations</h3>
                  </template>
                  <div v-if="countryAnalyticsLoading" class="flex items-center justify-center py-8">
                    <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
                  </div>
                  <div v-else-if="countryAnalytics.length === 0" class="text-center py-8 text-zinc-500">
                    <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No location data yet</p>
                    <p class="text-xs mt-1">Location tracking requires recent streams</p>
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="country in countryAnalytics.slice(0, 8)"
                      :key="country.country_code"
                      class="flex items-center gap-3"
                    >
                      <span class="text-xl">{{ getCountryFlag(country.country_code) }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-sm font-medium text-zinc-100">{{ getCountryName(country.country_code) }}</span>
                          <span class="text-xs text-zinc-400">{{ country.stream_count }} streams</span>
                        </div>
                        <div class="w-full bg-zinc-800 rounded-full h-1.5">
                          <div
                            class="bg-teal-500 h-1.5 rounded-full"
                            :style="{ width: `${getCountryBarWidth(country.stream_count)}%` }"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>

            </template>
          </template>
        </div>
      </template>

      <!-- Earnings Tab -->
      <template #earnings>
        <div class="py-6 space-y-6">
          <!-- Loading -->
          <div v-if="earningsLoading" class="flex justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
          </div>

          <template v-else>
            <!-- Payout Settings Link -->
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/20">
                    <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-zinc-100">Payout Settings</h3>
                    <p class="text-sm text-zinc-400">
                      Manage your Stripe account and view combined earnings across all your artists.
                    </p>
                  </div>
                </div>
                <UButton color="violet" variant="outline" to="/dashboard/earnings">
                  <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 mr-1" />
                  View All Earnings
                </UButton>
              </div>
            </UCard>

            <!-- Earnings Summary -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <UCard class="bg-zinc-900/50 border-zinc-800">
                <div class="text-center">
                  <p class="text-2xl font-bold text-teal-400">{{ formatCurrency(earningsData?.currentBalance || 0) }}</p>
                  <p class="text-sm text-zinc-400">Current Balance</p>
                </div>
              </UCard>
              <UCard class="bg-zinc-900/50 border-zinc-800">
                <div class="text-center">
                  <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(earningsData?.thisMonthEarnings || 0) }}</p>
                  <p class="text-sm text-zinc-400">This Month</p>
                </div>
              </UCard>
              <UCard class="bg-zinc-900/50 border-zinc-800">
                <div class="text-center">
                  <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(earningsData?.lifetimeEarnings || 0) }}</p>
                  <p class="text-sm text-zinc-400">Lifetime Earnings</p>
                </div>
              </UCard>
              <UCard class="bg-zinc-900/50 border-zinc-800">
                <div class="text-center">
                  <p class="text-2xl font-bold text-violet-400">{{ formatNumber(earningsData?.thisMonthStreams || 0) }}</p>
                  <p class="text-sm text-zinc-400">Streams This Month</p>
                </div>
              </UCard>
            </div>

            <!-- Payout Info -->
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-zinc-100 mb-1">Minimum Payout: $10.00</h3>
                  <p class="text-sm text-zinc-400">
                    Payouts are processed monthly for balances over $10. Your current balance:
                    <span class="text-teal-400 font-medium">{{ formatCurrency(earningsData?.currentBalance || 0) }}</span>
                  </p>
                </div>
                <div v-if="earningsData?.lastPayoutAt" class="text-right">
                  <p class="text-xs text-zinc-500">Last payout</p>
                  <p class="text-sm text-zinc-400">{{ formatDate(earningsData.lastPayoutAt) }}</p>
                </div>
              </div>
            </UCard>

            <!-- Payout History -->
            <div>
              <h3 class="text-lg font-semibold text-zinc-100 mb-4">Payout History</h3>
              <UCard class="bg-zinc-900/50 border-zinc-800">
                <div v-if="!earningsData?.payouts?.length" class="text-center py-8">
                  <UIcon name="i-heroicons-banknotes" class="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p class="text-zinc-400">No payouts yet</p>
                  <p class="text-sm text-zinc-500">Once your balance reaches $10, payouts will appear here.</p>
                </div>
                <div v-else class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-zinc-800">
                        <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                        <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Amount</th>
                        <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                        <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Transfer ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="payout in earningsData.payouts" :key="payout.id" class="border-b border-zinc-800/50">
                        <td class="py-3 px-4 text-sm text-zinc-300">{{ formatDate(payout.createdAt) }}</td>
                        <td class="py-3 px-4 text-sm text-teal-400 font-medium">{{ formatCurrency(payout.amount) }}</td>
                        <td class="py-3 px-4">
                          <UBadge
                            :color="payout.status === 'completed' ? 'green' : payout.status === 'failed' ? 'red' : 'yellow'"
                            variant="subtle"
                          >
                            {{ payout.status }}
                          </UBadge>
                        </td>
                        <td class="py-3 px-4 text-sm text-zinc-500 font-mono">
                          {{ payout.stripeTransferId || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </UCard>
            </div>

            <!-- Revenue Model Explanation -->
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <h3 class="font-semibold text-zinc-100 mb-3">How You Get Paid</h3>
              <div class="space-y-2 text-sm text-zinc-400">
                <p>
                  <span class="text-violet-400 font-medium">User-Centric Payouts:</span>
                  Each subscriber's $9.99 monthly fee is distributed only to artists they actually listened to.
                </p>
                <p>
                  <span class="text-teal-400 font-medium">Transparent Split:</span>
                  You receive 70% directly ($6.99). 15% goes to royalty societies (SUISA/GEMA/etc.) for performance rights. 15% platform fee.
                </p>
                <p>
                  <span class="text-zinc-300 font-medium">Example:</span>
                  If a subscriber spends 50% of their listening time on your music, you receive 50% of $6.99 (~$3.50) from that subscriber.
                </p>
              </div>
            </UCard>
          </template>
        </div>
      </template>

      <!-- Settings Tab -->
      <template #settings>
        <div class="py-6 max-w-2xl">
          <form @submit.prevent="saveSettings" class="space-y-6">
            <!-- Banner Upload -->
            <UFormGroup label="Banner Image">
              <div class="space-y-3">
                <!-- Preview -->
                <div
                  class="w-full h-32 md:h-40 rounded-xl overflow-hidden"
                  :style="{ background: bannerPreview || band?.banner_url ? 'transparent' : `linear-gradient(135deg, ${editForm.theme_color}40 0%, #09090b 100%)` }"
                >
                  <img
                    v-if="bannerPreview || band?.banner_url"
                    :src="bannerPreview || band?.banner_url || ''"
                    alt="Artist banner"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <div class="text-center text-zinc-500">
                      <UIcon name="i-heroicons-photo" class="w-8 h-8 mx-auto mb-2" />
                      <p class="text-sm">No banner image</p>
                    </div>
                  </div>
                </div>

                <!-- Upload Button -->
                <div>
                  <input
                    ref="bannerInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="hidden"
                    @change="handleBannerSelect"
                  />
                  <UButton
                    color="gray"
                    variant="outline"
                    :loading="uploadingBanner"
                    :disabled="saving"
                    @click="bannerInput?.click()"
                  >
                    <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-2" />
                    {{ band?.banner_url ? 'Change Banner' : 'Upload Banner' }}
                  </UButton>
                  <p class="text-xs text-zinc-500 mt-2">
                    Recommended: Wide image (16:9), at least 1920x1080px. JPG, PNG, or WebP.
                  </p>
                </div>
              </div>
            </UFormGroup>

            <!-- Avatar Upload -->
            <UFormGroup label="Artist Photo">
              <div class="flex items-center gap-6">
                <!-- Preview -->
                <div
                  class="w-24 h-24 rounded-xl overflow-hidden shrink-0"
                  :style="{ background: `linear-gradient(135deg, ${editForm.theme_color} 0%, #c026d3 100%)` }"
                >
                  <img
                    v-if="avatarPreview || band?.avatar_url"
                    :src="avatarPreview || band?.avatar_url || ''"
                    alt="Artist avatar"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="text-3xl font-bold text-white">
                      {{ editForm.name?.charAt(0)?.toUpperCase() || '?' }}
                    </span>
                  </div>
                </div>

                <!-- Upload Button -->
                <div class="flex-1">
                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="hidden"
                    @change="handleAvatarSelect"
                  />
                  <UButton
                    color="gray"
                    variant="outline"
                    :loading="uploadingAvatar"
                    :disabled="saving"
                    @click="avatarInput?.click()"
                  >
                    <UIcon name="i-heroicons-camera" class="w-4 h-4 mr-2" />
                    {{ band?.avatar_url ? 'Change Photo' : 'Upload Photo' }}
                  </UButton>
                  <p class="text-xs text-zinc-500 mt-2">
                    Recommended: Square image, at least 400x400px. JPG, PNG, or WebP.
                  </p>
                </div>
              </div>
            </UFormGroup>

            <!-- Name -->
            <UFormGroup label="Artist / Band Name">
              <UInput v-model="editForm.name" size="lg" :disabled="saving" />
            </UFormGroup>

            <!-- Tagline -->
            <UFormGroup label="Tagline" :hint="`${editForm.tagline?.length || 0}/150 characters`">
              <UInput
                v-model="editForm.tagline"
                size="lg"
                placeholder="A brief one-liner about your sound..."
                :disabled="saving"
                :maxlength="150"
              />
            </UFormGroup>

            <!-- Bio -->
            <UFormGroup label="Bio" hint="Full bio shown in the About tab">
              <UTextarea
                v-model="editForm.bio"
                :rows="4"
                size="lg"
                placeholder="Tell your story..."
                :disabled="saving"
              />
            </UFormGroup>

            <!-- Location -->
            <UFormGroup label="Location">
              <UInput
                v-model="editForm.location"
                size="lg"
                placeholder="e.g. Berlin, Germany"
                :disabled="saving"
              />
            </UFormGroup>

            <!-- Website -->
            <UFormGroup label="Website">
              <UInput
                v-model="editForm.website"
                size="lg"
                placeholder="https://yourwebsite.com"
                :disabled="saving"
              >
                <template #leading>
                  <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-zinc-400" />
                </template>
              </UInput>
            </UFormGroup>

            <!-- Social Links Section -->
            <div class="border-t border-zinc-800 pt-6 mt-2">
              <h3 class="text-lg font-semibold text-zinc-100 mb-1">Social Links</h3>
              <p class="text-sm text-zinc-400 mb-4">Connect with your fans on other platforms</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Instagram -->
                <UFormGroup label="Instagram">
                  <UInput
                    v-model="editForm.instagram"
                    placeholder="@username or full URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-instagram" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>

                <!-- Spotify -->
                <UFormGroup label="Spotify">
                  <UInput
                    v-model="editForm.spotify"
                    placeholder="Spotify artist URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-spotify" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>

                <!-- YouTube -->
                <UFormGroup label="YouTube">
                  <UInput
                    v-model="editForm.youtube"
                    placeholder="YouTube channel URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-youtube" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>

                <!-- SoundCloud -->
                <UFormGroup label="SoundCloud">
                  <UInput
                    v-model="editForm.soundcloud"
                    placeholder="SoundCloud profile URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-soundcloud" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>

                <!-- Bandcamp -->
                <UFormGroup label="Bandcamp">
                  <UInput
                    v-model="editForm.bandcamp"
                    placeholder="Bandcamp page URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-bandcamp" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>

                <!-- Twitter/X -->
                <UFormGroup label="Twitter / X">
                  <UInput
                    v-model="editForm.twitter"
                    placeholder="@username or full URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-x" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>

                <!-- TikTok -->
                <UFormGroup label="TikTok">
                  <UInput
                    v-model="editForm.tiktok"
                    placeholder="@username or full URL"
                    size="lg"
                    :disabled="saving"
                  >
                    <template #leading>
                      <UIcon name="i-simple-icons-tiktok" class="w-4 h-4 text-zinc-400" />
                    </template>
                  </UInput>
                </UFormGroup>
              </div>
            </div>

            <!-- Genres -->
            <UFormGroup label="Genres">
              <div class="flex gap-2 mb-2">
                <UInput
                  v-model="genreInput"
                  placeholder="Add a genre..."
                  size="lg"
                  :disabled="saving || editForm.genres.length >= 5"
                  @keydown.enter.prevent="addGenre"
                />
                <UButton
                  color="gray"
                  :disabled="!genreInput.trim() || editForm.genres.length >= 5"
                  @click="addGenre"
                >
                  Add
                </UButton>
              </div>
              <div v-if="editForm.genres.length" class="flex flex-wrap gap-2">
                <UBadge
                  v-for="(genre, index) in editForm.genres"
                  :key="index"
                  color="violet"
                  variant="soft"
                  class="cursor-pointer"
                  @click="removeGenre(index)"
                >
                  {{ genre }}
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
                </UBadge>
              </div>
            </UFormGroup>

            <!-- Theme Color -->
            <UFormGroup label="Theme Color">
              <div class="flex items-center gap-3">
                <input
                  v-model="editForm.theme_color"
                  type="color"
                  class="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                  :disabled="saving"
                />
                <UInput v-model="editForm.theme_color" size="lg" class="w-32" :disabled="saving" />
              </div>
            </UFormGroup>

            <!-- Submit -->
            <div class="flex justify-between pt-4">
              <UButton
                color="red"
                variant="ghost"
                :disabled="saving"
                @click="confirmDelete"
              >
                Delete Artist Profile
              </UButton>
              <UButton
                type="submit"
                color="violet"
                :loading="saving"
              >
                Save Changes
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </PillTabs>

    <!-- Delete Artist Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Artist Profile</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ band.name }}</strong>? This will permanently delete all your releases, tracks, and analytics data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deleting" @click="handleDelete">
              Delete Forever
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Album Modal -->
    <UModal v-model="showEditAlbumModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-zinc-100">Edit Album</h3>
        </template>

        <div class="space-y-6">
          <!-- Cover Image -->
          <div class="flex gap-6">
            <div class="shrink-0">
              <div class="w-32 h-32 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                <img
                  v-if="editAlbumCoverPreview || (albumToEdit && albumCovers[albumToEdit.id])"
                  :src="editAlbumCoverPreview || (albumToEdit && albumCovers[albumToEdit.id])"
                  class="w-full h-full object-cover"
                  alt="Album cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
                </div>
              </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
              <h4 class="text-sm font-medium text-zinc-300 mb-2">Cover Image</h4>
              <p class="text-xs text-zinc-500 mb-3">Square image recommended. Will be resized to 600x600.</p>
              <input
                ref="editAlbumCoverInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleAlbumCoverSelect"
              />
              <UButton
                color="gray"
                variant="soft"
                size="sm"
                :loading="uploadingAlbumCover"
                :disabled="savingAlbum"
                @click="editAlbumCoverInput?.click()"
              >
                <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-1" />
                {{ uploadingAlbumCover ? 'Uploading...' : 'Change Cover' }}
              </UButton>
            </div>
          </div>

          <!-- Album Details -->
          <div class="space-y-4">
            <UFormGroup label="Title" required>
              <UInput
                v-model="editAlbumForm.title"
                placeholder="Album title"
                size="lg"
                :disabled="savingAlbum"
              />
            </UFormGroup>

            <UFormGroup label="Description">
              <UTextarea
                v-model="editAlbumForm.description"
                placeholder="Album description..."
                :rows="3"
                size="lg"
                :disabled="savingAlbum"
              />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Release Type">
                <USelect
                  v-model="editAlbumForm.release_type"
                  :options="releaseTypeOptions"
                  size="lg"
                  :disabled="savingAlbum"
                />
              </UFormGroup>

              <UFormGroup label="Release Date">
                <UInput
                  v-model="editAlbumForm.release_date"
                  type="date"
                  size="lg"
                  :disabled="savingAlbum"
                />
              </UFormGroup>
            </div>

            <!-- Rights Metadata -->
            <div class="border-t border-zinc-800 pt-4 mt-2">
              <h4 class="text-sm font-medium text-zinc-300 mb-3">Rights Metadata</h4>
              <div class="grid grid-cols-2 gap-4">
                <UFormGroup label="Label Name" hint="Optional">
                  <UInput
                    v-model="editAlbumForm.label_name"
                    :placeholder="band?.name || 'Self-released'"
                    size="lg"
                    :disabled="savingAlbum"
                  />
                </UFormGroup>

                <UFormGroup label="℗ Line (Sound Recording)" hint="Optional">
                  <UInput
                    v-model="editAlbumForm.p_line"
                    :placeholder="`℗ ${new Date().getFullYear()} ${editAlbumForm.label_name || band?.name || 'Label'}`"
                    size="lg"
                    :disabled="savingAlbum"
                  />
                </UFormGroup>

                <UFormGroup label="© Line (Composition)" hint="Optional">
                  <UInput
                    v-model="editAlbumForm.c_line"
                    :placeholder="`© ${new Date().getFullYear()} ${editAlbumForm.label_name || band?.name || 'Publisher'}`"
                    size="lg"
                    :disabled="savingAlbum"
                  />
                </UFormGroup>
              </div>
            </div>

            <UFormGroup label="Published">
              <UToggle
                v-model="editAlbumForm.is_published"
                :disabled="savingAlbum"
              />
              <template #help>
                <span class="text-zinc-500">{{ editAlbumForm.is_published ? 'Album is visible to the public' : 'Album is saved as a draft' }}</span>
              </template>
            </UFormGroup>
          </div>

          <!-- Tracks Section -->
          <div class="border-t border-zinc-800 pt-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-zinc-300">Tracks</h4>
              <UButton
                color="violet"
                variant="outline"
                size="xs"
                :disabled="savingAlbum"
                @click="addTrackInput?.click()"
              >
                <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
                Add Track
              </UButton>
              <input
                ref="addTrackInput"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac,audio/ogg"
                multiple
                class="hidden"
                @change="onAddTracksSelect"
              />
            </div>

            <div v-if="editAlbumTracks.length === 0" class="text-center py-4 text-zinc-500 text-sm">
              No tracks in this album
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(track, index) in editAlbumTracks"
                :key="track.id"
                class="p-3 bg-zinc-800/50 rounded-lg space-y-3 border border-zinc-700"
                :class="{ 'border-violet-500 bg-violet-500/10': dragOverEditTrackIndex === index }"
                draggable="true"
                @dragstart="onEditTrackDragStart($event, index)"
                @dragend="onEditTrackDragEnd"
                @dragover.prevent="onEditTrackDragOver(index)"
                @dragleave="onEditTrackDragLeave"
                @drop.prevent="onEditTrackDrop(index)"
              >
                <!-- Track Header Row -->
                <div class="flex items-center gap-3">
                  <!-- Drag Handle -->
                  <div class="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300">
                    <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
                  </div>

                  <!-- Track Number -->
                  <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {{ index + 1 }}
                  </div>

                  <!-- Track Title with improved UX -->
                  <div class="flex-1 min-w-0">
                    <div class="group/title relative">
                      <UInput
                        v-model="track.title"
                        placeholder="Track title"
                        size="sm"
                        class="font-semibold text-zinc-100 bg-transparent hover:bg-zinc-700/50 focus:bg-zinc-700/50 rounded-lg transition-colors"
                        :disabled="savingAlbum"
                      >
                        <template #trailing>
                          <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-zinc-500 group-hover/title:text-zinc-300 transition-colors" />
                        </template>
                      </UInput>
                    </div>
                  </div>

                  <!-- Moderation Status Badge -->
                  <UBadge
                    v-if="track.moderation_status"
                    :color="getModerationColor(track.moderation_status)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ getModerationLabel(track.moderation_status) }}
                  </UBadge>

                  <UCheckbox
                    v-model="track.is_explicit"
                    label="Explicit"
                    :disabled="savingAlbum"
                  />

                  <UCheckbox
                    v-model="track.is_cover"
                    label="Cover"
                    :disabled="savingAlbum"
                  />

                  <UButton
                    color="red"
                    variant="ghost"
                    size="xs"
                    :disabled="savingAlbum"
                    @click="confirmDeleteTrack(track)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </UButton>
                </div>

                <!-- Admin Feedback (for rejected/revision_requested tracks) -->
                <div
                  v-if="track.moderation_notes && ['rejected', 'revision_requested'].includes(track.moderation_status)"
                  class="ml-9 p-3 rounded-lg text-sm"
                  :class="track.moderation_status === 'rejected' ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'"
                >
                  <div class="flex items-start gap-2">
                    <UIcon
                      :name="track.moderation_status === 'rejected' ? 'i-heroicons-x-circle' : 'i-heroicons-exclamation-triangle'"
                      :class="track.moderation_status === 'rejected' ? 'text-red-400' : 'text-orange-400'"
                      class="w-4 h-4 mt-0.5 shrink-0"
                    />
                    <div>
                      <p :class="track.moderation_status === 'rejected' ? 'text-red-300' : 'text-orange-300'" class="font-medium">
                        {{ track.moderation_status === 'rejected' ? 'Rejection Reason:' : 'Revision Requested:' }}
                      </p>
                      <p :class="track.moderation_status === 'rejected' ? 'text-red-200/80' : 'text-orange-200/80'" class="mt-1">
                        {{ track.moderation_notes }}
                      </p>
                      <p class="text-zinc-500 text-xs mt-2">
                        Edit the track and save to resubmit for review.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- ISRC / ISWC Row -->
                <div class="flex items-center gap-3 pl-9">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-zinc-500 w-10">ISRC</span>
                      <UInput
                        v-model="track.isrc"
                        placeholder="e.g. USRC12345678"
                        size="xs"
                        class="flex-1"
                        maxlength="12"
                        :disabled="savingAlbum"
                      />
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-zinc-500 w-10">ISWC</span>
                      <UInput
                        v-model="track.iswc"
                        placeholder="e.g. T-123.456.789-0"
                        size="xs"
                        class="flex-1"
                        :disabled="savingAlbum"
                      />
                    </div>
                  </div>
                </div>

                <!-- Credits -->
                <div class="pl-12 pt-2">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-zinc-400">
                      Credits
                      <span v-if="track.credits.length > 0" class="text-zinc-500">({{ track.credits.length }})</span>
                    </span>
                    <UButton
                      color="gray"
                      variant="ghost"
                      size="xs"
                      :disabled="savingAlbum"
                      @click="track.showCredits = !track.showCredits"
                    >
                      {{ track.showCredits ? 'Hide' : 'Show' }}
                      <UIcon :name="track.showCredits ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-3 h-3 ml-1" />
                    </UButton>
                  </div>

                  <div v-if="track.showCredits" class="space-y-2">
                    <!-- Existing Credits -->
                    <div
                      v-for="(credit, creditIndex) in track.credits"
                      :key="creditIndex"
                      class="flex items-center gap-2 p-2 bg-zinc-900/50 rounded"
                    >
                      <USelect
                        v-model="credit.role"
                        :options="creditRoleOptions"
                        size="xs"
                        class="w-36"
                        :disabled="savingAlbum"
                      />
                      <UInput
                        v-model="credit.name"
                        placeholder="Name"
                        size="xs"
                        class="flex-1"
                        :disabled="savingAlbum"
                      />
                      <UInput
                        v-model="credit.ipi_number"
                        placeholder="IPI #"
                        size="xs"
                        class="w-28"
                        :disabled="savingAlbum"
                      />
                      <UButton
                        color="gray"
                        variant="ghost"
                        size="xs"
                        :disabled="savingAlbum"
                        @click="track.credits.splice(creditIndex, 1)"
                      >
                        <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                      </UButton>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-2">
                      <UButton
                        color="gray"
                        variant="dashed"
                        size="xs"
                        class="flex-1"
                        :disabled="savingAlbum"
                        @click="track.credits.push({ role: 'composer', name: '', ipi_number: '' })"
                      >
                        <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
                        Add Credit
                      </UButton>
                      <UButton
                        v-if="canCopyEditCredits(index)"
                        color="gray"
                        variant="outline"
                        size="xs"
                        :disabled="savingAlbum"
                        @click="copyEditCredits(index)"
                      >
                        <UIcon name="i-heroicons-clipboard-document" class="w-3 h-3 mr-1" />
                        Copy
                      </UButton>
                      <UButton
                        v-if="copiedEditCredits && copiedEditCredits.length > 0"
                        color="violet"
                        variant="outline"
                        size="xs"
                        :disabled="savingAlbum"
                        @click="pasteEditCredits(index)"
                      >
                        <UIcon name="i-heroicons-clipboard-document-check" class="w-3 h-3 mr-1" />
                        Paste
                      </UButton>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showEditAlbumModal = false" :disabled="savingAlbum">
              Cancel
            </UButton>
            <UButton color="violet" :loading="savingAlbum" @click="handleSaveAlbum">
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Track Confirmation Modal -->
    <UModal v-model="showDeleteTrackModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Track</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ trackToDelete?.title }}</strong>? This will permanently delete the track and its listening data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteTrackModal = false" :disabled="deletingTrack">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingTrack" @click="handleDeleteTrack">
              Delete Track
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Album Confirmation Modal -->
    <UModal v-model="showDeleteAlbumModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Album</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ albumToDelete?.title }}</strong>? This will permanently delete all tracks and listening data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteAlbumModal = false" :disabled="deletingAlbum">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingAlbum" @click="handleDeleteAlbum">
              Delete Album
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
  </div>

  <!-- Not Found -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-zinc-100 mb-2">Artist Not Found</h1>
      <p class="text-zinc-400 mb-6">This artist profile doesn't exist or you don't have access.</p>
      <UButton color="violet" to="/dashboard">
        Back to Dashboard
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'
import type { Album, Track, TrackCredit } from '~/composables/useAlbum'

// Extended track type for editing with credits
interface EditableCredit {
  id?: string
  role: 'composer' | 'author' | 'composer_author' | 'arranger' | 'interpreter' | 'producer' | 'mixing' | 'mastering' | 'publisher' | 'label' | 'cover_artist' | 'lyricist' | 'performer'
  name: string
  ipi_number: string
}

interface EditableTrack extends Omit<Track, 'credits'> {
  credits: EditableCredit[]
  showCredits: boolean
}

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const client = useSupabaseClient()
const { getBandById, updateBand, deleteBand } = useBand()
const { getBandAlbums, getStreamUrl, deleteAlbum, updateAlbum, updateTrack, deleteTrack, getCreditsForTracks, setTrackCredits, createTrack, getUploadUrl } = useAlbum()

const band = ref<Band | null>(null)
const albums = ref<Album[]>([])
const albumCovers = ref<Record<string, string>>({})
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)
const genreInput = ref('')

// Avatar upload
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const uploadingAvatar = ref(false)

// Banner upload
const bannerInput = ref<HTMLInputElement | null>(null)
const bannerPreview = ref<string | null>(null)
const uploadingBanner = ref(false)

const editForm = reactive({
  name: '',
  tagline: '',
  bio: '',
  location: '',
  website: '',
  theme_color: '#8B5CF6',
  genres: [] as string[],
  // Social links
  instagram: '',
  twitter: '',
  youtube: '',
  spotify: '',
  soundcloud: '',
  bandcamp: '',
  tiktok: '',
})

// Album edit/delete state
const showEditAlbumModal = ref(false)
const showDeleteAlbumModal = ref(false)
const savingAlbum = ref(false)
const deletingAlbum = ref(false)
const albumToEdit = ref<Album | null>(null)
const albumToDelete = ref<Album | null>(null)

const editAlbumForm = reactive({
  title: '',
  description: '',
  release_type: 'album' as 'album' | 'ep' | 'single',
  release_date: '',
  is_published: false,
  // Rights metadata
  label_name: '',
  p_line: '',
  c_line: '',
})

// Album cover edit state
const editAlbumCoverInput = ref<HTMLInputElement | null>(null)
const editAlbumCoverPreview = ref<string | null>(null)
const uploadingAlbumCover = ref(false)

// Add track state
const addTrackInput = ref<HTMLInputElement | null>(null)
const addingTracks = ref(false)

const releaseTypeOptions = [
  { label: 'Album', value: 'album' },
  { label: 'EP', value: 'ep' },
  { label: 'Single', value: 'single' },
]

// Track edit/delete state
const editAlbumTracks = ref<EditableTrack[]>([])
const showDeleteTrackModal = ref(false)

// Store original credits for comparison (to detect changes that trigger re-review)
const originalTrackCredits = ref<Record<string, string>>({})

// Credit role options (same as upload page)
const creditRoleOptions = [
  { label: 'Composer', value: 'composer' },
  { label: 'Author', value: 'author' },
  { label: 'Composer & Author', value: 'composer_author' },
  { label: 'Arranger', value: 'arranger' },
  { label: 'Interpreter', value: 'interpreter' },
  { label: 'Producer', value: 'producer' },
  { label: 'Mixing', value: 'mixing' },
  { label: 'Mastering', value: 'mastering' },
  { label: 'Publisher', value: 'publisher' },
  { label: 'Label', value: 'label' },
  { label: 'Cover Artists', value: 'cover_artist' },
]

// Track drag-and-drop reordering state
const draggedEditTrackIndex = ref<number | null>(null)
const dragOverEditTrackIndex = ref<number | null>(null)

const onEditTrackDragStart = (e: DragEvent, index: number) => {
  draggedEditTrackIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

const onEditTrackDragEnd = () => {
  draggedEditTrackIndex.value = null
  dragOverEditTrackIndex.value = null
}

const onEditTrackDragOver = (index: number) => {
  if (draggedEditTrackIndex.value !== null && draggedEditTrackIndex.value !== index) {
    dragOverEditTrackIndex.value = index
  }
}

const onEditTrackDragLeave = () => {
  dragOverEditTrackIndex.value = null
}

const onEditTrackDrop = async (targetIndex: number) => {
  if (draggedEditTrackIndex.value === null || draggedEditTrackIndex.value === targetIndex) {
    dragOverEditTrackIndex.value = null
    return
  }

  const draggedTrack = editAlbumTracks.value[draggedEditTrackIndex.value]
  editAlbumTracks.value.splice(draggedEditTrackIndex.value, 1)
  editAlbumTracks.value.splice(targetIndex, 0, draggedTrack)

  // Update track numbers
  editAlbumTracks.value.forEach((t, idx) => {
    t.track_number = idx + 1
  })

  draggedEditTrackIndex.value = null
  dragOverEditTrackIndex.value = null
}

// Copy/paste credits functionality for edit modal
const copiedEditCredits = ref<EditableCredit[] | null>(null)

const canCopyEditCredits = (trackIndex: number) => {
  const track = editAlbumTracks.value[trackIndex]
  return track.credits.length > 0 && track.credits.every(c => c.name.trim() && c.role)
}

const copyEditCredits = (trackIndex: number) => {
  const track = editAlbumTracks.value[trackIndex]
  copiedEditCredits.value = JSON.parse(JSON.stringify(track.credits))
  toast.add({ title: 'Credits copied', color: 'green', icon: 'i-heroicons-clipboard-document' })
}

const pasteEditCredits = (trackIndex: number) => {
  if (!copiedEditCredits.value) return
  const track = editAlbumTracks.value[trackIndex]
  // Append copied credits to existing ones
  for (const credit of copiedEditCredits.value) {
    track.credits.push({ ...credit, id: undefined })
  }
  track.showCredits = true
}

// Add new tracks to existing album
const onAddTracksSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0 || !albumToEdit.value || !band.value) return

  addingTracks.value = true

  try {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'))

    for (const file of audioFiles) {
      // Generate title from filename
      const title = file.name
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/^\d+[\s._-]*/, '') // Remove leading track numbers
        .replace(/[_-]/g, ' ') // Replace underscores/dashes with spaces
        .trim() || 'Untitled Track'

      // Upload the audio file
      const audioKey = `tracks/${band.value.id}/${albumToEdit.value.id}/${crypto.randomUUID()}.mp3`
      const uploadUrl = await getUploadUrl(audioKey, file.type)

      await $fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      // Create the track in the database using the composable
      const trackNumber = editAlbumTracks.value.length + 1
      const newTrack = await createTrack({
        album_id: albumToEdit.value.id,
        band_id: band.value.id,
        title,
        track_number: trackNumber,
        duration_seconds: 0, // Will be updated when processed
        is_explicit: false,
        is_cover: false,
      })

      // Update track with audio key
      await updateTrack(newTrack.id, { audio_key: audioKey })

      // Add to local state
      editAlbumTracks.value.push({
        ...newTrack,
        audio_key: audioKey,
        credits: [],
        showCredits: false,
      } as EditableTrack)
    }

    toast.add({
      title: `${audioFiles.length} track${audioFiles.length > 1 ? 's' : ''} added`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to add tracks:', e)
    toast.add({
      title: 'Failed to add tracks',
      description: e.data?.message || e.message || 'An error occurred',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    addingTracks.value = false
    // Reset input
    if (addTrackInput.value) {
      addTrackInput.value.value = ''
    }
  }
}

// Moderation status helpers
const getModerationColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'pending': return 'yellow'
    case 'rejected': return 'red'
    case 'revision_requested': return 'orange'
    default: return 'gray'
  }
}

const getModerationLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'Approved'
    case 'pending': return 'Pending Review'
    case 'rejected': return 'Rejected'
    case 'revision_requested': return 'Revision Requested'
    default: return status
  }
}
const deletingTrack = ref(false)
const trackToDelete = ref<EditableTrack | null>(null)

// Analytics state
interface AnalyticsData {
  totalStreams: number
  uniqueListeners: number
  totalSeconds: number
  completionRate: number
  topTracks: { track_id: string; title: string; play_count: number }[]
  albumStats: { album_id: string; title: string; stream_count: number }[]
  streamsByDay: { date: string; count: number }[]
}

interface CountryData {
  country_code: string
  stream_count: number
  total_duration: number
}

const analyticsLoading = ref(false)
const countryAnalyticsLoading = ref(false)
const countryAnalytics = ref<CountryData[]>([])
const selectedAnalyticsPeriod = ref('30d')
const analyticsPeriods = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]

const analytics = ref<AnalyticsData>({
  totalStreams: 0,
  uniqueListeners: 0,
  totalSeconds: 0,
  completionRate: 0,
  topTracks: [],
  albumStats: [],
  streamsByDay: [],
})

// Earnings state
interface EarningsData {
  bandId: string
  bandName: string
  stripeStatus: string
  stripeAccountId: string | null
  currentBalance: number
  lifetimeEarnings: number
  lastPayoutAt: string | null
  thisMonthEarnings: number
  thisMonthStreams: number
  minimumPayout: number
  canRequestPayout: boolean
  payouts: Array<{
    id: string
    amount: number
    status: string
    stripeTransferId: string | null
    createdAt: string
    processedAt: string | null
  }>
  earningsByPeriod: Array<{
    id: string
    streamCount: number
    listeningSeconds: number
    grossEarnings: number
    netEarnings: number
    payoutStatus: string
    createdAt: string
    periodStart: string | null
    periodEnd: string | null
  }>
}

const earningsLoading = ref(false)
const earningsData = ref<EarningsData | null>(null)

const tabs = [
  { label: 'Releases', slot: 'releases', icon: 'i-heroicons-musical-note' },
  { label: 'Analytics', slot: 'analytics', icon: 'i-heroicons-chart-bar' },
  { label: 'Earnings', slot: 'earnings', icon: 'i-heroicons-banknotes' },
  { label: 'Settings', slot: 'settings', icon: 'i-heroicons-cog-6-tooth' },
]

// Tab state synced with URL
const currentTab = ref(0)

// Map tab slot names to indices
const tabSlotToIndex: Record<string, number> = {
  'releases': 0,
  'analytics': 1,
  'earnings': 2,
  'settings': 3,
}

// Watch for tab changes and update URL
watch(currentTab, (newTab) => {
  const tabName = tabs[newTab]?.slot
  if (tabName && route.query.tab !== tabName) {
    router.replace({ query: { ...route.query, tab: tabName } })
  }
})

// Initialize tab from URL (called in main onMounted)
const initTabFromUrl = () => {
  const tabParam = route.query.tab as string
  if (tabParam && tabSlotToIndex[tabParam] !== undefined) {
    currentTab.value = tabSlotToIndex[tabParam]
  }
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatListeningTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getBarHeight = (count: number): number => {
  const maxCount = Math.max(...analytics.value.streamsByDay.map(d => d.count), 1)
  return Math.max((count / maxCount) * 100, 2)
}

const getTrackBarWidth = (playCount: number): number => {
  const maxCount = Math.max(...analytics.value.topTracks.map(t => t.play_count), 1)
  return (playCount / maxCount) * 100
}

const getAlbumBarWidth = (streamCount: number): number => {
  const maxCount = Math.max(...analytics.value.albumStats.map(a => a.stream_count), 1)
  return (streamCount / maxCount) * 100
}

const getCountryBarWidth = (streamCount: number): number => {
  const maxCount = Math.max(...countryAnalytics.value.map(c => c.stream_count), 1)
  return (streamCount / maxCount) * 100
}

// Country code to flag emoji
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  // XX is used for unknown locations
  if (countryCode.toUpperCase() === 'XX') return '🌍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Country code to name (common countries)
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CH: 'Switzerland',
  AT: 'Austria',
  CA: 'Canada',
  AU: 'Australia',
  NL: 'Netherlands',
  BE: 'Belgium',
  IT: 'Italy',
  ES: 'Spain',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  MX: 'Mexico',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  IE: 'Ireland',
  NZ: 'New Zealand',
  PT: 'Portugal',
  CZ: 'Czech Republic',
  RU: 'Russia',
  IN: 'India',
  CN: 'China',
  ZA: 'South Africa',
  AR: 'Argentina',
  XX: 'Unknown',
}

const getCountryName = (countryCode: string): string => {
  return countryNames[countryCode?.toUpperCase()] || countryCode || 'Unknown'
}

// Load country analytics
const loadCountryAnalytics = async () => {
  if (!band.value) return

  countryAnalyticsLoading.value = true
  try {
    const days = selectedAnalyticsPeriod.value === '7d' ? 7
      : selectedAnalyticsPeriod.value === '30d' ? 30
      : selectedAnalyticsPeriod.value === '90d' ? 90
      : 365 * 10 // "all time" = 10 years

    const data = await $fetch<CountryData[]>('/api/analytics/countries', {
      query: {
        bandId: band.value.id,
        days,
      },
    })
    countryAnalytics.value = data || []
  } catch (e) {
    console.error('Failed to load country analytics:', e)
    countryAnalytics.value = []
  } finally {
    countryAnalyticsLoading.value = false
  }
}

const getAnalyticsPeriodStart = (): string | null => {
  const now = new Date()
  switch (selectedAnalyticsPeriod.value) {
    case '7d':
      const week = new Date(now)
      week.setDate(week.getDate() - 7)
      return week.toISOString()
    case '30d':
      const month = new Date(now)
      month.setDate(month.getDate() - 30)
      return month.toISOString()
    case '90d':
      const quarter = new Date(now)
      quarter.setDate(quarter.getDate() - 90)
      return quarter.toISOString()
    default:
      return null
  }
}

// Load earnings data
const loadEarnings = async () => {
  if (!band.value) return

  earningsLoading.value = true
  try {
    const data = await $fetch<EarningsData>('/api/artist/earnings', {
      query: { bandId: band.value.id },
    })
    earningsData.value = data
  } catch (e) {
    console.error('Failed to load earnings:', e)
  } finally {
    earningsLoading.value = false
  }
}


const loadAnalytics = async () => {
  if (!band.value) return

  analyticsLoading.value = true

  try {
    const periodStart = getAnalyticsPeriodStart()

    // Query listening history for this band
    let query = client
      .from('listening_history')
      .select(`
        id,
        user_id,
        track_id,
        duration_seconds,
        completed,
        listened_at,
        tracks!inner (
          id,
          title,
          album_id,
          albums!inner (
            id,
            title,
            band_id
          )
        )
      `)
      .eq('band_id', band.value.id)

    if (periodStart) {
      query = query.gte('listened_at', periodStart)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to load analytics:', error)
      return
    }

    if (!data || data.length === 0) {
      analytics.value = {
        totalStreams: 0,
        uniqueListeners: 0,
        totalSeconds: 0,
        completionRate: 0,
        topTracks: [],
        albumStats: [],
        streamsByDay: [],
      }
      return
    }

    // Calculate stats
    const completedStreams = data.filter(d => d.completed)
    analytics.value.totalStreams = completedStreams.length
    analytics.value.uniqueListeners = new Set(data.map(d => d.user_id)).size
    analytics.value.totalSeconds = data.reduce((sum, d) => sum + (d.duration_seconds || 0), 0)
    analytics.value.completionRate = data.length > 0
      ? Math.round((completedStreams.length / data.length) * 100)
      : 0

    // Top tracks
    const trackCounts = new Map<string, { title: string; count: number }>()
    for (const item of data) {
      const trackId = item.track_id
      const title = (item.tracks as any)?.title || 'Unknown'
      const existing = trackCounts.get(trackId)
      if (existing) {
        existing.count++
      } else {
        trackCounts.set(trackId, { title, count: 1 })
      }
    }
    analytics.value.topTracks = Array.from(trackCounts.entries())
      .map(([track_id, { title, count }]) => ({ track_id, title, play_count: count }))
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 5)

    // Album stats
    const albumCounts = new Map<string, { title: string; count: number }>()
    for (const item of data) {
      const albumId = (item.tracks as any)?.album_id
      const title = (item.tracks as any)?.albums?.title || 'Unknown'
      if (albumId) {
        const existing = albumCounts.get(albumId)
        if (existing) {
          existing.count++
        } else {
          albumCounts.set(albumId, { title, count: 1 })
        }
      }
    }
    analytics.value.albumStats = Array.from(albumCounts.entries())
      .map(([album_id, { title, count }]) => ({ album_id, title, stream_count: count }))
      .sort((a, b) => b.stream_count - a.stream_count)

    // Streams by day
    const dayMap = new Map<string, number>()
    const daysToShow = selectedAnalyticsPeriod.value === '7d' ? 7 : selectedAnalyticsPeriod.value === '30d' ? 30 : 90

    // Initialize all days with 0
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dayMap.set(dateStr, 0)
    }

    // Count streams per day
    for (const item of data) {
      if (item.completed) {
        const dateStr = item.listened_at.split('T')[0]
        if (dayMap.has(dateStr)) {
          dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1)
        }
      }
    }

    analytics.value.streamsByDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }))
  } catch (e) {
    console.error('Failed to load analytics:', e)
  } finally {
    analyticsLoading.value = false
  }
}

// Watch for period changes
watch(selectedAnalyticsPeriod, () => {
  loadAnalytics()
  loadCountryAnalytics()
})

const addGenre = () => {
  const genre = genreInput.value.trim()
  if (genre && editForm.genres.length < 5 && !editForm.genres.includes(genre)) {
    editForm.genres.push(genre)
    genreInput.value = ''
  }
}

const removeGenre = (index: number) => {
  editForm.genres.splice(index, 1)
}

const handleAvatarSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !band.value) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Image must be smaller than 5MB', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  uploadingAvatar.value = true

  try {
    // Create preview
    avatarPreview.value = URL.createObjectURL(file)

    // Upload and process image (resizes to square)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')
    formData.append('key', `avatars/${band.value.id}/avatar.jpg`)

    const { key } = await $fetch('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    // Store the key (not the signed URL) so we can generate fresh URLs later
    await updateBand(band.value.id, { avatar_key: key })

    // Update local state with fresh URL for display
    band.value.avatar_key = key
    band.value.avatar_url = await getStreamUrl(key)

    toast.add({ title: 'Photo updated', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    console.error('Avatar upload failed:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload photo', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    avatarPreview.value = null
  } finally {
    uploadingAvatar.value = false
    // Reset input
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const handleBannerSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !band.value) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  // Validate file size (max 10MB for banners)
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Banner must be smaller than 10MB', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  uploadingBanner.value = true

  try {
    // Create preview
    bannerPreview.value = URL.createObjectURL(file)

    // Upload and process image (resizes to 1500x500)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'banner')
    formData.append('key', `banners/${band.value.id}/banner.jpg`)

    const { key } = await $fetch('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    // Store the key (not the signed URL) so we can generate fresh URLs later
    await updateBand(band.value.id, { banner_key: key })

    // Update local state with fresh URL for display
    band.value.banner_key = key
    band.value.banner_url = await getStreamUrl(key)

    toast.add({ title: 'Banner updated', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    console.error('Banner upload failed:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload banner', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    bannerPreview.value = null
  } finally {
    uploadingBanner.value = false
    // Reset input
    if (bannerInput.value) {
      bannerInput.value.value = ''
    }
  }
}

const saveSettings = async () => {
  if (!band.value) return

  saving.value = true

  try {
    const updated = await updateBand(band.value.id, {
      name: editForm.name,
      tagline: editForm.tagline || undefined,
      bio: editForm.bio || undefined,
      location: editForm.location || undefined,
      website: editForm.website || undefined,
      theme_color: editForm.theme_color,
      genres: editForm.genres,
      // Social links
      instagram: editForm.instagram || undefined,
      twitter: editForm.twitter || undefined,
      youtube: editForm.youtube || undefined,
      spotify: editForm.spotify || undefined,
      soundcloud: editForm.soundcloud || undefined,
      bandcamp: editForm.bandcamp || undefined,
      tiktok: editForm.tiktok || undefined,
    })
    band.value = updated
    toast.add({ title: 'Settings saved', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    toast.add({ title: 'Save failed', description: e.message || 'Failed to save settings', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!band.value) return

  deleting.value = true
  try {
    await deleteBand(band.value.id)
    toast.add({ title: 'Artist profile deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    router.push('/dashboard')
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete artist profile', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// Album edit functions
const openEditAlbum = async (album: Album) => {
  albumToEdit.value = album
  editAlbumForm.title = album.title
  editAlbumForm.description = album.description || ''
  editAlbumForm.release_type = album.release_type
  editAlbumForm.release_date = album.release_date?.split('T')[0] || ''
  editAlbumForm.is_published = album.is_published
  // Rights metadata
  editAlbumForm.label_name = album.label_name || ''
  editAlbumForm.p_line = album.p_line || ''
  editAlbumForm.c_line = album.c_line || ''
  // Reset cover preview
  editAlbumCoverPreview.value = null

  // Deep copy tracks for editing with credits
  const tracks = album.tracks || []
  const trackIds = tracks.map(t => t.id)

  // Load credits for all tracks
  let creditsMap: Record<string, TrackCredit[]> = {}
  if (trackIds.length > 0) {
    try {
      creditsMap = await getCreditsForTracks(trackIds)
    } catch (e) {
      console.error('Failed to load track credits:', e)
    }
  }

  // Map tracks with their credits
  editAlbumTracks.value = tracks.map(t => ({
    ...t,
    credits: (creditsMap[t.id] || []).map(c => ({
      id: c.id,
      role: c.role,
      name: c.name,
      ipi_number: c.ipi_number || '',
    })),
    showCredits: false,
  }))

  // Store original credits for comparison (to detect changes that trigger re-review)
  originalTrackCredits.value = {}
  for (const track of editAlbumTracks.value) {
    // Store a normalized JSON string of credits for comparison
    const normalizedCredits = track.credits
      .filter(c => c.name.trim())
      .map(c => ({ role: c.role, name: c.name.trim(), ipi_number: c.ipi_number?.trim() || '' }))
      .sort((a, b) => a.name.localeCompare(b.name))
    originalTrackCredits.value[track.id] = JSON.stringify(normalizedCredits)
  }

  showEditAlbumModal.value = true
}

const handleAlbumCoverSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !albumToEdit.value || !band.value) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Image must be smaller than 5MB', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  uploadingAlbumCover.value = true

  try {
    // Create preview
    editAlbumCoverPreview.value = URL.createObjectURL(file)

    // Upload and process image (resizes to 600x600 square)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'cover')
    formData.append('key', `covers/${band.value.id}/${albumToEdit.value.id}/cover.jpg`)

    const { key } = await $fetch<{ key: string }>('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    // Update album with new cover key
    await updateAlbum(albumToEdit.value.id, { cover_key: key })

    // Update local state
    albumToEdit.value.cover_key = key
    const newCoverUrl = await getStreamUrl(key)
    albumToEdit.value.cover_url = newCoverUrl

    // Update in albums array
    const index = albums.value.findIndex(a => a.id === albumToEdit.value!.id)
    if (index !== -1) {
      albums.value[index].cover_key = key
      albums.value[index].cover_url = newCoverUrl
    }

    toast.add({ title: 'Cover updated', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    console.error('Album cover upload failed:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload cover', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    editAlbumCoverPreview.value = null
  } finally {
    uploadingAlbumCover.value = false
    // Reset input
    if (editAlbumCoverInput.value) {
      editAlbumCoverInput.value.value = ''
    }
  }
}

const handleSaveAlbum = async () => {
  if (!albumToEdit.value || !editAlbumForm.title.trim()) return

  // Check if album is being published (was not published, now is)
  const isBeingPublished = !albumToEdit.value.is_published && editAlbumForm.is_published

  savingAlbum.value = true
  let tracksResetToReview = 0

  try {
    // Update album details
    const updated = await updateAlbum(albumToEdit.value.id, {
      title: editAlbumForm.title.trim(),
      description: editAlbumForm.description.trim() || undefined,
      release_type: editAlbumForm.release_type,
      release_date: editAlbumForm.release_date || undefined,
      is_published: editAlbumForm.is_published,
      // Rights metadata
      label_name: editAlbumForm.label_name.trim() || undefined,
      p_line: editAlbumForm.p_line.trim() || undefined,
      c_line: editAlbumForm.c_line.trim() || undefined,
    })

    // Update tracks using the API (handles re-review logic)
    for (let i = 0; i < editAlbumTracks.value.length; i++) {
      const track = editAlbumTracks.value[i]
      const newTrackNumber = i + 1
      const originalTrack = albumToEdit.value.tracks?.find(t => t.id === track.id)

      // Check if any track field changed (including track number from reordering)
      const trackNumberChanged = originalTrack && originalTrack.track_number !== newTrackNumber
      const contentChanged = originalTrack && (
        originalTrack.title !== track.title ||
        originalTrack.is_explicit !== track.is_explicit ||
        originalTrack.isrc !== track.isrc ||
        originalTrack.iswc !== track.iswc ||
        originalTrack.is_cover !== track.is_cover
      )

      // Check if credits changed (also triggers re-review since it affects royalties)
      const validCredits = track.credits.filter(c => c.name.trim())
      const currentCreditsNormalized = validCredits
        .map(c => ({ role: c.role, name: c.name.trim(), ipi_number: c.ipi_number?.trim() || '' }))
        .sort((a, b) => a.name.localeCompare(b.name))
      const currentCreditsJson = JSON.stringify(currentCreditsNormalized)
      const originalCreditsJson = originalTrackCredits.value[track.id] || '[]'
      const creditsChanged = currentCreditsJson !== originalCreditsJson

      // Update if content or credits changed (uses API with re-review logic)
      if (contentChanged || creditsChanged) {
        // Use the new API endpoint that handles re-review logic
        const result = await $fetch<{ success: boolean; track: any; wasResetToReview: boolean }>(`/api/tracks/${track.id}`, {
          method: 'PATCH',
          body: {
            title: track.title,
            is_explicit: track.is_explicit,
            isrc: track.isrc || null,
            iswc: track.iswc || null,
            is_cover: track.is_cover,
            track_number: newTrackNumber,
          },
        })

        // Update local track with new moderation status
        if (result.track) {
          track.moderation_status = result.track.moderation_status
          track.moderation_notes = result.track.moderation_notes
        }

        if (result.wasResetToReview) {
          tracksResetToReview++
        }
      } else if (trackNumberChanged) {
        // Only track number changed (from reordering) - update without re-review
        await updateTrack(track.id, { track_number: newTrackNumber })
      }

      // Save credits (always update to handle additions/removals)
      await setTrackCredits(track.id, validCredits.map(c => ({
        role: c.role,
        name: c.name.trim(),
        ipi_number: c.ipi_number?.trim() || undefined,
      })))
    }

    // Update local albums array with updated data including tracks
    // Strip editable-only fields (showCredits) when saving back
    const index = albums.value.findIndex(a => a.id === albumToEdit.value!.id)
    if (index !== -1) {
      const tracksForStorage = editAlbumTracks.value.map(({ showCredits, ...track }) => track)
      albums.value[index] = { ...albums.value[index], ...updated, tracks: tracksForStorage as Track[] }
    }

    // Notify followers if album was just published
    if (isBeingPublished) {
      $fetch(`/api/albums/${albumToEdit.value.id}/notify-followers`, { method: 'POST' })
        .then((result: any) => {
          if (result.notified > 0) {
            toast.add({
              title: 'Followers notified',
              description: `${result.notified} follower(s) were notified of the new release`,
              color: 'blue',
              icon: 'i-heroicons-bell',
            })
          }
        })
        .catch((err) => {
          console.error('Failed to notify followers:', err)
        })
    }

    // Show appropriate toast based on whether tracks were reset to review
    if (tracksResetToReview > 0) {
      toast.add({
        title: 'Album updated',
        description: `${tracksResetToReview} track${tracksResetToReview > 1 ? 's' : ''} sent for re-review`,
        color: 'yellow',
        icon: 'i-heroicons-clock',
      })
    } else {
      toast.add({ title: 'Album updated', color: 'green', icon: 'i-heroicons-check-circle' })
    }
    showEditAlbumModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Update failed', description: e.message || 'Failed to update album', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    savingAlbum.value = false
  }
}

// Track delete functions
const confirmDeleteTrack = (track: EditableTrack) => {
  trackToDelete.value = track
  showDeleteTrackModal.value = true
}

const handleDeleteTrack = async () => {
  if (!trackToDelete.value) return

  deletingTrack.value = true
  try {
    await deleteTrack(trackToDelete.value.id)

    // Remove from editAlbumTracks
    editAlbumTracks.value = editAlbumTracks.value.filter(t => t.id !== trackToDelete.value!.id)

    // Update track numbers
    editAlbumTracks.value.forEach((t, idx) => {
      t.track_number = idx + 1
    })

    // Also update in the main albums array if the modal is closed later
    if (albumToEdit.value) {
      const albumIndex = albums.value.findIndex(a => a.id === albumToEdit.value!.id)
      if (albumIndex !== -1 && albums.value[albumIndex].tracks) {
        albums.value[albumIndex].tracks = albums.value[albumIndex].tracks!.filter(t => t.id !== trackToDelete.value!.id)
      }
    }

    toast.add({ title: 'Track deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    showDeleteTrackModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete track', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    deletingTrack.value = false
  }
}

// Album delete functions
const confirmDeleteAlbum = (album: Album) => {
  albumToDelete.value = album
  showDeleteAlbumModal.value = true
}

const handleDeleteAlbum = async () => {
  if (!albumToDelete.value) return

  deletingAlbum.value = true
  try {
    await deleteAlbum(albumToDelete.value.id)
    albums.value = albums.value.filter(a => a.id !== albumToDelete.value!.id)
    toast.add({ title: 'Album deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    showDeleteAlbumModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete album', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    deletingAlbum.value = false
  }
}

onMounted(async () => {
  // Initialize tab from URL param
  initTabFromUrl()

  try {
    const id = route.params.id as string
    band.value = await getBandById(id)

    // Check for Stripe Connect return
    if (route.query.connected === 'true') {
      toast.add({
        title: 'Stripe Connected',
        description: 'Your payout account is being set up. It may take a moment to verify.',
        icon: 'i-heroicons-check-circle',
        color: 'green',
      })
      // Clean up URL
      router.replace({ query: { ...route.query, connected: undefined, tab: 'earnings' } })
    }

    if (route.query.refresh === 'true') {
      // User returned from incomplete onboarding
      router.replace({ query: { ...route.query, refresh: undefined, tab: 'earnings' } })
    }

    if (band.value) {
      // Populate edit form
      editForm.name = band.value.name
      editForm.tagline = band.value.tagline || ''
      editForm.bio = band.value.bio || ''
      editForm.location = band.value.location || ''
      editForm.website = band.value.website || ''
      editForm.theme_color = band.value.theme_color || '#8B5CF6'
      editForm.genres = [...(band.value.genres || [])]
      // Social links
      editForm.instagram = band.value.instagram || ''
      editForm.twitter = band.value.twitter || ''
      editForm.youtube = band.value.youtube || ''
      editForm.spotify = band.value.spotify || ''
      editForm.soundcloud = band.value.soundcloud || ''
      editForm.bandcamp = band.value.bandcamp || ''
      editForm.tiktok = band.value.tiktok || ''

      // Load avatar URL from key if available
      if (band.value.avatar_key) {
        try {
          band.value.avatar_url = await getStreamUrl(band.value.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar:', e)
        }
      }

      // Load banner URL from key if available
      if (band.value.banner_key) {
        try {
          band.value.banner_url = await getStreamUrl(band.value.banner_key)
        } catch (e) {
          console.error('Failed to load banner:', e)
        }
      }

      // Load albums (including unpublished drafts, no moderation filtering - artists see all their tracks)
      albums.value = await getBandAlbums(band.value.id, true, false)

      // Load cover URLs
      for (const album of albums.value) {
        if (album.cover_key) {
          try {
            albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
          } catch (e) {
            console.error('Failed to load cover:', e)
          }
        }
      }

      // Load analytics
      loadAnalytics()
      loadCountryAnalytics()

      // Load earnings
      loadEarnings()
    }
  } catch (e) {
    console.error('Failed to load band:', e)
  } finally {
    loading.value = false
  }
})
</script>
