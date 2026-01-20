<template>
  <UModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :ui="{ width: 'sm:max-w-2xl' }">
    <UCard v-if="album">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-zinc-100">Edit Album</h3>
          <p v-if="isAdmin && album.band" class="text-sm text-zinc-400">{{ album.band.name }}</p>
        </div>
      </template>

      <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <!-- Cover Image -->
        <div class="flex gap-6">
          <div class="shrink-0">
            <div class="w-32 h-32 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
              <img
                v-if="coverPreview || coverUrl"
                :src="coverPreview || coverUrl"
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
              ref="coverInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleCoverSelect"
            />
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              :loading="uploadingCover"
              :disabled="saving"
              @click="coverInput?.click()"
            >
              <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-1" />
              {{ uploadingCover ? 'Uploading...' : 'Change Cover' }}
            </UButton>
          </div>
        </div>

        <!-- Album Details -->
        <div class="space-y-4">
          <UFormGroup label="Title" required>
            <UInput
              v-model="form.title"
              placeholder="Album title"
              size="lg"
              :disabled="saving"
            />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea
              v-model="form.description"
              placeholder="Album description..."
              :rows="3"
              size="lg"
              :disabled="saving"
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Release Type">
              <USelect
                v-model="form.release_type"
                :options="releaseTypeOptions"
                size="lg"
                :disabled="saving"
              />
            </UFormGroup>

            <UFormGroup label="Release Date">
              <UInput
                v-model="form.release_date"
                type="date"
                size="lg"
                :disabled="saving"
              />
            </UFormGroup>
          </div>

          <!-- Rights Metadata -->
          <div class="border-t border-zinc-800 pt-4 mt-2">
            <h4 class="text-sm font-medium text-zinc-300 mb-3">Rights Metadata</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Label Name" hint="Optional">
                <UInput
                  v-model="form.label_name"
                  :placeholder="bandName || 'Self-released'"
                  size="lg"
                  :disabled="saving"
                />
              </UFormGroup>

              <UFormGroup label="℗ Line (Sound Recording)" hint="Optional">
                <UInput
                  v-model="form.p_line"
                  :placeholder="`℗ ${new Date().getFullYear()} ${form.label_name || bandName || 'Label'}`"
                  size="lg"
                  :disabled="saving"
                />
              </UFormGroup>

              <UFormGroup label="© Line (Composition)" hint="Optional">
                <UInput
                  v-model="form.c_line"
                  :placeholder="`© ${new Date().getFullYear()} ${form.label_name || bandName || 'Publisher'}`"
                  size="lg"
                  :disabled="saving"
                />
              </UFormGroup>

              <!-- Admin only: UPC -->
              <UFormGroup v-if="isAdmin" label="UPC" hint="Optional">
                <UInput
                  v-model="form.upc"
                  placeholder="Universal Product Code"
                  size="lg"
                  :disabled="saving"
                />
              </UFormGroup>
            </div>
          </div>

          <UFormGroup label="Published">
            <UToggle
              v-model="form.is_published"
              :disabled="saving"
            />
            <template #help>
              <span class="text-zinc-500">{{ form.is_published ? 'Album is visible to the public' : 'Album is saved as a draft' }}</span>
            </template>
          </UFormGroup>
        </div>

        <!-- Tracks Section -->
        <div class="border-t border-zinc-800 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-zinc-300">Tracks ({{ localTracks.length }})</h4>
            <UButton
              v-if="!isAdmin"
              color="violet"
              variant="outline"
              size="xs"
              :disabled="saving"
              @click="$emit('add-track')"
            >
              <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
              Add Track
            </UButton>
          </div>

          <div v-if="localTracks.length === 0" class="text-center py-4 text-zinc-500 text-sm">
            No tracks in this album
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(track, index) in localTracks"
              :key="track.id"
              class="p-3 bg-zinc-800/50 rounded-lg space-y-3 border border-zinc-700"
              :class="{ 'border-violet-500 bg-violet-500/10': dragOverIndex === index }"
              @dragover.prevent="onDragOver(index)"
              @dragleave="onDragLeave"
              @drop.prevent="onDrop(index)"
            >
              <!-- Track Header Row -->
              <div class="flex items-center gap-3">
                <!-- Drag Handle (only for non-admin, only this is draggable) -->
                <div
                  v-if="!isAdmin"
                  class="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 select-none"
                  draggable="true"
                  @dragstart="onDragStart($event, index)"
                  @dragend="onDragEnd"
                >
                  <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
                </div>

                <!-- Track Number -->
                <div class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {{ index + 1 }}
                </div>

                <!-- Track Title -->
                <div class="flex-1 min-w-0">
                  <UInput
                    v-model="track.title"
                    placeholder="Track title"
                    size="sm"
                    class="font-semibold text-zinc-100"
                    :disabled="saving"
                  />
                </div>

                <!-- Admin: Moderation Status Selector -->
                <USelectMenu
                  v-if="isAdmin"
                  v-model="track.moderation_status"
                  :options="moderationStatusOptions"
                  value-attribute="value"
                  option-attribute="label"
                  size="sm"
                  class="w-32"
                  :disabled="saving"
                />

                <!-- Non-admin: Moderation Status Badge -->
                <UBadge
                  v-else-if="track.moderation_status"
                  :color="getModerationColor(track.moderation_status)"
                  variant="subtle"
                  size="xs"
                >
                  {{ getModerationLabel(track.moderation_status) }}
                </UBadge>

                <UCheckbox
                  v-model="track.is_explicit"
                  label="Explicit"
                  :disabled="saving"
                />

                <UCheckbox
                  v-if="!isAdmin"
                  v-model="track.is_cover"
                  label="Cover"
                  :disabled="saving"
                />

                <UButton
                  v-if="!isAdmin"
                  color="red"
                  variant="ghost"
                  size="xs"
                  :disabled="saving"
                  @click="$emit('delete-track', track)"
                >
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                </UButton>
              </div>

              <!-- Admin Feedback (for rejected/revision_requested tracks) - non-admin only -->
              <div
                v-if="!isAdmin && track.moderation_notes && ['rejected', 'revision_requested'].includes(track.moderation_status)"
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
              <div class="flex items-center gap-3" :class="isAdmin ? 'pl-0' : 'pl-9'">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-zinc-500 w-10">ISRC</span>
                    <UInput
                      v-model="track.isrc"
                      placeholder="e.g. USRC12345678"
                      size="xs"
                      class="flex-1"
                      maxlength="12"
                      :disabled="saving"
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
                      :disabled="saving"
                    />
                  </div>
                </div>
              </div>

              <!-- Credits (non-admin only) -->
              <div v-if="!isAdmin" class="pl-12 pt-2">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-zinc-400">
                    Credits
                    <span v-if="track.credits?.length > 0" class="text-zinc-500">({{ track.credits.length }})</span>
                  </span>
                  <UButton
                    color="gray"
                    variant="ghost"
                    size="xs"
                    :disabled="saving"
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
                      :disabled="saving"
                    />
                    <UInput
                      v-model="credit.name"
                      placeholder="Name"
                      size="xs"
                      class="flex-1"
                      :disabled="saving"
                    />
                    <UInput
                      v-model="credit.ipi_number"
                      placeholder="IPI #"
                      size="xs"
                      class="w-28"
                      :disabled="saving"
                    />
                    <UButton
                      color="gray"
                      variant="ghost"
                      size="xs"
                      :disabled="saving"
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
                      :disabled="saving"
                      @click="track.credits.push({ role: 'composer', name: '', ipi_number: '' })"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
                      Add Credit
                    </UButton>
                    <UButton
                      v-if="canCopyCredits(index)"
                      color="gray"
                      variant="outline"
                      size="xs"
                      :disabled="saving"
                      @click="copyCredits(index)"
                    >
                      <UIcon name="i-heroicons-clipboard-document" class="w-3 h-3 mr-1" />
                      Copy
                    </UButton>
                    <UButton
                      v-if="copiedCredits && copiedCredits.length > 0"
                      color="violet"
                      variant="outline"
                      size="xs"
                      :disabled="saving"
                      @click="pasteCredits(index)"
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
          <UButton color="gray" variant="ghost" @click="$emit('update:modelValue', false)" :disabled="saving">
            Cancel
          </UButton>
          <UButton color="violet" :loading="saving" @click="handleSave">
            Save Changes
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Album } from '~/composables/useAlbum'

