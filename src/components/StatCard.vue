<template>
  <!-- 顶部KPI卡片组件 -->
  <div
    class="stat-card"
    :class="{ clickable: clickable }"
    @click="clickable && $emit('click')"
  >
    <div
      class="stat-card-icon"
      :style="{ background: iconBg || `${color}15` }"
    >
      <el-icon :size="28" :color="color">
        <component :is="icon" />
      </el-icon>
    </div>
    <div class="stat-card-body">
      <div class="stat-card-label">{{ label }}</div>
      <div class="stat-card-value" :style="{ color }">{{ value }}</div>
      <div v-if="trend !== undefined" class="stat-card-trend" :class="trend >= 0 ? 'trend-up' : 'trend-down'">
        <el-icon :size="14">
          <Top v-if="trend >= 0" />
          <Bottom v-else />
        </el-icon>
        <span>{{ trend >= 0 ? '+' : '' }}{{ trend }}% 环比</span>
      </div>
      <div v-else-if="sublabel" class="stat-card-sublabel">{{ sublabel }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** 卡片标签文本 */
  label: { type: String, required: true },
  /** 卡片主数值 */
  value: { type: [String, Number], default: '-' },
  /** 图标组件名（Element Plus 图标名） */
  icon: { type: String, default: 'InfoFilled' },
  /** 主题色 */
  color: { type: String, default: '#409eff' },
  /** 图标背景色 */
  iconBg: { type: String, default: '' },
  /** 环比变化百分比（可选） */
  trend: { type: Number, default: undefined },
  /** 副文本（无trend时展示） */
  sublabel: { type: String, default: '' },
  /** 是否可点击 */
  clickable: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-body {
  flex: 1;
  min-width: 0;
}

.stat-card-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-card-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.trend-up { color: #67c23a; }
.trend-down { color: #f56c6c; }

.stat-card-sublabel {
  font-size: 12px;
  color: #909399;
}
</style>
