<template>
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
  </div>
</template>

<script setup lang="ts">
import type { AdminUser } from '~/types/admin'
import { roleOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const props = defineProps<{
  currentUserId?: string
}>()

const { toast, formatDate } = useAdminUtils()

// State
const users = ref<AdminUser[]>([])
const usersLoading = ref(false)
const userSearch = ref('')
const usersPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

// Delete user
const showDeleteUserModal = ref(false)
const deletingUser = ref(false)
const userToDelete = ref<AdminUser | null>(null)

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

onMounted(() => {
  loadUsers()
})
</script>
