<template>
  <div class="w-full h-full min-h-[200px]">
    <Doughnut v-if="totalRevenue > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-zinc-500">
      No revenue to display
    </div>
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  totalRevenue: number // in cents
}>()

const chartData = computed(() => {
  const total = props.totalRevenue / 100
  return {
    labels: ['Artists (70%)', 'CMO (15%)', 'Platform (15%)'],
    datasets: [
      {
        data: [
          Math.round(total * 0.70 * 100) / 100,
          Math.round(total * 0.15 * 100) / 100,
          Math.round(total * 0.15 * 100) / 100,
        ],
        backgroundColor: ['#8b5cf6', '#f59e0b', '#10b981'],
        borderColor: ['#7c3aed', '#d97706', '#059669'],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }
})

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: '#a1a1aa',
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12,
        },
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
        label: (context) => `${context.label}: $${context.parsed.toFixed(2)}`,
      },
    },
  },
}
</script>
