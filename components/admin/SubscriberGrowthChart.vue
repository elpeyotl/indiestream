<template>
  <div class="w-full h-full min-h-[250px]">
    <Line v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-zinc-500">
      No subscriber data yet
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
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface GrowthData {
  month: string
  newSubscribers: number
  totalSubscribers: number
}

const props = defineProps<{
  data: GrowthData[]
}>()

const hasData = computed(() => props.data && props.data.length > 0)

const chartData = computed(() => ({
  labels: props.data.map(d => {
    const [year, month] = d.month.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }),
  datasets: [
    {
      label: 'Total Subscribers',
      data: props.data.map(d => d.totalSubscribers),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      yAxisID: 'y',
    },
    {
      label: 'New This Month',
      data: props.data.map(d => d.newSubscribers),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      yAxisID: 'y1',
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
      type: 'linear',
      display: true,
      position: 'left',
      grid: {
        color: 'rgba(63, 63, 70, 0.3)',
      },
      ticks: {
        color: '#71717a',
      },
      title: {
        display: true,
        text: 'Total',
        color: '#8b5cf6',
      },
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#71717a',
      },
      title: {
        display: true,
        text: 'New',
        color: '#10b981',
      },
    },
  },
}
</script>
