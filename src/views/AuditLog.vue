<template>
  <div>
    <div class="page-header"><h2>更新日志</h2></div>
    <div class="data-table">
      <el-table :data="logs" v-loading="loading" stripe style="width:100%">
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.operateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">{{ row.operatorName || row.changedBy || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="actionType(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="200">
          <template #default="{ row }">{{ row.comment || row.changeReason || '-' }}</template>
        </el-table-column>
        <el-table-column label="核价单" width="160">
          <template #default="{ row }">
            <el-button v-if="row.valuationId" text size="small" type="primary" @click="$router.push('/valuation/detail/'+row.valuationId)">查看单号</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20,50,100]" layout="total,sizes,prev,pager,next" @change="loadData" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getAuditLogs } from '@/api/audit'
import { formatDateTime } from '@/utils/utils'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

function actionLabel(action) {
  const map = { submit: '提交审批', approve: '批准', reject: '驳回', edit: '修改' }
  return map[action] || action
}
function actionType(action) {
  const map = { submit: 'warning', approve: 'success', reject: 'danger', edit: 'primary' }
  return map[action] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getAuditLogs({ page: page.value, pageSize: pageSize.value })
    logs.value = res?.list || []
    total.value = res?.total || 0
  } finally { loading.value = false }
}

onMounted(loadData)
</script>