export interface EditableTrack {
  id: string
  title: string
  track_number: number
  is_explicit: boolean
  is_cover?: boolean
  isrc: string | null
  iswc: string | null
  moderation_status: string
  moderation_notes?: string | null
  showCredits?: boolean
  credits: Array<{
    role: string
    name: string
    ipi_number: string | null
  }>
}

export interface AlbumEditForm {
  title: string
  description: string
  release_type: 'album' | 'ep' | 'single'
  release_date: string
  is_published: boolean
  label_name: string
  p_line: string
  c_line: string
  upc?: string
}

const props = defineProps<{
  modelValue: boolean
  album: Album | null
  tracks: EditableTrack[]
  coverUrl: string | null
  bandName: string
  bandId?: string
  saving: boolean
  uploadingCover: boolean
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [form: AlbumEditForm, tracks: EditableTrack[]]
  'cover-select': [file: File]
  'add-track': []
  'delete-track': [track: EditableTrack]
  'tracks-reorder': [tracks: EditableTrack[]]
}>()

// Form state (local copy)
const form = reactive<AlbumEditForm>({
  title: '',
  description: '',
  release_type: 'album',
  release_date: '',
  is_published: false,
  label_name: '',
  p_line: '',
  c_line: '',
  upc: '',
})

// Local copy of tracks for editing
const localTracks = ref<EditableTrack[]>([])

