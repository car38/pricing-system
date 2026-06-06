<template>
  <!-- 核价单状态标签 -->
  <el-tag
    :type="tagType"
    :size="size"
    effect="light"
    :class="['status-tag', `status-${status}`]"
  >
    <el-icon v-if="showIcon" :size="12" style="margin-right: 3px">
      <component :is="iconName" />
    </el-icon>
    {{ label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'draft' },
  size: { type: String, default: 'small' },
  showIcon: { type: Boolean, default: true },
})

const statusConfig = {
  draft: { label: '草稿', type: 'info', icon: 'Edit' },
  pending: { label: '待审批', type: 'warning', icon: 'Clock' },
  approved: { label: '已批准', type: 'success', icon: 'CircleCheck' },
  active: { label: '已生效', type: 'success', icon: 'Flag' },
  rejected: { label: '已驳回', type: 'danger', icon: 'CircleClose' },
}

const config = computed(() => statusConfig[props.status] || { label: props.status, type: 'info', icon: 'QuestionFilled' })
const tagType = computed(() => config.value.type)
const label = computed(() => config.value.label)
const iconName = computed(() => config.value.icon)
</script>
