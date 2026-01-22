<template>
  <div class="w-full h-full min-h-[250px]">
    <Line v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-zinc-500">
      No revenue data yet
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

interface PeriodData {
  period_start: string
  total_subscription_revenue_cents: number
  artist_pool_cents?: number
}

const props = defineProps<{
  data: PeriodData[]
}>()

const hasData = computed(() => props.data && props.data.length > 0)

const chartData = computed(() => ({
  labels: props.data.map(d =>
    new Date(d.period_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  ),
  datasets: [
    {
      label: 'Total Revenue',
      data: props.data.map(d => (d.total_subscription_revenue_cents || 0) / 100),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    {
      label: 'Artist Pool (70%)',
      data: props.data.map(d => (d.artist_pool_cents || 0) / 100),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#a1a1aa',
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: '#18181b',
      titleColor: '#f4f4f5',
      bodyColor: '#a1a1aa',
      borderColor: '#3f3f46',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: (context) => `${context.dataset.label}: $${context.parsed.y?.toFixed(2) ?? '0.00'}`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(63, 63, 70, 0.3)',
      },
      ticks: {
        color: '#71717a',
      },
    },
    y: {
      grid: {
        color: 'rgba(63, 63, 70, 0.3)',
      },
      ticks: {
        color: '#71717a',
        callback: (value) => `$${value}`,
      },
    },
  },
}
</script>
