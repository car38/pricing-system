<template>
  <!-- 成本结构饼图组件 -->
  <div class="cost-chart-wrapper">
    <v-chart v-if="renderData.length > 0" :option="chartOption" style="height: 280px" autoresize />
    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

const props = defineProps({
  /** 成本结构数据 [{ name, value, itemStyle }] */
  data: { type: Array, default: () => [] },
  /** 是否显示为环形图 */
  donut: { type: Boolean, default: true },
})

const renderData = computed(() => {
  return props.data.filter((d) => d.value > 0)
})

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: ¥{c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    textStyle: { fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: props.donut ? ['40%', '70%'] : '70%',
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: '{d}%',
        fontSize: 11,
      },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: renderData.value,
    },
  ],
}))
</script>

<style scoped>
.cost-chart-wrapper {
  width: 100%;
  min-height: 240px;
}
</style>