const coverInput = ref<HTMLInputElement | null>(null)
const coverPreview = ref<string | null>(null)

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Credits copy/paste state
const copiedCredits = ref<Array<{ role: string; name: string; ipi_number: string | null }> | null>(null)
const toast = useToast()

// Options
const releaseTypeOptions = [
  { label: 'Album', value: 'album' },
  { label: 'EP', value: 'ep' },
  { label: 'Single', value: 'single' },
]

const moderationStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const creditRoleOptions = [
  { label: 'Composer', value: 'composer' },
  { label: 'Lyricist', value: 'lyricist' },
  { label: 'Performer', value: 'performer' },
  { label: 'Producer', value: 'producer' },
  { label: 'Arranger', value: 'arranger' },
]

// Watch for album changes to update form
watch(() => props.album, (newAlbum) => {
  if (newAlbum) {
    form.title = newAlbum.title
    form.description = newAlbum.description || ''
    form.release_type = newAlbum.release_type
    form.release_date = newAlbum.release_date?.split('T')[0] || ''
    form.is_published = newAlbum.is_published
    form.label_name = newAlbum.label_name || ''
    form.p_line = newAlbum.p_line || ''
    form.c_line = newAlbum.c_line || ''
    form.upc = newAlbum.upc || ''
    coverPreview.value = null
  }
}, { immediate: true })

// Watch for tracks prop changes to create local copy
watch(() => props.tracks, (newTracks) => {
  // Deep clone tracks to avoid mutating props
  localTracks.value = JSON.parse(JSON.stringify(newTracks))
}, { immediate: true, deep: true })

// Moderation status helpers
const getModerationColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    case 'revision_requested': return 'orange'
    default: return 'yellow'
  }
}

const getModerationLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'revision_requested': return 'Revision Requested'
    case 'pending_update': return 'Update Pending'
    default: return 'Pending'
  }
}

// Cover handling
const handleCoverSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    coverPreview.value = URL.createObjectURL(file)
    emit('cover-select', file)
    if (coverInput.value) {
      coverInput.value.value = ''
    }
  }
}

// Drag and drop
const onDragStart = (event: DragEvent, index: number) => {
  if (props.isAdmin) return
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

const onDragOver = (index: number) => {
  if (props.isAdmin) return
  dragOverIndex.value = index
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = (targetIndex: number) => {
  if (props.isAdmin || draggedIndex.value === null || draggedIndex.value === targetIndex) return

  const draggedTrack = localTracks.value[draggedIndex.value]
  localTracks.value.splice(draggedIndex.value, 1)
  localTracks.value.splice(targetIndex, 0, draggedTrack)

  // Update track numbers
  localTracks.value.forEach((t, idx) => {
    t.track_number = idx + 1
  })

  emit('tracks-reorder', localTracks.value)
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Credits copy/paste functions
const canCopyCredits = (trackIndex: number) => {
  const track = localTracks.value[trackIndex]
  return track.credits.length > 0 && track.credits.every(c => c.name.trim() && c.role)
}

const copyCredits = (trackIndex: number) => {
  const track = localTracks.value[trackIndex]
  copiedCredits.value = JSON.parse(JSON.stringify(track.credits))
  toast.add({ title: 'Credits copied', color: 'green', icon: 'i-heroicons-clipboard-document' })
}

const pasteCredits = (trackIndex: number) => {
  if (!copiedCredits.value) return
  const track = localTracks.value[trackIndex]
  // Append copied credits to existing ones
  for (const credit of copiedCredits.value) {
    track.credits.push({ ...credit })
  }
  track.showCredits = true
}

// Save handler
const handleSave = () => {
  if (!form.title.trim()) return
  emit('save', { ...form }, localTracks.value)
}
</script>
