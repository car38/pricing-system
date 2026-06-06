<template>
  <!-- 通用确认弹窗 -->
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="confirm-body">
      <el-icon v-if="type === 'warning'" class="confirm-icon warning" :size="48">
        <WarningFilled />
      </el-icon>
      <el-icon v-else-if="type === 'danger'" class="confirm-icon danger" :size="48">
        <CircleCloseFilled />
      </el-icon>
      <el-icon v-else class="confirm-icon info" :size="48">
        <InfoFilled />
      </el-icon>
      <p class="confirm-message">{{ message }}</p>
    </div>
    <template #footer>
      <el-button @click="handleCancel">{{ cancelText }}</el-button>
      <el-button
        :type="confirmType"
        :loading="loading"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '确定执行此操作吗？' },
  type: { type: String, default: 'info' }, // info, warning, danger
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  confirmType: { type: String, default: 'primary' },
  width: { type: String, default: '420px' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const visible = ref(false)

watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })

function handleConfirm() { emit('confirm') }
function handleCancel() { emit('cancel'); visible.value = false }
function handleClose() { emit('cancel'); visible.value = false }
</script>

<style scoped>
.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}
.confirm-icon { margin-bottom: 16px; }
.confirm-icon.warning { color: #e6a23c; }
.confirm-icon.danger { color: #f56c6c; }
.confirm-icon.info { color: #409eff; }
.confirm-message {
  font-size: 15px;
  color: #606266;
  text-align: center;
  line-height: 1.6;
}
</style>
