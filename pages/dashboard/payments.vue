<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <DashboardPageHeader
      title="Payment History"
      description="View your subscription invoices and receipts"
    />

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Summary Card -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Total Paid</p>
              <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(paymentData.totalPaid) }}</p>
            </div>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="isSubscribed ? 'bg-green-500/20' : 'bg-zinc-800'"
            >
              <UIcon
                :name="isSubscribed ? 'i-heroicons-check-circle' : 'i-heroicons-credit-card'"
                class="w-6 h-6"
                :class="isSubscribed ? 'text-green-400' : 'text-zinc-400'"
              />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Subscription Status</p>
              <p class="text-2xl font-bold" :class="isSubscribed ? 'text-green-400' : 'text-zinc-400'">
                {{ statusLabel }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Invoices Table -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-zinc-100">Invoices</h2>
            <span class="text-sm text-zinc-400">{{ paymentData.invoices.length }} invoice{{ paymentData.invoices.length !== 1 ? 's' : '' }}</span>
          </div>
        </template>

        <!-- Empty State -->
        <div v-if="paymentData.invoices.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-zinc-500" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">No Invoices Yet</h3>
          <p class="text-zinc-400 mb-6 max-w-md mx-auto">
            Once you subscribe, your payment history will appear here.
          </p>
          <UButton color="violet" to="/pricing">
            View Plans
          </UButton>
        </div>

        <!-- Invoices List -->
        <div v-else class="divide-y divide-zinc-800">
          <div
            v-for="invoice in paymentData.invoices"
            :key="invoice.id"
            class="py-4 first:pt-0 last:pb-0"
          >
            <div class="flex items-center justify-between gap-4">
              <!-- Invoice Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1">
                  <p class="font-medium text-zinc-100">{{ invoice.description }}</p>
                  <UBadge
                    :color="getStatusColor(invoice.status)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ invoice.status }}
                  </UBadge>
                </div>
                <p class="text-sm text-zinc-400">
                  {{ formatDate(invoice.date) }}
                  <span v-if="invoice.number" class="ml-2 text-zinc-500">
                    #{{ invoice.number }}
                  </span>
                </p>
              </div>

              <!-- Amount -->
              <div class="text-right">
                <p class="font-semibold text-zinc-100">{{ formatCurrency(invoice.amount) }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                <UButton
                  v-if="invoice.pdfUrl"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :to="invoice.pdfUrl"
                  target="_blank"
                >
                  <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                  <span class="hidden sm:inline ml-1">PDF</span>
                </UButton>
                <UButton
                  v-if="invoice.hostedUrl"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :to="invoice.hostedUrl"
                  target="_blank"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                  <span class="hidden sm:inline ml-1">View</span>
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Impact Card -->
      <UCard v-if="isSubscribed" class="bg-gradient-to-r from-teal-500/10 to-violet-500/10 border-teal-500/30 mt-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-chart-pie" class="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 class="text-zinc-100 font-semibold mb-1">See Where Your Money Went</h3>
              <p class="text-zinc-400 text-sm">
                View how your subscription supports the artists you love
              </p>
            </div>
          </div>
          <UButton color="teal" to="/dashboard/stats" class="shrink-0">
            View Impact
          </UButton>
        </div>
      </UCard>

      <!-- Help Text -->
      <p class="text-center text-sm text-zinc-500 mt-6">
        Need help with billing? <NuxtLink to="/contact" class="text-violet-400 hover:text-violet-300">Contact support</NuxtLink>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

interface Invoice {
  id: string
  number: string | null
  date: number
  amount: number
  status: string | null
  description: string
  pdfUrl: string | null
  hostedUrl: string | null
  periodStart: number | null
  periodEnd: number | null
}

interface PaymentData {
  invoices: Invoice[]
  totalPaid: number
  subscriptionStatus: string
}

const user = useSupabaseUser()
const loading = ref(true)
const paymentData = ref<PaymentData>({
  invoices: [],
  totalPaid: 0,
  subscriptionStatus: 'inactive',
})

// Fetch payment data from API
const fetchPaymentData = async (): Promise<PaymentData> => {
  return await $fetch<PaymentData>('/api/stripe/payment-history')
}

// User-scoped persisted store for payment history
const paymentsStore = computed(() => {
  if (!user.value?.id) return null
  return usePersistedStore<PaymentData>({
    key: `payments_${user.value.id}`,
    fetcher: fetchPaymentData,
  })
})

// Apply cached data to local refs
const applyCachedData = (cached: unknown) => {
  const data = cached as PaymentData
  paymentData.value = JSON.parse(JSON.stringify(data)) as PaymentData
}

const isSubscribed = computed(() => {
  return ['active', 'trialing'].includes(paymentData.value.subscriptionStatus)
})

const statusLabel = computed(() => {
  const status = paymentData.value.subscriptionStatus
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past Due'
    case 'canceled':
      return 'Canceled'
    default:
      return 'Free'
  }
})

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusColor = (status: string | null): string => {
  switch (status) {
    case 'paid':
      return 'green'
    case 'open':
      return 'yellow'
    case 'draft':
      return 'gray'
    case 'void':
    case 'uncollectible':
      return 'red'
    default:
      return 'gray'
  }
}

// Watch for store data updates (background revalidation)
watch(
  () => paymentsStore.value?.data.value,
  (newData) => {
    if (newData) {
      applyCachedData(newData)
    }
  }
)

onMounted(async () => {
  const store = paymentsStore.value
  if (store) {
    await store.initialize()
    if (store.data.value) {
      applyCachedData(store.data.value)
    }
    loading.value = store.loading.value
  } else {
    // Fallback if no user
    try {
      paymentData.value = await fetchPaymentData()
    } catch (e) {
      console.error('Failed to load payment history:', e)
    } finally {
      loading.value = false
    }
  }
})
</script>
