<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-zinc-100 mb-2">Admin Dashboard</h1>
      <p class="text-zinc-400">Platform administration and management</p>
    </div>

    <!-- Tabs -->
    <PillTabs v-model="currentTab" :tabs="tabs">
      <template #overview>
        <div class="space-y-6">
          <!-- Platform Stats -->
          <div v-if="statsLoading" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(stats.totalStreams) }}</p>
                <p class="text-sm text-zinc-400">Total Streams</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-violet-400">{{ stats.totalArtists }}</p>
                <p class="text-sm text-zinc-400">Artists</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-teal-400">{{ stats.totalTracks }}</p>
                <p class="text-sm text-zinc-400">Tracks</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-fuchsia-400">{{ stats.totalUsers }}</p>
                <p class="text-sm text-zinc-400">Users</p>
              </div>
            </UCard>
          </div>

          <!-- Platform Settings -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-zinc-100">Platform Settings</h2>
                  <p class="text-sm text-zinc-400">Configure platform behavior</p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Require Track Moderation -->
              <div class="flex items-center justify-between py-3 border-b border-zinc-800">
                <div>
                  <p class="text-zinc-200 font-medium">Require Track Moderation</p>
                  <p class="text-sm text-zinc-500">When enabled, only approved tracks are visible to users</p>
                </div>
                <UToggle
                  v-model="platformSettings.requireTrackModeration"
                  :loading="settingsLoading"
                  @change="updateSetting('require_track_moderation', platformSettings.requireTrackModeration)"
                />
              </div>

              <!-- Info when moderation is disabled -->
              <div v-if="!platformSettings.requireTrackModeration" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div class="flex gap-2">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p class="text-sm text-yellow-200">
                    Moderation is currently disabled. All uploaded tracks are immediately visible to users.
                  </p>
                </div>
              </div>

              <!-- Info when moderation is enabled -->
              <div v-else class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div class="flex gap-2">
                  <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p class="text-sm text-green-200">
                    Moderation is enabled. Only approved tracks are visible to users. Review pending tracks in the Track Moderation tab.
                  </p>
                </div>
              </div>
            </div>
          </UCard>

        </div>
      </template>

      <!-- Track Moderation Tab -->
      <template #moderation>
        <div class="py-6 space-y-6">
          <!-- Stats Summary -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-yellow-400">{{ pendingCount }}</p>
                <p class="text-sm text-zinc-400">Pending Review</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-red-400">{{ urgentCount }}</p>
                <p class="text-sm text-zinc-400">Urgent</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-green-400">{{ approvedTodayCount }}</p>
                <p class="text-sm text-zinc-400">Approved Today</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-orange-400">{{ revisionRequestedCount }}</p>
                <p class="text-sm text-zinc-400">Awaiting Revision</p>
              </div>
            </UCard>
          </div>

          <!-- Search and Filters -->
          <div class="flex flex-wrap gap-4">
            <UInput
              v-model="moderationSearch"
              placeholder="Search by track or artist name..."
              size="lg"
              class="flex-1 min-w-[300px]"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
              </template>
            </UInput>

            <USelectMenu
              v-model="moderationStatusFilter"
              :options="moderationStatusOptions"
              value-attribute="value"
              option-attribute="label"
              size="lg"
              class="w-44"
            />

            <USelectMenu
              v-model="moderationPriorityFilter"
              :options="moderationPriorityOptions"
              value-attribute="value"
              option-attribute="label"
              size="lg"
              class="w-40"
            />

            <UButton color="gray" @click="loadModerationQueue">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Queue Table -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div v-if="moderationLoading" class="flex justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>

            <div v-else-if="moderationQueue.length === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tracks in queue</p>
              <p class="text-sm mt-1">All tracks have been reviewed!</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Track</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Priority</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Submitted</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in moderationQueue"
                    :key="item.id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                    @click="openTrackDetail(item)"
                  >
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                        >
                          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p class="font-medium text-zinc-100">{{ item.track?.title || 'Untitled' }}</p>
                          <p class="text-sm text-zinc-500">{{ item.track?.album?.title || 'No album' }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div>
                        <p class="text-zinc-300">{{ item.band?.name || 'Unknown' }}</p>
                        <p class="text-xs text-zinc-500">{{ item.submitter?.email }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge
                        :color="item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'yellow' : 'gray'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ item.priority }}
                      </UBadge>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge
                        :color="getStatusColor(item.status)"
                        variant="subtle"
                        size="xs"
                      >
                        {{ formatStatus(item.status) }}
                      </UBadge>
                    </td>
                    <td class="py-3 px-4 text-sm text-zinc-400">
                      {{ formatDate(item.created_at) }}
                    </td>
                    <td class="py-3 px-4 text-right" @click.stop>
                      <div class="flex justify-end gap-1">
                        <UButton
                          v-if="item.status === 'pending' || item.status === 'pending_update'"
                          color="green"
                          variant="ghost"
                          size="xs"
                          title="Approve"
                          @click="handleQuickApprove(item)"
                        >
                          <UIcon name="i-heroicons-check" class="w-4 h-4" />
                        </UButton>
                        <UButton
                          v-if="item.status === 'pending' || item.status === 'pending_update'"
                          color="red"
                          variant="ghost"
                          size="xs"
                          title="Reject"
                          @click="openRejectModal(item)"
                        >
                          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </UButton>
                        <UDropdown
                          :items="getPriorityMenuItems(item)"
                          :popper="{ placement: 'bottom-end' }"
                        >
                          <UButton
                            color="gray"
                            variant="ghost"
                            size="xs"
                            title="Change Priority"
                          >
                            <UIcon name="i-heroicons-arrow-up-down" class="w-4 h-4" />
                          </UButton>
                        </UDropdown>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="moderationPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <p class="text-sm text-zinc-400">
                Showing {{ (moderationPagination.page - 1) * moderationPagination.limit + 1 }} - {{ Math.min(moderationPagination.page * moderationPagination.limit, moderationPagination.total) }} of {{ moderationPagination.total }}
              </p>
              <div class="flex gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="moderationPagination.page <= 1"
                  @click="loadModerationQueue(moderationPagination.page - 1)"
                >
                  Previous
                </UButton>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="moderationPagination.page >= moderationPagination.totalPages"
                  @click="loadModerationQueue(moderationPagination.page + 1)"
                >
                  Next
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Artist Approvals Tab -->
      <template #artist-approvals>
        <div class="py-6 space-y-6">
          <!-- Stats Summary -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-orange-400">{{ pendingArtistCount }}</p>
                <p class="text-sm text-zinc-400">Pending Approval</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-green-400">{{ pendingArtists.filter(a => a.status === 'active').length }}</p>
                <p class="text-sm text-zinc-400">Active Artists</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-red-400">{{ pendingArtists.filter(a => a.status === 'removed').length }}</p>
                <p class="text-sm text-zinc-400">Rejected</p>
              </div>
            </UCard>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap gap-4">
            <USelectMenu
              v-model="artistApprovalsStatusFilter"
              :options="[
                { label: 'Pending', value: 'pending' },
                { label: 'Active', value: 'active' },
                { label: 'Rejected', value: 'removed' },
                { label: 'All', value: 'all' },
              ]"
              value-attribute="value"
              option-attribute="label"
              size="lg"
              class="w-40"
              @update:model-value="loadArtistApprovals"
            />
            <UButton color="gray" @click="loadArtistApprovals">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Artist Approvals Table -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div v-if="artistApprovalsLoading" class="flex justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>

            <div v-else-if="pendingArtists.length === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No artists to review</p>
              <p class="text-sm mt-1">{{ artistApprovalsStatusFilter === 'pending' ? 'All artist profiles have been reviewed!' : 'No artists found with this status.' }}</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Bio</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Owner</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Created</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="artist in pendingArtists"
                    :key="artist.id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                    @click="openArtistDetail(artist)"
                  >
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div
                          v-if="artist.avatar_url"
                          class="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                          :style="{ backgroundImage: `url(${artist.avatar_url})` }"
                        />
                        <div
                          v-else
                          class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                        >
                          <UIcon name="i-heroicons-user" class="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p class="font-medium text-zinc-100">{{ artist.name }}</p>
                          <p v-if="artist.genres?.length" class="text-xs text-zinc-500">{{ artist.genres.slice(0, 2).join(', ') }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4 max-w-xs">
                      <p class="text-sm text-zinc-400 truncate" :title="artist.bio || 'No bio'">
                        {{ artist.bio || 'No bio provided' }}
                      </p>
                    </td>
                    <td class="py-3 px-4">
                      <p class="text-sm text-zinc-300">{{ artist.owner?.email || 'Unknown' }}</p>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge
                        :color="artist.status === 'pending' ? 'orange' : artist.status === 'active' ? 'green' : 'red'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ artist.status === 'removed' ? 'Rejected' : artist.status }}
                      </UBadge>
                    </td>
                    <td class="py-3 px-4 text-sm text-zinc-400">
                      {{ formatDate(artist.created_at) }}
                    </td>
                    <td class="py-3 px-4 text-right" @click.stop>
                      <div class="flex justify-end gap-1">
                        <UButton
                          v-if="artist.status === 'pending'"
                          color="green"
                          variant="ghost"
                          size="xs"
                          title="Approve"
                          :loading="artistActionLoading"
                          @click="approveArtist(artist)"
                        >
                          <UIcon name="i-heroicons-check" class="w-4 h-4" />
                        </UButton>
                        <UButton
                          v-if="artist.status === 'pending'"
                          color="red"
                          variant="ghost"
                          size="xs"
                          title="Reject"
                          @click="openRejectArtistModal(artist)"
                        >
                          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </UButton>
                        <UButton
                          color="gray"
                          variant="ghost"
                          size="xs"
                          title="View Details"
                          @click="openArtistDetail(artist)"
                        >
                          <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                        </UButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Users Tab -->
      <template #users>
        <div class="py-6 space-y-6">
          <!-- Search and Filters -->
          <div class="flex gap-4">
            <UInput
              v-model="userSearch"
              placeholder="Search by email or name..."
              size="lg"
              class="flex-1"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
              </template>
            </UInput>
            <UButton color="gray" @click="loadUsers">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Users Table -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div v-if="usersLoading" class="flex justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>

            <div v-else-if="users.length === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-users" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">User</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Role</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Stats</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Joined</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="u in users"
                    :key="u.id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td class="py-3 px-4">
                      <div>
                        <p class="font-medium text-zinc-100">{{ u.display_name || 'No name' }}</p>
                        <p class="text-sm text-zinc-400">{{ u.email }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <USelect
                        :model-value="u.role"
                        :options="roleOptions"
                        size="sm"
                        :disabled="u.id === currentUserId"
                        @update:model-value="(val) => updateUserRole(u.id, val)"
                      />
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-sm">
                        <span class="text-zinc-400">{{ u.band_count }} bands</span>
                        <span class="text-zinc-600 mx-1">|</span>
                        <span class="text-zinc-400">{{ u.stream_count }} streams</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-sm text-zinc-400">
                      {{ formatDate(u.created_at) }}
                    </td>
                    <td class="py-3 px-4 text-right">
                      <UButton
                        color="red"
                        variant="ghost"
                        size="xs"
                        :disabled="u.id === currentUserId"
                        @click="confirmDeleteUser(u)"
                      >
                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                      </UButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="usersPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <p class="text-sm text-zinc-400">
                Showing {{ (usersPagination.page - 1) * usersPagination.limit + 1 }} - {{ Math.min(usersPagination.page * usersPagination.limit, usersPagination.total) }} of {{ usersPagination.total }}
              </p>
              <div class="flex gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="usersPagination.page <= 1"
                  @click="loadUsers(usersPagination.page - 1)"
                >
                  Previous
                </UButton>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="usersPagination.page >= usersPagination.totalPages"
                  @click="loadUsers(usersPagination.page + 1)"
                >
                  Next
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Artists Tab -->
      <template #artists>
        <div class="py-6 space-y-6">
          <!-- Search and Filters -->
          <div class="flex flex-wrap gap-4">
            <UInput
              v-model="bandSearch"
              placeholder="Search by name, slug, or location..."
              size="lg"
              class="flex-1 min-w-[300px]"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
              </template>
            </UInput>

            <!-- Status Filter -->
            <USelectMenu
              v-model="bandStatusFilter"
              :options="statusFilterOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Status"
              size="lg"
              class="w-40"
            />

            <!-- Featured Filter -->
            <USelectMenu
              v-model="bandFeaturedFilter"
              :options="featuredFilterOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Featured"
              size="lg"
              class="w-40"
            />

            <!-- Verified Filter -->
            <USelectMenu
              v-model="bandVerifiedFilter"
              :options="verifiedFilterOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Verified"
              size="lg"
              class="w-40"
            />

            <UButton color="gray" @click="loadBands">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Artists Table -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div v-if="bandsLoading" class="flex justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>

            <div v-else-if="bands.length === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No artists found</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Owner</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Stats</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Badges</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="band in bands"
                    :key="band.id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                        >
                          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p class="font-medium text-zinc-100">{{ band.name }}</p>
                          <p class="text-sm text-zinc-400">@{{ band.slug }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-sm">
                        <p class="text-zinc-300">{{ band.owner?.display_name || 'No name' }}</p>
                        <p class="text-zinc-500">{{ band.owner?.email }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-sm">
                        <span class="text-zinc-400">{{ band.album_count }} albums</span>
                        <span class="text-zinc-600 mx-1">|</span>
                        <span class="text-zinc-400">{{ band.track_count }} tracks</span>
                        <span class="text-zinc-600 mx-1">|</span>
                        <span class="text-zinc-400">{{ formatNumber(band.total_streams) }} streams</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge
                        :color="band.status === 'active' ? 'green' : band.status === 'suspended' ? 'yellow' : 'red'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ band.status }}
                      </UBadge>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex gap-1">
                        <UBadge
                          v-if="band.is_verified"
                          color="blue"
                          variant="subtle"
                          size="xs"
                        >
                          <UIcon name="i-heroicons-check-badge" class="w-3 h-3 mr-1" />
                          Verified
                        </UBadge>
                        <UBadge
                          v-if="band.is_featured"
                          color="violet"
                          variant="subtle"
                          size="xs"
                        >
                          <UIcon name="i-heroicons-star" class="w-3 h-3 mr-1" />
                          Featured
                        </UBadge>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex justify-end gap-2">
                        <UButton
                          color="violet"
                          variant="ghost"
                          size="xs"
                          @click="openEditBandModal(band)"
                        >
                          <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                        </UButton>
                        <UButton
                          color="red"
                          variant="ghost"
                          size="xs"
                          @click="confirmDeleteBand(band)"
                        >
                          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                        </UButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="bandsPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <p class="text-sm text-zinc-400">
                Showing {{ (bandsPagination.page - 1) * bandsPagination.limit + 1 }} - {{ Math.min(bandsPagination.page * bandsPagination.limit, bandsPagination.total) }} of {{ bandsPagination.total }}
              </p>
              <div class="flex gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="bandsPagination.page <= 1"
                  @click="loadBands(bandsPagination.page - 1)"
                >
                  Previous
                </UButton>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="bandsPagination.page >= bandsPagination.totalPages"
                  @click="loadBands(bandsPagination.page + 1)"
                >
                  Next
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Albums Tab -->
      <template #albums>
        <div class="py-6 space-y-6">
          <!-- Search and Filters -->
          <div class="flex flex-wrap gap-4">
            <UInput
              v-model="albumSearch"
              placeholder="Search by title or slug..."
              size="lg"
              class="flex-1 min-w-[300px]"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
              </template>
            </UInput>

            <USelectMenu
              v-model="albumPublishedFilter"
              :options="[
                { label: 'All', value: 'all' },
                { label: 'Published', value: 'true' },
                { label: 'Draft', value: 'false' },
              ]"
              value-attribute="value"
              option-attribute="label"
              size="lg"
              class="w-40"
              @update:model-value="loadAlbums(1)"
            />

            <UButton color="gray" @click="loadAlbums">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Albums Table -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div v-if="albumsLoading" class="flex justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>

            <div v-else-if="albums.length === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-square-3-stack-3d" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No albums found</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Album</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Type</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Tracks</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Created</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="album in albums"
                    :key="album.id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                          <UIcon name="i-heroicons-square-3-stack-3d" class="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p class="font-medium text-zinc-100">{{ album.title }}</p>
                          <p class="text-sm text-zinc-400">{{ album.slug }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-sm">
                        <p class="text-zinc-300">{{ album.band?.name || 'Unknown' }}</p>
                        <p class="text-zinc-500">@{{ album.band?.slug }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge
                        :color="album.release_type === 'album' ? 'violet' : album.release_type === 'ep' ? 'blue' : 'gray'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ album.release_type.toUpperCase() }}
                      </UBadge>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge
                        :color="album.is_published ? 'green' : 'yellow'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ album.is_published ? 'Published' : 'Draft' }}
                      </UBadge>
                    </td>
                    <td class="py-3 px-4 text-sm text-zinc-400">
                      {{ album.track_count }}
                    </td>
                    <td class="py-3 px-4 text-sm text-zinc-400">
                      {{ formatDate(album.created_at) }}
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex justify-end gap-2">
                        <UButton
                          color="violet"
                          variant="ghost"
                          size="xs"
                          @click="openEditAlbumModal(album)"
                        >
                          <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                        </UButton>
                        <UButton
                          color="red"
                          variant="ghost"
                          size="xs"
                          @click="confirmDeleteAlbum(album)"
                        >
                          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                        </UButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="albumsPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <p class="text-sm text-zinc-400">
                Showing {{ (albumsPagination.page - 1) * albumsPagination.limit + 1 }} - {{ Math.min(albumsPagination.page * albumsPagination.limit, albumsPagination.total) }} of {{ albumsPagination.total }}
              </p>
              <div class="flex gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="albumsPagination.page <= 1"
                  @click="loadAlbums(albumsPagination.page - 1)"
                >
                  Previous
                </UButton>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="albumsPagination.page >= albumsPagination.totalPages"
                  @click="loadAlbums(albumsPagination.page + 1)"
                >
                  Next
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Payouts Tab -->
      <template #payouts>
        <div class="py-6 space-y-6">
          <!-- Period Selector -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">Calculate Artist Payouts</h3>
            <div class="flex flex-wrap items-end gap-4">
              <UFormGroup label="Month">
                <USelectMenu
                  v-model="payoutMonth"
                  :options="monthOptions"
                  value-attribute="value"
                  option-attribute="label"
                  class="w-40"
                />
              </UFormGroup>
              <UFormGroup label="Year">
                <USelectMenu
                  v-model="payoutYear"
                  :options="yearOptions"
                  value-attribute="value"
                  option-attribute="label"
                  class="w-32"
                />
              </UFormGroup>
              <UButton
                color="violet"
                :loading="calculatingPayouts"
                @click="calculatePayouts"
              >
                <UIcon name="i-heroicons-calculator" class="w-4 h-4 mr-2" />
                Calculate Payouts
              </UButton>
            </div>
            <p class="text-sm text-zinc-500 mt-4">
              This will calculate the user-centric revenue distribution for the selected month. 70% goes to artists, 15% to CMOs (SUISA/GEMA), 15% platform.
            </p>
          </UCard>

          <!-- Calculation Results -->
          <UCard v-if="payoutCalculation" class="bg-zinc-900/50 border-zinc-800">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">Calculation Results</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(payoutCalculation.totalRevenue) }}</p>
                <p class="text-sm text-zinc-400">Total Revenue</p>
              </div>
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-teal-400">{{ formatCurrency(payoutCalculation.artistPool) }}</p>
                <p class="text-sm text-zinc-400">Artist Pool (70%)</p>
              </div>
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-violet-400">{{ payoutCalculation.artistsCount }}</p>
                <p class="text-sm text-zinc-400">Artists</p>
              </div>
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-zinc-100">{{ payoutCalculation.subscribersCount }}</p>
                <p class="text-sm text-zinc-400">Subscribers</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
              <div>
                <p class="text-zinc-300">Ready to process payouts?</p>
                <p class="text-sm text-zinc-500">This will send Stripe transfers to artists with balance >= $10.</p>
              </div>
              <UButton
                color="green"
                :loading="processingPayouts"
                @click="processPayouts"
              >
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4 mr-2" />
                Process Payouts
              </UButton>
            </div>
          </UCard>

          <!-- Processing Results -->
          <UCard v-if="payoutResults" class="bg-zinc-900/50 border-zinc-800">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">Payout Results</h3>
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p class="text-2xl font-bold text-green-400">{{ payoutResults.processed }}</p>
                <p class="text-sm text-zinc-400">Successful</p>
              </div>
              <div class="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p class="text-2xl font-bold text-red-400">{{ payoutResults.failed }}</p>
                <p class="text-sm text-zinc-400">Failed</p>
              </div>
              <div class="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p class="text-2xl font-bold text-yellow-400">{{ payoutResults.skipped }}</p>
                <p class="text-sm text-zinc-400">Skipped</p>
              </div>
            </div>

            <p class="text-teal-400 font-semibold mb-4">
              Total Paid: {{ formatCurrency(payoutResults.totalAmount) }}
            </p>

            <div v-if="payoutResults.results.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Artist</th>
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Amount</th>
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Status</th>
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in payoutResults.results" :key="result.bandId" class="border-b border-zinc-800/50">
                    <td class="py-2 px-3 text-sm text-zinc-300">{{ result.bandName }}</td>
                    <td class="py-2 px-3 text-sm text-teal-400">{{ formatCurrency(result.amount) }}</td>
                    <td class="py-2 px-3">
                      <UBadge
                        :color="result.status === 'success' ? 'green' : result.status === 'failed' ? 'red' : 'yellow'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ result.status }}
                      </UBadge>
                    </td>
                    <td class="py-2 px-3 text-xs text-zinc-500 font-mono">
                      {{ result.transferId || result.error || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>

          <!-- Info Card -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <h3 class="font-semibold text-zinc-100 mb-3">Payout System Info</h3>
            <div class="space-y-2 text-sm text-zinc-400">
              <p><span class="text-violet-400 font-medium">User-Centric Model:</span> Each subscriber's $9.99 is distributed only to artists they listened to.</p>
              <p><span class="text-teal-400 font-medium">Transparent Split:</span> 70% to artists, 15% to CMOs (SUISA/GEMA/etc.), 15% platform fee.</p>
              <p><span class="text-zinc-300 font-medium">$10 Minimum:</span> Artists need at least $10 balance and a connected Stripe account to receive payouts.</p>
              <p><span class="text-zinc-300 font-medium">Stripe Connect:</span> Artists connect their bank account through Stripe Express onboarding in their dashboard.</p>
            </div>
          </UCard>
        </div>
      </template>

      <!-- PRO Export Tab -->
      <template #pro-export>
        <div class="py-6">
          <UCard class="bg-zinc-900/50 border-zinc-800 max-w-2xl">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-document-arrow-down" class="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-zinc-100">SUISA/GEMA Export</h2>
                  <p class="text-sm text-zinc-400">Generate stream reports for PRO submission</p>
                </div>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Quarter Presets -->
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">Quick Select</label>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="preset in quarterPresets"
                    :key="preset.value"
                    size="sm"
                    :color="selectedPreset === preset.value ? 'violet' : 'gray'"
                    :variant="selectedPreset === preset.value ? 'solid' : 'ghost'"
                    @click="applyPreset(preset.value)"
                  >
                    {{ preset.label }}
                  </UButton>
                </div>
              </div>

              <!-- Custom Date Range -->
              <div class="grid grid-cols-2 gap-4">
                <UFormGroup label="Start Date">
                  <UInput v-model="startDate" type="date" size="lg" />
                </UFormGroup>
                <UFormGroup label="End Date">
                  <UInput v-model="endDate" type="date" size="lg" />
                </UFormGroup>
              </div>

              <!-- Info Box -->
              <div class="bg-zinc-800/50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-zinc-200 mb-2">Export includes:</h4>
                <ul class="text-sm text-zinc-400 space-y-1">
                  <li>- All completed streams (30+ seconds) from paying subscribers</li>
                  <li>- ISRC and ISWC codes for each track</li>
                  <li>- Composer credits with IPI numbers and split percentages</li>
                  <li>- Play counts grouped by territory (country)</li>
                  <li>- Total listening duration in seconds</li>
                </ul>
              </div>

              <!-- Download Button -->
              <div class="flex justify-end">
                <UButton
                  color="violet"
                  size="lg"
                  :loading="exporting"
                  :disabled="!startDate || !endDate"
                  @click="downloadExport"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
                  Download CSV
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </PillTabs>

    <!-- Reject Artist Modal -->
    <UModal v-model="showRejectArtistModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-x-circle" class="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-zinc-100">Reject Artist</h3>
              <p class="text-sm text-zinc-400">{{ artistToReject?.name }}</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-zinc-300">
            Please provide a reason for rejecting this artist profile. This will be sent to the artist.
          </p>
          <UTextarea
            v-model="rejectArtistReason"
            placeholder="Enter reason for rejection..."
            :rows="3"
            autofocus
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="showRejectArtistModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="artistActionLoading"
              :disabled="!rejectArtistReason.trim()"
              @click="rejectArtist"
            >
              Reject Artist
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Artist Detail Modal -->
    <UModal v-model="showArtistDetailModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard v-if="selectedArtist">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                v-if="selectedArtist.avatar_url"
                class="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
                :style="{ backgroundImage: `url(${selectedArtist.avatar_url})` }"
              />
              <div
                v-else
                class="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
              >
                <UIcon name="i-heroicons-user" class="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-zinc-100">{{ selectedArtist.name }}</h3>
                <p class="text-sm text-zinc-400">{{ selectedArtist.slug }}</p>
              </div>
            </div>
            <UBadge
              :color="selectedArtist.status === 'pending' ? 'orange' : selectedArtist.status === 'active' ? 'green' : 'red'"
              variant="subtle"
            >
              {{ selectedArtist.status === 'removed' ? 'Rejected' : selectedArtist.status }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Bio -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Bio</h4>
            <p class="text-zinc-200 whitespace-pre-wrap">{{ selectedArtist.bio || 'No bio provided' }}</p>
          </div>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium text-zinc-400 mb-1">Location</h4>
              <p class="text-zinc-200">{{ selectedArtist.location || 'Not specified' }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-zinc-400 mb-1">Website</h4>
              <p v-if="selectedArtist.website" class="text-violet-400">
                <a :href="selectedArtist.website" target="_blank" rel="noopener" class="hover:underline">
                  {{ selectedArtist.website }}
                </a>
              </p>
              <p v-else class="text-zinc-500">Not specified</p>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="selectedArtist.genres?.length">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Genres</h4>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="genre in selectedArtist.genres"
                :key="genre"
                color="violet"
                variant="soft"
              >
                {{ genre }}
              </UBadge>
            </div>
          </div>

          <!-- Social Links -->
          <div v-if="hasAnySocialLink(selectedArtist)">
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Social Links</h4>
            <div class="grid grid-cols-2 gap-3">
              <a
                v-if="selectedArtist.instagram"
                :href="formatSocialUrl(selectedArtist.instagram, 'instagram')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-instagram" class="w-5 h-5 text-pink-400" />
                <span class="text-sm text-zinc-200 truncate">{{ selectedArtist.instagram }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.spotify"
                :href="formatSocialUrl(selectedArtist.spotify, 'spotify')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-spotify" class="w-5 h-5 text-green-400" />
                <span class="text-sm text-zinc-200 truncate">Spotify</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.youtube"
                :href="formatSocialUrl(selectedArtist.youtube, 'youtube')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-youtube" class="w-5 h-5 text-red-500" />
                <span class="text-sm text-zinc-200 truncate">YouTube</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.soundcloud"
                :href="formatSocialUrl(selectedArtist.soundcloud, 'soundcloud')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-soundcloud" class="w-5 h-5 text-orange-400" />
                <span class="text-sm text-zinc-200 truncate">SoundCloud</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.bandcamp"
                :href="formatSocialUrl(selectedArtist.bandcamp, 'bandcamp')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-bandcamp" class="w-5 h-5 text-teal-400" />
                <span class="text-sm text-zinc-200 truncate">Bandcamp</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.twitter"
                :href="formatSocialUrl(selectedArtist.twitter, 'twitter')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-x" class="w-5 h-5 text-zinc-300" />
                <span class="text-sm text-zinc-200 truncate">{{ selectedArtist.twitter }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.tiktok"
                :href="formatSocialUrl(selectedArtist.tiktok, 'tiktok')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-tiktok" class="w-5 h-5 text-zinc-300" />
                <span class="text-sm text-zinc-200 truncate">{{ selectedArtist.tiktok }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
              <a
                v-if="selectedArtist.facebook"
                :href="formatSocialUrl(selectedArtist.facebook, 'facebook')"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <UIcon name="i-simple-icons-facebook" class="w-5 h-5 text-blue-400" />
                <span class="text-sm text-zinc-200 truncate">Facebook</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-zinc-500 ml-auto" />
              </a>
            </div>
          </div>

          <!-- No Social Links Warning -->
          <div v-else class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-400" />
              <p class="text-sm text-yellow-200">No social links provided - verification may be difficult</p>
            </div>
          </div>

          <!-- Owner Info -->
          <div class="p-4 bg-zinc-800/50 rounded-lg">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Submitted By</h4>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-zinc-200">{{ selectedArtist.owner?.display_name || selectedArtist.owner?.email || 'Unknown' }}</p>
                <p v-if="selectedArtist.owner?.display_name" class="text-sm text-zinc-500">{{ selectedArtist.owner?.email }}</p>
              </div>
              <p class="text-sm text-zinc-400">{{ formatDate(selectedArtist.created_at) }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              color="gray"
              variant="ghost"
              @click="showArtistDetailModal = false"
            >
              Close
            </UButton>
            <div v-if="selectedArtist.status === 'pending'" class="flex gap-2">
              <UButton
                color="red"
                variant="soft"
                @click="showArtistDetailModal = false; openRejectArtistModal(selectedArtist)"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
                Reject
              </UButton>
              <UButton
                color="green"
                :loading="artistActionLoading"
                @click="approveArtist(selectedArtist); showArtistDetailModal = false"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Approve Artist
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Track Detail Modal -->
    <UModal v-model="showTrackDetailModal" :ui="{ width: 'sm:max-w-3xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-100">{{ selectedQueueItem?.track?.title || 'Track Details' }}</h3>
                <p class="text-sm text-zinc-400">{{ selectedQueueItem?.band?.name }} - {{ selectedQueueItem?.track?.album?.title }}</p>
              </div>
            </div>
            <UBadge
              v-if="selectedQueueItem"
              :color="getStatusColor(selectedQueueItem.status)"
              variant="subtle"
            >
              {{ formatStatus(selectedQueueItem.status) }}
            </UBadge>
          </div>
        </template>

        <div v-if="loadingTrackDetail" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
        </div>

        <div v-else-if="selectedQueueItem" class="space-y-6">
          <!-- Audio Player -->
          <div class="bg-zinc-800/50 rounded-lg p-4">
            <div class="flex items-center gap-4">
              <UButton
                :color="isPlaying ? 'violet' : 'gray'"
                size="lg"
                :disabled="!audioPreviewUrl || audioLoading"
                :loading="audioLoading"
                @click="toggleAudioPreview"
              >
                <UIcon :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'" class="w-5 h-5" />
              </UButton>
              <div class="flex-1">
                <p class="text-zinc-200 font-medium">{{ selectedQueueItem.track.title }}</p>
                <p class="text-sm text-zinc-500">
                  {{ formatDuration(selectedQueueItem.track.duration_seconds) }}
                  <span v-if="selectedQueueItem.track.is_explicit" class="ml-2 text-red-400">[Explicit]</span>
                  <span v-if="selectedQueueItem.track.is_cover" class="ml-2 text-yellow-400">[Cover]</span>
                </p>
                <p v-if="!audioPreviewUrl && !audioLoading" class="text-xs text-yellow-500 mt-1">
                  No audio file available
                </p>
              </div>
              <audio
                ref="audioElement"
                :src="audioPreviewUrl || undefined"
                @ended="isPlaying = false"
                @error="handleAudioError"
                @canplay="audioLoading = false"
                class="hidden"
              />
            </div>
          </div>

          <!-- Track Info Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">ISRC</p>
              <p class="text-zinc-200 font-mono">{{ selectedQueueItem.track.isrc || 'Not provided' }}</p>
            </div>
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">ISWC</p>
              <p class="text-zinc-200 font-mono">{{ selectedQueueItem.track.iswc || 'Not provided' }}</p>
            </div>
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">Track #</p>
              <p class="text-zinc-200">{{ selectedQueueItem.track.track_number }}</p>
            </div>
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">Priority</p>
              <UBadge
                :color="selectedQueueItem.priority === 'urgent' ? 'red' : selectedQueueItem.priority === 'high' ? 'yellow' : 'gray'"
                variant="subtle"
                size="xs"
              >
                {{ selectedQueueItem.priority }}
              </UBadge>
            </div>
          </div>

          <!-- Credits -->
          <div v-if="selectedQueueItem.track.credits && selectedQueueItem.track.credits.length > 0">
            <h4 class="text-sm font-medium text-zinc-300 mb-2">Credits</h4>
            <div class="bg-zinc-800/30 rounded-lg overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-700">
                    <th class="text-left py-2 px-3 text-xs text-zinc-500">Name</th>
                    <th class="text-left py-2 px-3 text-xs text-zinc-500">Role</th>
                    <th class="text-left py-2 px-3 text-xs text-zinc-500">IPI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="credit in selectedQueueItem.track.credits" :key="credit.id" class="border-b border-zinc-700/50">
                    <td class="py-2 px-3 text-sm text-zinc-200">{{ credit.name }}</td>
                    <td class="py-2 px-3 text-sm text-zinc-400">{{ credit.role }}</td>
                    <td class="py-2 px-3 text-sm text-zinc-400 font-mono">{{ credit.ipi_number || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Artist Info -->
          <div class="bg-zinc-800/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-zinc-300 mb-2">Artist Information</h4>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p class="text-zinc-200">{{ selectedQueueItem.band.name }}</p>
                <p class="text-sm text-zinc-500">{{ selectedQueueItem.band.owner?.email }}</p>
              </div>
              <NuxtLink :to="`/${selectedQueueItem.band.slug}`" target="_blank" class="ml-auto">
                <UButton color="gray" variant="ghost" size="xs">
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                  View Profile
                </UButton>
              </NuxtLink>
            </div>
          </div>

          <!-- Previous Notes -->
          <div v-if="selectedQueueItem.notes" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-yellow-400 mb-2">Previous Notes</h4>
            <p class="text-zinc-300 text-sm whitespace-pre-wrap">{{ selectedQueueItem.notes }}</p>
          </div>

          <!-- Action Notes -->
          <UFormGroup label="Notes (optional for approval, required for rejection/revision)">
            <UTextarea
              v-model="moderationNotes"
              placeholder="Add notes about this track..."
              rows="3"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton color="gray" variant="ghost" @click="closeTrackDetail">
              Close
            </UButton>
            <div v-if="selectedQueueItem?.status === 'pending' || selectedQueueItem?.status === 'pending_update'" class="flex gap-2">
              <UButton
                color="orange"
                variant="soft"
                :loading="moderationActionLoading"
                @click="handleRequestRevision"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
                Request Revision
              </UButton>
              <UButton
                color="red"
                variant="soft"
                :loading="moderationActionLoading"
                @click="handleReject"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
                Reject
              </UButton>
              <UButton
                color="green"
                :loading="moderationActionLoading"
                @click="handleApprove"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Approve
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Reject Track Modal -->
    <UModal v-model="showRejectModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Reject Track</h3>
          </div>
        </template>

        <p class="text-zinc-300 mb-4">
          Please provide a reason for rejecting <strong>{{ selectedQueueItem?.track?.title }}</strong>.
        </p>

        <UFormGroup label="Rejection Reason" required>
          <UTextarea
            v-model="moderationNotes"
            placeholder="Explain why this track is being rejected..."
            rows="4"
          />
        </UFormGroup>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showRejectModal = false" :disabled="moderationActionLoading">
              Cancel
            </UButton>
            <UButton color="red" :loading="moderationActionLoading" :disabled="!moderationNotes.trim()" @click="confirmReject">
              Reject Track
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Request Revision Modal -->
    <UModal v-model="showRevisionModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-orange-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Request Revision</h3>
          </div>
        </template>

        <p class="text-zinc-300 mb-4">
          Please provide feedback for the artist about <strong>{{ selectedQueueItem?.track?.title }}</strong>.
        </p>

        <UFormGroup label="Revision Notes" required>
          <UTextarea
            v-model="moderationNotes"
            placeholder="Explain what changes are needed..."
            rows="4"
          />
        </UFormGroup>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showRevisionModal = false" :disabled="moderationActionLoading">
              Cancel
            </UButton>
            <UButton color="orange" :loading="moderationActionLoading" :disabled="!moderationNotes.trim()" @click="confirmRequestRevision">
              Request Revision
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete User Confirmation Modal -->
    <UModal v-model="showDeleteUserModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete User</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ userToDelete?.email }}</strong>?
        </p>
        <p class="text-zinc-400 text-sm mt-2">
          This will permanently delete:
        </p>
        <ul class="text-zinc-400 text-sm mt-1 list-disc list-inside">
          <li>User account and profile</li>
          <li>{{ userToDelete?.band_count || 0 }} artist profile(s) and all their music</li>
          <li>{{ userToDelete?.stream_count || 0 }} listening history records</li>
          <li>Library, follows, and all other data</li>
        </ul>
        <p class="text-red-400 text-sm mt-3">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteUserModal = false" :disabled="deletingUser">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingUser" @click="handleDeleteUser">
              Delete User
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Band Modal -->
    <UModal v-model="showEditBandModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-violet-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Edit Artist</h3>
          </div>
        </template>

        <div v-if="bandToEdit" class="space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Name">
              <UInput v-model="editBandForm.name" />
            </UFormGroup>
            <UFormGroup label="Slug">
              <UInput v-model="editBandForm.slug" />
            </UFormGroup>
          </div>

          <UFormGroup label="Tagline" :hint="`${editBandForm.tagline?.length || 0}/150 characters`">
            <UInput v-model="editBandForm.tagline" :maxlength="150" />
          </UFormGroup>

          <UFormGroup label="Bio" hint="Full bio shown in About tab">
            <UTextarea v-model="editBandForm.bio" rows="3" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Location">
              <UInput v-model="editBandForm.location" />
            </UFormGroup>
            <UFormGroup label="Website">
              <UInput v-model="editBandForm.website" type="url" />
            </UFormGroup>
          </div>

          <!-- Status Controls -->
          <div class="pt-4 border-t border-zinc-800">
            <h4 class="text-sm font-medium text-zinc-300 mb-3">Admin Controls</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Status">
                <USelectMenu
                  v-model="editBandForm.status"
                  :options="statusOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>
              <UFormGroup label="Genres">
                <UInput v-model="editBandForm.genresInput" placeholder="rock, pop, indie" />
              </UFormGroup>
            </div>

            <div v-if="editBandForm.status === 'suspended'" class="mt-4">
              <UFormGroup label="Suspension Reason">
                <UTextarea v-model="editBandForm.suspension_reason" rows="2" />
              </UFormGroup>
            </div>

            <div class="flex gap-4 mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <UCheckbox v-model="editBandForm.is_verified" />
                <span class="text-sm text-zinc-300">
                  <UIcon name="i-heroicons-check-badge" class="w-4 h-4 inline text-blue-400" />
                  Verified Artist
                </span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <UCheckbox v-model="editBandForm.is_featured" />
                <span class="text-sm text-zinc-300">
                  <UIcon name="i-heroicons-star" class="w-4 h-4 inline text-violet-400" />
                  Featured on Homepage
                </span>
              </label>
            </div>
          </div>

          <!-- Stripe Info (readonly for now) -->
          <div class="pt-4 border-t border-zinc-800">
            <h4 class="text-sm font-medium text-zinc-300 mb-3">Payment Info</h4>
            <div class="text-sm text-zinc-400 space-y-1">
              <p>Stripe Account: {{ bandToEdit.stripe_account_id || 'Not connected' }}</p>
              <p>Onboarding Complete: {{ bandToEdit.stripe_onboarding_complete ? 'Yes' : 'No' }}</p>
              <p>Total Earnings: {{ formatCurrency(bandToEdit.total_earnings_cents) }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showEditBandModal = false" :disabled="updatingBand">
              Cancel
            </UButton>
            <UButton color="violet" :loading="updatingBand" @click="handleUpdateBand">
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Band Confirmation Modal -->
    <UModal v-model="showDeleteBandModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Artist</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ bandToDelete?.name }}</strong>?
        </p>
        <p class="text-zinc-400 text-sm mt-2">
          This will permanently delete:
        </p>
        <ul class="text-zinc-400 text-sm mt-1 list-disc list-inside">
          <li>{{ bandToDelete?.album_count || 0 }} album(s)</li>
          <li>{{ bandToDelete?.track_count || 0 }} track(s)</li>
          <li>All listening history and analytics</li>
          <li>All earnings and payout records</li>
        </ul>
        <p class="text-red-400 text-sm mt-3">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteBandModal = false" :disabled="deletingBand">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingBand" @click="handleDeleteBand">
              Delete Artist
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Album Modal (using shared component) -->
    <AlbumEditModal
      v-model="showEditAlbumModal"
      :album="albumToEdit"
      :tracks="editAlbumTracks"
      :cover-url="editAlbumCoverUrl"
      :band-name="albumToEdit?.band?.name || ''"
      :band-id="albumToEdit?.band_id"
      :saving="savingAlbum"
      :uploading-cover="uploadingAlbumCover"
      :is-admin="true"
      @save="handleSaveAlbum"
      @cover-select="handleAlbumCoverSelect"
    />

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
          Are you sure you want to delete <strong>{{ albumToDelete?.title }}</strong>?
        </p>
        <p class="text-zinc-400 text-sm mt-2">
          This will permanently delete:
        </p>
        <ul class="text-zinc-400 text-sm mt-1 list-disc list-inside">
          <li>{{ albumToDelete?.track_count || 0 }} track(s)</li>
          <li>All track credits and metadata</li>
          <li>All listening history for this album</li>
        </ul>
        <p class="text-red-400 text-sm mt-3">This action cannot be undone.</p>

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
</template>

<script setup lang="ts">
import type { EditableTrack, AlbumEditForm } from '~/components/AlbumEditModal.vue'

definePageMeta({
  middleware: 'admin',
})

interface AdminUser {
  id: string
  email: string
  display_name: string | null
  role: 'user' | 'band' | 'admin'
  created_at: string
  updated_at: string
  band_count: number
  stream_count: number
}

interface AdminBand {
  id: string
  name: string
  slug: string
  tagline: string | null
  bio: string | null
  location: string | null
  website: string | null
  avatar_key: string | null
  banner_key: string | null
  theme_color: string
  genres: string[]
  is_verified: boolean
  is_featured: boolean
  featured_at: string | null
  featured_by: string | null
  status: 'active' | 'suspended' | 'removed'
  flag_count: number
  suspended_at: string | null
  suspended_by: string | null
  suspension_reason: string | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  total_streams: number
  total_earnings_cents: number
  created_at: string
  updated_at: string
  owner: {
    id: string
    email: string
    display_name: string | null
  }
  album_count: number
  track_count: number
}

interface ModerationQueueItem {
  id: string
  track_id: string
  band_id: string
  submitted_by: string
  priority: 'normal' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  track: {
    id: string
    title: string
    track_number: number
    duration_seconds: number
    is_explicit: boolean
    isrc: string | null
    iswc: string | null
    is_cover: boolean
    moderation_status: string
    moderation_notes: string | null
    moderated_at: string | null
    moderated_by: string | null
    audio_key: string | null
    album: {
      id: string
      title: string
      slug: string
      cover_key: string | null
    } | null
    credits?: Array<{
      id: string
      role: string
      name: string
      ipi_number: string | null
    }>
  }
  band: {
    id: string
    name: string
    slug: string
    avatar_key: string | null
    owner: {
      id: string
      email: string
      display_name: string | null
    }
  }
  submitter: {
    id: string
    email: string
    display_name: string | null
  }
}

const toast = useToast()
const client = useSupabaseClient()
const currentUser = useSupabaseUser()

const currentUserId = computed(() => currentUser.value?.id)
const currentTab = ref(0)

const tabs = computed(() => [
  { label: 'Overview', slot: 'overview', icon: 'i-heroicons-chart-bar' },
  {
    label: 'Track Moderation',
    slot: 'moderation',
    icon: 'i-heroicons-shield-check',
    badge: pendingModerationCount.value > 0 ? pendingModerationCount.value : undefined,
  },
  {
    label: 'Artist Approvals',
    slot: 'artist-approvals',
    icon: 'i-heroicons-user-plus',
    badge: pendingArtistCount.value > 0 ? pendingArtistCount.value : undefined,
  },
  { label: 'Users', slot: 'users', icon: 'i-heroicons-users' },
  { label: 'Artists', slot: 'artists', icon: 'i-heroicons-musical-note' },
  { label: 'Albums', slot: 'albums', icon: 'i-heroicons-square-3-stack-3d' },
  { label: 'Payouts', slot: 'payouts', icon: 'i-heroicons-banknotes' },
  { label: 'PRO Export', slot: 'pro-export', icon: 'i-heroicons-document-arrow-down' },
])

// Pending moderation count (fetched separately for badge)
const pendingModerationCount = ref(0)

// Pending artist approvals count
const pendingArtistCount = ref(0)

// Stats
const statsLoading = ref(true)
const stats = ref({
  totalStreams: 0,
  totalArtists: 0,
  totalTracks: 0,
  totalUsers: 0,
})

// Platform Settings
const settingsLoading = ref(false)
const platformSettings = ref({
  requireTrackModeration: false,
})

// Users
const users = ref<AdminUser[]>([])
const usersLoading = ref(false)
const userSearch = ref('')
const usersPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Artist', value: 'band' },
  { label: 'Admin', value: 'admin' },
]

// Delete user
const showDeleteUserModal = ref(false)
const deletingUser = ref(false)
const userToDelete = ref<AdminUser | null>(null)

// Artists/Bands
const bands = ref<AdminBand[]>([])
const bandsLoading = ref(false)
const bandSearch = ref('')
const bandStatusFilter = ref('all')
const bandFeaturedFilter = ref('all')
const bandVerifiedFilter = ref('all')
const bandsPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

const statusFilterOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Removed', value: 'removed' },
]

const featuredFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Featured', value: 'true' },
  { label: 'Not Featured', value: 'false' },
]

const verifiedFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'true' },
  { label: 'Not Verified', value: 'false' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Removed', value: 'removed' },
]

// Edit band
const showEditBandModal = ref(false)
const updatingBand = ref(false)
const bandToEdit = ref<AdminBand | null>(null)
const editBandForm = ref({
  name: '',
  slug: '',
  tagline: '',
  bio: '',
  location: '',
  website: '',
  status: 'active',
  is_verified: false,
  is_featured: false,
  suspension_reason: '',
  genresInput: '',
})

// Delete band
const showDeleteBandModal = ref(false)
const deletingBand = ref(false)
const bandToDelete = ref<AdminBand | null>(null)

// Albums
interface AdminAlbum {
  id: string
  band_id: string
  title: string
  slug: string
  description: string | null
  release_type: 'single' | 'ep' | 'album'
  release_date: string | null
  cover_key: string | null
  is_published: boolean
  upc: string | null
  label_name: string | null
  p_line: string | null
  c_line: string | null
  created_at: string
  updated_at: string
  band: { id: string; name: string; slug: string } | null
  track_count: number
  tracks?: AdminAlbumTrack[]
}

interface AdminAlbumTrack {
  id: string
  title: string
  track_number: number
  is_explicit: boolean
  isrc: string | null
  iswc: string | null
  moderation_status: string
  moderation_notes?: string | null
  credits?: Array<{ id: string; role: string; name: string; ipi_number: string | null }>
}

const albums = ref<AdminAlbum[]>([])
const albumsLoading = ref(false)
const albumSearch = ref('')
const albumPublishedFilter = ref('all')
const albumsPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

// Album edit state
const showEditAlbumModal = ref(false)
const albumToEdit = ref<AdminAlbum | null>(null)
const editAlbumTracks = ref<EditableTrack[]>([])
const editAlbumCoverUrl = ref<string | null>(null)
const savingAlbum = ref(false)
const uploadingAlbumCover = ref(false)

// Album delete state
const showDeleteAlbumModal = ref(false)
const deletingAlbum = ref(false)
const albumToDelete = ref<AdminAlbum | null>(null)

// Moderation Queue
const moderationQueue = ref<ModerationQueueItem[]>([])
const moderationLoading = ref(false)
const moderationSearch = ref('')
const moderationStatusFilter = ref('pending')
const moderationPriorityFilter = ref('all')
const moderationPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

const moderationStatusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Pending Update', value: 'pending_update' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Revision Requested', value: 'revision_requested' },
]

const moderationPriorityOptions = [
  { label: 'All Priority', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
]

// Track detail modal
const showTrackDetailModal = ref(false)
const selectedQueueItem = ref<ModerationQueueItem | null>(null)
const loadingTrackDetail = ref(false)

// Artist Approvals Queue
interface PendingArtist {
  id: string
  name: string
  slug: string
  bio: string | null
  location: string | null
  website: string | null
  avatar_key: string | null
  avatar_url: string | null
  genres: string[]
  status: string
  created_at: string
  // Social links
  instagram: string | null
  twitter: string | null
  facebook: string | null
  youtube: string | null
  spotify: string | null
  soundcloud: string | null
  bandcamp: string | null
  tiktok: string | null
  owner: {
    id: string
    email: string
    display_name: string | null
  } | null
}

const pendingArtists = ref<PendingArtist[]>([])
const artistApprovalsLoading = ref(false)
const artistApprovalsStatusFilter = ref('pending')
const showRejectArtistModal = ref(false)
const artistToReject = ref<PendingArtist | null>(null)
const rejectArtistReason = ref('')
const artistActionLoading = ref(false)
const showArtistDetailModal = ref(false)
const selectedArtist = ref<PendingArtist | null>(null)

// Moderation actions
const moderationActionLoading = ref(false)
const moderationNotes = ref('')
const showRejectModal = ref(false)
const showRevisionModal = ref(false)

// Audio preview
const audioPreviewUrl = ref<string | null>(null)
const isPlaying = ref(false)
const audioLoading = ref(false)
const audioElement = ref<HTMLAudioElement | null>(null)

// PRO Export
const startDate = ref('')
const endDate = ref('')
const selectedPreset = ref('last-quarter')
const exporting = ref(false)

const currentYear = new Date().getFullYear()

const quarterPresets = [
  { label: 'Q1 ' + currentYear, value: 'q1' },
  { label: 'Q2 ' + currentYear, value: 'q2' },
  { label: 'Q3 ' + currentYear, value: 'q3' },
  { label: 'Q4 ' + currentYear, value: 'q4' },
  { label: 'Last Quarter', value: 'last-quarter' },
  { label: 'Last Month', value: 'last-month' },
  { label: 'Custom', value: 'custom' },
]

// Payouts
interface PayoutCalculationResult {
  success: boolean
  periodId: string
  periodStart: string
  periodEnd: string
  totalRevenue: number
  artistPool: number
  platformFee: number
  totalStreams: number
  artistsCount: number
  subscribersCount: number
}

interface PayoutProcessResult {
  success: boolean
  processed: number
  failed: number
  skipped: number
  totalAmount: number
  results: Array<{
    bandId: string
    bandName: string
    amount: number
    status: 'success' | 'failed' | 'skipped'
    error?: string
    transferId?: string
  }>
}

const payoutMonth = ref(new Date().getMonth())
const payoutYear = ref(new Date().getFullYear())
const calculatingPayouts = ref(false)
const processingPayouts = ref(false)
const payoutCalculation = ref<PayoutCalculationResult | null>(null)
const payoutResults = ref<PayoutProcessResult | null>(null)

const monthOptions = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 },
]

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  label: String(currentYear - i),
  value: currentYear - i,
}))

// Helpers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Check if artist has any social links
const hasAnySocialLink = (artist: PendingArtist): boolean => {
  return !!(
    artist.instagram ||
    artist.twitter ||
    artist.facebook ||
    artist.youtube ||
    artist.spotify ||
    artist.soundcloud ||
    artist.bandcamp ||
    artist.tiktok
  )
}

// Format social URL (handle both usernames and full URLs)
const formatSocialUrl = (value: string, platform: string): string => {
  // If it already looks like a URL, return as-is
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  // Remove @ if present
  const username = value.replace(/^@/, '')

  // Build URL based on platform
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${username}`
    case 'twitter':
      return `https://x.com/${username}`
    case 'tiktok':
      return `https://tiktok.com/@${username}`
    case 'facebook':
      return `https://facebook.com/${username}`
    case 'youtube':
      return `https://youtube.com/${username}`
    case 'spotify':
      return value // Spotify URLs are complex, assume they passed a full URL
    case 'soundcloud':
      return `https://soundcloud.com/${username}`
    case 'bandcamp':
      return `https://${username}.bandcamp.com`
    default:
      return value
  }
}

// Load stats
const loadStats = async () => {
  statsLoading.value = true
  try {
    const { count: streamCount } = await client
      .from('listening_history')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)

    const { count: artistCount } = await client
      .from('bands')
      .select('*', { count: 'exact', head: true })

    const { count: trackCount } = await client
      .from('tracks')
      .select('*', { count: 'exact', head: true })

    const { count: userCount } = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    stats.value = {
      totalStreams: streamCount || 0,
      totalArtists: artistCount || 0,
      totalTracks: trackCount || 0,
      totalUsers: userCount || 0,
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    statsLoading.value = false
  }
}

// Load users
const loadUsers = async (page = 1) => {
  usersLoading.value = true
  try {
    const data = await $fetch('/api/admin/users', {
      query: {
        page,
        limit: 50,
        search: userSearch.value,
      },
    })

    users.value = data.users as AdminUser[]
    usersPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load users:', e)
    toast.add({
      title: 'Failed to load users',
      description: e.message,
      color: 'red',
    })
  } finally {
    usersLoading.value = false
  }
}

// Update user role
const updateUserRole = async (userId: string, role: string) => {
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: { role },
    })

    // Update local state
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.role = role as 'user' | 'band' | 'admin'
    }

    toast.add({
      title: 'Role updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to update role:', e)
    toast.add({
      title: 'Failed to update role',
      description: e.data?.message || e.message,
      color: 'red',
    })
  }
}

// Delete user
const confirmDeleteUser = (user: AdminUser) => {
  userToDelete.value = user
  showDeleteUserModal.value = true
}

const handleDeleteUser = async () => {
  if (!userToDelete.value) return

  deletingUser.value = true
  try {
    await $fetch(`/api/admin/users/${userToDelete.value.id}`, {
      method: 'DELETE',
    })

    // Remove from local state
    users.value = users.value.filter(u => u.id !== userToDelete.value!.id)
    usersPagination.value.total -= 1

    toast.add({
      title: 'User deleted',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showDeleteUserModal.value = false

    // Reload stats
    loadStats()
  } catch (e: any) {
    console.error('Failed to delete user:', e)
    toast.add({
      title: 'Failed to delete user',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    deletingUser.value = false
  }
}

// Load bands
const loadBands = async (page = 1) => {
  bandsLoading.value = true
  try {
    const data = await $fetch('/api/admin/bands', {
      query: {
        page,
        limit: 50,
        search: bandSearch.value,
        status: bandStatusFilter.value,
        featured: bandFeaturedFilter.value,
        verified: bandVerifiedFilter.value,
      },
    })

    bands.value = data.bands as AdminBand[]
    bandsPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load bands:', e)
    toast.add({
      title: 'Failed to load artists',
      description: e.message,
      color: 'red',
    })
  } finally {
    bandsLoading.value = false
  }
}

// Open edit band modal
const openEditBandModal = (band: AdminBand) => {
  bandToEdit.value = band
  editBandForm.value = {
    name: band.name,
    slug: band.slug,
    tagline: band.tagline || '',
    bio: band.bio || '',
    location: band.location || '',
    website: band.website || '',
    status: band.status,
    is_verified: band.is_verified,
    is_featured: band.is_featured,
    suspension_reason: band.suspension_reason || '',
    genresInput: band.genres?.join(', ') || '',
  }
  showEditBandModal.value = true
}

// Update band
const handleUpdateBand = async () => {
  if (!bandToEdit.value) return

  updatingBand.value = true
  try {
    // Parse genres from comma-separated string
    const genres = editBandForm.value.genresInput
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0)

    await $fetch(`/api/admin/bands/${bandToEdit.value.id}`, {
      method: 'PATCH',
      body: {
        name: editBandForm.value.name,
        slug: editBandForm.value.slug,
        tagline: editBandForm.value.tagline,
        bio: editBandForm.value.bio,
        location: editBandForm.value.location,
        website: editBandForm.value.website,
        status: editBandForm.value.status,
        is_verified: editBandForm.value.is_verified,
        is_featured: editBandForm.value.is_featured,
        suspension_reason: editBandForm.value.suspension_reason,
        genres,
      },
    })

    toast.add({
      title: 'Artist updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showEditBandModal.value = false

    // Reload bands
    loadBands(bandsPagination.value.page)
    loadStats()
  } catch (e: any) {
    console.error('Failed to update band:', e)
    toast.add({
      title: 'Failed to update artist',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    updatingBand.value = false
  }
}

// Delete band
const confirmDeleteBand = (band: AdminBand) => {
  bandToDelete.value = band
  showDeleteBandModal.value = true
}

const handleDeleteBand = async () => {
  if (!bandToDelete.value) return

  deletingBand.value = true
  try {
    await $fetch(`/api/admin/bands/${bandToDelete.value.id}`, {
      method: 'DELETE',
    })

    // Remove from local state
    bands.value = bands.value.filter(b => b.id !== bandToDelete.value!.id)
    bandsPagination.value.total -= 1

    toast.add({
      title: 'Artist deleted',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showDeleteBandModal.value = false

    // Reload stats
    loadStats()
  } catch (e: any) {
    console.error('Failed to delete band:', e)
    toast.add({
      title: 'Failed to delete artist',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    deletingBand.value = false
  }
}

// Albums management
const loadAlbums = async (page = 1) => {
  albumsLoading.value = true
  try {
    const data = await $fetch('/api/admin/albums', {
      query: {
        page,
        limit: 50,
        search: albumSearch.value,
        published: albumPublishedFilter.value,
      },
    })

    albums.value = data.albums as AdminAlbum[]
    albumsPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load albums:', e)
    toast.add({
      title: 'Failed to load albums',
      description: e.message,
      color: 'red',
    })
  } finally {
    albumsLoading.value = false
  }
}

const openEditAlbumModal = async (album: AdminAlbum) => {
  albumToEdit.value = album
  editAlbumCoverUrl.value = null

  // Fetch full album with tracks
  try {
    const data = await $fetch(`/api/admin/albums/${album.id}`)
    const fullAlbum = data.album as AdminAlbum

    // Convert tracks to editable format
    editAlbumTracks.value = (fullAlbum.tracks || []).map(t => ({
      id: t.id,
      title: t.title,
      track_number: t.track_number,
      is_explicit: t.is_explicit,
      isrc: t.isrc,
      iswc: t.iswc,
      moderation_status: t.moderation_status || 'pending',
      moderation_notes: t.moderation_notes,
      showCredits: false,
      credits: (t.credits || []).map(c => ({
        role: c.role,
        name: c.name,
        ipi_number: c.ipi_number || '',
      })),
    }))

    // Get cover URL if exists
    if (fullAlbum.cover_key) {
      try {
        const encodedKey = btoa(fullAlbum.cover_key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
        editAlbumCoverUrl.value = response.url
      } catch {
        // Cover URL fetch failed, ignore
      }
    }

    showEditAlbumModal.value = true
  } catch (e: any) {
    console.error('Failed to fetch album details:', e)
    toast.add({
      title: 'Failed to load album',
      description: e.message,
      color: 'red',
    })
  }
}

const handleSaveAlbum = async (form: AlbumEditForm, tracks: EditableTrack[]) => {
  if (!albumToEdit.value) return

  savingAlbum.value = true
  try {
    await $fetch(`/api/admin/albums/${albumToEdit.value.id}`, {
      method: 'PATCH',
      body: {
        title: form.title,
        description: form.description || null,
        release_type: form.release_type,
        release_date: form.release_date || null,
        is_published: form.is_published,
        label_name: form.label_name || null,
        p_line: form.p_line || null,
        c_line: form.c_line || null,
        upc: form.upc || null,
        tracks: tracks.map(t => ({
          id: t.id,
          title: t.title,
          track_number: t.track_number,
          is_explicit: t.is_explicit,
          isrc: t.isrc,
          iswc: t.iswc,
          moderation_status: t.moderation_status,
        })),
      },
    })

    toast.add({
      title: 'Album updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showEditAlbumModal.value = false
    loadAlbums(albumsPagination.value.page)
  } catch (e: any) {
    console.error('Failed to update album:', e)
    toast.add({
      title: 'Failed to update album',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    savingAlbum.value = false
  }
}

const handleAlbumCoverSelect = async (file: File) => {
  // For admin, cover upload is not implemented - they can edit via artist dashboard
  toast.add({
    title: 'Cover upload not available',
    description: 'Album covers must be changed through the artist dashboard',
    color: 'yellow',
  })
}

const confirmDeleteAlbum = (album: AdminAlbum) => {
  albumToDelete.value = album
  showDeleteAlbumModal.value = true
}

const handleDeleteAlbum = async () => {
  if (!albumToDelete.value) return

  deletingAlbum.value = true
  try {
    await $fetch(`/api/admin/albums/${albumToDelete.value.id}`, {
      method: 'DELETE',
    })

    albums.value = albums.value.filter(a => a.id !== albumToDelete.value!.id)
    albumsPagination.value.total -= 1

    toast.add({
      title: 'Album deleted',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showDeleteAlbumModal.value = false
    loadStats()
  } catch (e: any) {
    console.error('Failed to delete album:', e)
    toast.add({
      title: 'Failed to delete album',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    deletingAlbum.value = false
  }
}

// PRO Export
const applyPreset = (preset: string) => {
  selectedPreset.value = preset
  const now = new Date()
  const year = now.getFullYear()

  switch (preset) {
    case 'q1':
      startDate.value = `${year}-01-01`
      endDate.value = `${year}-03-31`
      break
    case 'q2':
      startDate.value = `${year}-04-01`
      endDate.value = `${year}-06-30`
      break
    case 'q3':
      startDate.value = `${year}-07-01`
      endDate.value = `${year}-09-30`
      break
    case 'q4':
      startDate.value = `${year}-10-01`
      endDate.value = `${year}-12-31`
      break
    case 'last-quarter': {
      const quarterEnd = new Date(year, now.getMonth(), 0)
      const quarterStart = new Date(quarterEnd.getFullYear(), quarterEnd.getMonth() - 2, 1)
      startDate.value = quarterStart.toISOString().split('T')[0]
      endDate.value = quarterEnd.toISOString().split('T')[0]
      break
    }
    case 'last-month': {
      const lastMonth = new Date(year, now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(year, now.getMonth(), 0)
      startDate.value = lastMonth.toISOString().split('T')[0]
      endDate.value = lastMonthEnd.toISOString().split('T')[0]
      break
    }
    case 'custom':
      break
  }
}

const downloadExport = async () => {
  if (!startDate.value || !endDate.value) {
    toast.add({ title: 'Please select a date range', color: 'red' })
    return
  }

  exporting.value = true

  try {
    const response = await $fetch('/api/admin/pro-export', {
      method: 'POST',
      body: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    })

    const blob = new Blob([response as string], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suisa-report-${startDate.value}-to-${endDate.value}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.add({
      title: 'Export downloaded',
      description: 'CSV file saved to your downloads',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Export failed:', e)
    toast.add({
      title: 'Export failed',
      description: e.data?.message || e.message || 'Failed to generate report',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    exporting.value = false
  }
}

// Calculate payouts for a period
const calculatePayouts = async () => {
  const periodStart = new Date(payoutYear.value, payoutMonth.value, 1)
  const periodEnd = new Date(payoutYear.value, payoutMonth.value + 1, 0)

  calculatingPayouts.value = true
  payoutCalculation.value = null
  payoutResults.value = null

  try {
    const result = await $fetch<PayoutCalculationResult>('/api/admin/calculate-payouts', {
      method: 'POST',
      body: {
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      },
    })

    payoutCalculation.value = result

    toast.add({
      title: 'Payouts Calculated',
      description: `${result.artistsCount} artists have earnings to distribute.`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Calculate payouts error:', e)
    toast.add({
      title: 'Calculation Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    calculatingPayouts.value = false
  }
}

// Process payouts (send Stripe transfers)
const processPayouts = async () => {
  processingPayouts.value = true

  try {
    const result = await $fetch<PayoutProcessResult>('/api/admin/process-payouts', {
      method: 'POST',
      body: {},
    })

    payoutResults.value = result

    if (result.processed > 0) {
      toast.add({
        title: 'Payouts Processed',
        description: `${result.processed} payouts sent, ${result.failed} failed, ${result.skipped} skipped.`,
        color: 'green',
        icon: 'i-heroicons-check-circle',
      })
    } else {
      toast.add({
        title: 'No Payouts Sent',
        description: result.results[0]?.error || 'No artists have connected Stripe accounts with balance >= $10.',
        color: 'yellow',
        icon: 'i-heroicons-information-circle',
      })
    }
  } catch (e: any) {
    console.error('Process payouts error:', e)
    toast.add({
      title: 'Processing Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    processingPayouts.value = false
  }
}

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// ============================================
// PLATFORM SETTINGS FUNCTIONS
// ============================================

const loadPlatformSettings = async () => {
  try {
    const data = await $fetch<Record<string, { value: any }>>('/api/admin/settings')
    platformSettings.value.requireTrackModeration = data.require_track_moderation?.value === true || data.require_track_moderation?.value === 'true'
  } catch (e: any) {
    console.error('Failed to load platform settings:', e)
  }
}

const updateSetting = async (key: string, value: any) => {
  settingsLoading.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      body: { key, value },
    })

    toast.add({
      title: 'Setting updated',
      description: key === 'require_track_moderation'
        ? (value ? 'Track moderation is now enabled' : 'Track moderation is now disabled')
        : 'Setting saved successfully',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to update setting:', e)
    toast.add({
      title: 'Failed to update setting',
      description: e.message,
      color: 'red',
    })
    // Revert the toggle
    if (key === 'require_track_moderation') {
      platformSettings.value.requireTrackModeration = !value
    }
  } finally {
    settingsLoading.value = false
  }
}

// ============================================
// MODERATION QUEUE FUNCTIONS
// ============================================

// Computed stats for moderation queue
const pendingCount = computed(() => {
  return moderationQueue.value.filter(item => item.status === 'pending' || item.status === 'pending_update').length
})

const urgentCount = computed(() => {
  return moderationQueue.value.filter(item => item.priority === 'urgent' && (item.status === 'pending' || item.status === 'pending_update')).length
})

const approvedTodayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return moderationQueue.value.filter(item =>
    item.status === 'approved' && item.reviewed_at?.startsWith(today),
  ).length
})

const revisionRequestedCount = computed(() => {
  return moderationQueue.value.filter(item => item.status === 'revision_requested').length
})

// Fetch pending count for tab badge
const fetchPendingCount = async () => {
  try {
    const data = await $fetch<{ total: number }>('/api/admin/moderation-queue', {
      query: { status: 'pending', limit: 1 },
    })
    pendingModerationCount.value = data.total
  } catch (e) {
    console.error('Failed to fetch pending count:', e)
  }
}

// Load moderation queue
const loadModerationQueue = async (page = 1) => {
  moderationLoading.value = true
  try {
    const data = await $fetch<{
      items: ModerationQueueItem[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>('/api/admin/moderation-queue', {
      query: {
        page,
        limit: 50,
        search: moderationSearch.value,
        status: moderationStatusFilter.value,
        priority: moderationPriorityFilter.value,
      },
    })

    moderationQueue.value = data.items
    moderationPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }

    // Update pending count for badge
    if (moderationStatusFilter.value === 'pending' || moderationStatusFilter.value === 'all') {
      fetchPendingCount()
    }
  } catch (e: any) {
    console.error('Failed to load moderation queue:', e)
    toast.add({
      title: 'Failed to load moderation queue',
      description: e.message,
      color: 'red',
    })
  } finally {
    moderationLoading.value = false
  }
}

// Load artist approvals queue
const loadArtistApprovals = async () => {
  artistApprovalsLoading.value = true
  try {
    const data = await $fetch<{
      bands: PendingArtist[]
      total: number
      pendingCount: number
    }>('/api/admin/artist-approvals', {
      query: {
        status: artistApprovalsStatusFilter.value,
      },
    })

    pendingArtists.value = data.bands
    pendingArtistCount.value = data.pendingCount
  } catch (e: any) {
    console.error('Failed to load artist approvals:', e)
    toast.add({
      title: 'Failed to load artist approvals',
      description: e.message,
      color: 'red',
    })
  } finally {
    artistApprovalsLoading.value = false
  }
}

// Approve artist
const approveArtist = async (artist: PendingArtist) => {
  artistActionLoading.value = true
  try {
    await $fetch(`/api/admin/artist-approvals/${artist.id}/approve`, {
      method: 'POST',
    })

    toast.add({
      title: 'Artist Approved',
      description: `${artist.name} has been approved`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    // Reload the list
    await loadArtistApprovals()
  } catch (e: any) {
    console.error('Failed to approve artist:', e)
    toast.add({
      title: 'Failed to approve artist',
      description: e.message,
      color: 'red',
    })
  } finally {
    artistActionLoading.value = false
  }
}

// Open reject artist modal
// Open artist detail modal
const openArtistDetail = (artist: PendingArtist) => {
  selectedArtist.value = artist
  showArtistDetailModal.value = true
}

const openRejectArtistModal = (artist: PendingArtist) => {
  artistToReject.value = artist
  rejectArtistReason.value = ''
  showRejectArtistModal.value = true
}

// Reject artist
const rejectArtist = async () => {
  if (!artistToReject.value || !rejectArtistReason.value.trim()) return

  artistActionLoading.value = true
  try {
    await $fetch(`/api/admin/artist-approvals/${artistToReject.value.id}/reject`, {
      method: 'POST',
      body: { reason: rejectArtistReason.value },
    })

    toast.add({
      title: 'Artist Rejected',
      description: `${artistToReject.value.name} has been rejected`,
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })

    showRejectArtistModal.value = false
    artistToReject.value = null
    rejectArtistReason.value = ''

    // Reload the list
    await loadArtistApprovals()
  } catch (e: any) {
    console.error('Failed to reject artist:', e)
    toast.add({
      title: 'Failed to reject artist',
      description: e.message,
      color: 'red',
    })
  } finally {
    artistActionLoading.value = false
  }
}

// Helper functions
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'yellow'
    case 'pending_update': return 'blue'
    case 'approved': return 'green'
    case 'rejected': return 'red'
    case 'revision_requested': return 'orange'
    default: return 'gray'
  }
}

const formatStatus = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending'
    case 'pending_update': return 'Update Pending'
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'revision_requested': return 'Revision Requested'
    default: return status
  }
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Open track detail modal
const openTrackDetail = async (item: ModerationQueueItem) => {
  selectedQueueItem.value = item
  moderationNotes.value = ''
  showTrackDetailModal.value = true
  loadingTrackDetail.value = true

  try {
    // Load full track details
    const fullItem = await $fetch<ModerationQueueItem>(`/api/admin/moderation-queue/${item.id}`)
    selectedQueueItem.value = fullItem

    // Load audio preview URL if audio_key exists
    if (fullItem.track?.audio_key) {
      try {
        const encodedKey = btoa(fullItem.track.audio_key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
        audioPreviewUrl.value = response.url
      } catch (err) {
        console.error('Failed to get stream URL:', err)
        audioPreviewUrl.value = null
      }
    } else {
      audioPreviewUrl.value = null
    }
  } catch (e: any) {
    console.error('Failed to load track details:', e)
    toast.add({
      title: 'Failed to load track details',
      description: e.message,
      color: 'red',
    })
  } finally {
    loadingTrackDetail.value = false
  }
}

const closeTrackDetail = () => {
  if (isPlaying.value && audioElement.value) {
    audioElement.value.pause()
    isPlaying.value = false
  }
  showTrackDetailModal.value = false
  selectedQueueItem.value = null
  audioPreviewUrl.value = null
  audioLoading.value = false
  moderationNotes.value = ''
}

// Audio preview
const toggleAudioPreview = () => {
  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    audioLoading.value = true
    audioElement.value.play()
      .then(() => {
        isPlaying.value = true
        audioLoading.value = false
      })
      .catch((e) => {
        console.error('Failed to play audio:', e)
        audioLoading.value = false
        toast.add({
          title: 'Failed to play audio',
          description: e.message,
          color: 'red',
        })
      })
  }
}

const handleAudioError = (e: Event) => {
  console.error('Audio error:', e)
  audioLoading.value = false
  isPlaying.value = false
  toast.add({
    title: 'Audio playback error',
    description: 'Failed to load audio file',
    color: 'red',
  })
}

// Priority menu items
const getPriorityMenuItems = (item: ModerationQueueItem) => {
  const priorities = ['urgent', 'high', 'normal'] as const
  return [priorities.filter(p => p !== item.priority).map(priority => ({
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    icon: priority === 'urgent' ? 'i-heroicons-exclamation-triangle' : priority === 'high' ? 'i-heroicons-arrow-up' : 'i-heroicons-minus',
    click: () => updatePriority(item.id, priority),
  }))]
}

const updatePriority = async (queueId: string, priority: string) => {
  try {
    await $fetch(`/api/admin/moderation-queue/${queueId}/priority`, {
      method: 'PATCH',
      body: { priority },
    })

    // Update local state
    const item = moderationQueue.value.find(i => i.id === queueId)
    if (item) {
      item.priority = priority as 'normal' | 'high' | 'urgent'
    }

    toast.add({
      title: 'Priority updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to update priority:', e)
    toast.add({
      title: 'Failed to update priority',
      description: e.message,
      color: 'red',
    })
  }
}

// Quick approve from table
const handleQuickApprove = async (item: ModerationQueueItem) => {
  selectedQueueItem.value = item
  await performApprove()
}

// Approve track
const handleApprove = async () => {
  await performApprove()
}

const performApprove = async () => {
  if (!selectedQueueItem.value) return

  moderationActionLoading.value = true
  try {
    await $fetch(`/api/admin/moderation-queue/${selectedQueueItem.value.id}/approve`, {
      method: 'POST',
      body: { notes: moderationNotes.value || null },
    })

    toast.add({
      title: 'Track approved',
      description: `"${selectedQueueItem.value.track?.title}" has been approved.`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    // Remove from queue or update status
    moderationQueue.value = moderationQueue.value.filter(i => i.id !== selectedQueueItem.value!.id)
    pendingModerationCount.value = Math.max(0, pendingModerationCount.value - 1)
    closeTrackDetail()
    loadModerationQueue(moderationPagination.value.page)
  } catch (e: any) {
    console.error('Failed to approve track:', e)
    toast.add({
      title: 'Failed to approve track',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    moderationActionLoading.value = false
  }
}

// Reject track
const openRejectModal = (item: ModerationQueueItem) => {
  selectedQueueItem.value = item
  moderationNotes.value = ''
  showRejectModal.value = true
}

const handleReject = () => {
  if (!moderationNotes.value.trim()) {
    showRejectModal.value = true
    return
  }
  confirmReject()
}

const confirmReject = async () => {
  if (!selectedQueueItem.value || !moderationNotes.value.trim()) return

  moderationActionLoading.value = true
  try {
    await $fetch(`/api/admin/moderation-queue/${selectedQueueItem.value.id}/reject`, {
      method: 'POST',
      body: { notes: moderationNotes.value },
    })

    toast.add({
      title: 'Track rejected',
      description: `"${selectedQueueItem.value.track?.title}" has been rejected.`,
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })

    moderationQueue.value = moderationQueue.value.filter(i => i.id !== selectedQueueItem.value!.id)
    pendingModerationCount.value = Math.max(0, pendingModerationCount.value - 1)
    showRejectModal.value = false
    closeTrackDetail()
    loadModerationQueue(moderationPagination.value.page)
  } catch (e: any) {
    console.error('Failed to reject track:', e)
    toast.add({
      title: 'Failed to reject track',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    moderationActionLoading.value = false
  }
}

// Request revision
const handleRequestRevision = () => {
  if (!moderationNotes.value.trim()) {
    showRevisionModal.value = true
    return
  }
  confirmRequestRevision()
}

const confirmRequestRevision = async () => {
  if (!selectedQueueItem.value || !moderationNotes.value.trim()) return

  moderationActionLoading.value = true
  try {
    await $fetch(`/api/admin/moderation-queue/${selectedQueueItem.value.id}/request-revision`, {
      method: 'POST',
      body: { notes: moderationNotes.value },
    })

    toast.add({
      title: 'Revision requested',
      description: `Revision requested for "${selectedQueueItem.value.track?.title}".`,
      color: 'orange',
      icon: 'i-heroicons-arrow-path',
    })

    // Update local state
    const item = moderationQueue.value.find(i => i.id === selectedQueueItem.value!.id)
    if (item) {
      item.status = 'revision_requested'
      item.notes = moderationNotes.value
    }
    pendingModerationCount.value = Math.max(0, pendingModerationCount.value - 1)

    showRevisionModal.value = false
    closeTrackDetail()
    loadModerationQueue(moderationPagination.value.page)
  } catch (e: any) {
    console.error('Failed to request revision:', e)
    toast.add({
      title: 'Failed to request revision',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    moderationActionLoading.value = false
  }
}

// Search debounce (users)
let searchTimeout: ReturnType<typeof setTimeout>
watch(userSearch, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers(1)
  }, 300)
})

// Search debounce (bands)
let bandSearchTimeout: ReturnType<typeof setTimeout>
watch(bandSearch, () => {
  clearTimeout(bandSearchTimeout)
  bandSearchTimeout = setTimeout(() => {
    loadBands(1)
  }, 300)
})

// Search debounce (albums)
let albumSearchTimeout: ReturnType<typeof setTimeout>
watch(albumSearch, () => {
  clearTimeout(albumSearchTimeout)
  albumSearchTimeout = setTimeout(() => {
    loadAlbums(1)
  }, 300)
})

// Search debounce (moderation)
let moderationSearchTimeout: ReturnType<typeof setTimeout>
watch(moderationSearch, () => {
  clearTimeout(moderationSearchTimeout)
  moderationSearchTimeout = setTimeout(() => {
    loadModerationQueue(1)
  }, 300)
})

// Watch band filters
watch([bandStatusFilter, bandFeaturedFilter, bandVerifiedFilter], () => {
  loadBands(1)
})

// Watch moderation filters
watch([moderationStatusFilter, moderationPriorityFilter], () => {
  loadModerationQueue(1)
})

onMounted(() => {
  loadStats()
  loadUsers()
  loadBands()
  loadAlbums()
  loadModerationQueue()
  loadArtistApprovals()
  fetchPendingCount()
  loadPlatformSettings()
  applyPreset('last-quarter')
})
</script>
