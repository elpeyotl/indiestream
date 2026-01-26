<template>
  <div
    draggable="true"
    class="flex items-start gap-4 p-3 bg-zinc-800/50 rounded-lg cursor-grab hover:bg-zinc-800 transition-colors"
    :class="{
      'ring-2 ring-violet-500 bg-violet-500/10': dragOver,
      'opacity-50': dragged,
    }"
    @dragstart="$emit('dragStart', $event)"
    @dragend="$emit('dragEnd')"
    @dragover.prevent="$emit('dragOver')"
    @dragleave="$emit('dragLeave')"
    @drop="$emit('drop')"
  >
    <!-- Drag Handle -->
    <div class="cursor-grab active:cursor-grabbing pt-1">
      <UIcon name="i-heroicons-bars-3" class="w-5 h-5 text-zinc-500" />
    </div>

    <!-- Position Badge -->
    <span class="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-medium shrink-0 mt-1">
      {{ index + 1 }}
    </span>

    <!-- Album Cover -->
    <div class="w-14 h-14 rounded bg-zinc-700 overflow-hidden flex-shrink-0">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="item.albums?.title"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-zinc-500" />
      </div>
    </div>

    <!-- Album Info -->
    <div class="flex-1 min-w-0">
      <p class="font-medium text-zinc-100 truncate">{{ item.albums?.title }}</p>
      <p class="text-sm text-zinc-500 truncate">{{ item.albums?.bands?.name }}</p>
      <p v-if="item.description" class="text-xs text-zinc-400 mt-1 line-clamp-2 italic">
        "{{ item.description }}"
      </p>
      <p v-else class="text-xs text-zinc-600 mt-1 italic">
        No description
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 shrink-0">
      <UButton
        color="gray"
        variant="ghost"
        size="xs"
        :loading="editing"
        @click="$emit('edit')"
      >
        <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
      </UButton>
      <UButton
        color="red"
        variant="ghost"
        size="xs"
        :loading="deleting"
        @click="$emit('delete')"
      >
        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ZineAlbum {
  id: string
  album_id: string
  category: string
  description?: string | null
  position: number
  albums?: {
    id: string
    title: string
    slug: string
    cover_key?: string | null
    cover_url?: string | null
    bands?: {
      id: string
      name: string
      slug: string
    }
  }
}

defineProps<{
  item: ZineAlbum
  index: number
  coverUrl?: string
  deleting: boolean
  editing: boolean
  dragged: boolean
  dragOver: boolean
}>()

defineEmits<{
  dragStart: [e: DragEvent]
  dragEnd: []
  dragOver: []
  dragLeave: []
  drop: []
  edit: []
  delete: []
}>()
</script>
