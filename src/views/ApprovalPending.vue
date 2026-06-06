<template>
  <div>
    <div class="page-header">
      <h2>待办审批</h2>
      <div>
        <el-button v-if="selectedIds.length > 0" type="success" @click="handleBatchApprove">
          <el-icon><CircleCheck /></el-icon>批量批准 ({{ selectedIds.length }})
        </el-button>
        <el-button v-if="selectedIds.length > 0" type="danger" @click="showBatchReject = true">
          <el-icon><CircleClose /></el-icon>批量驳回
        </el-button>
      </div>
    </div>

    <div class="data-table">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span style="color:#909399;font-size:13px">共 {{ total }} 条待审批</span>
        </div>
        <div class="table-toolbar-right">
          <el-button text @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe style="width:100%"
        @selection-change="onSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column label="核价单号" width="160">
          <template #default="{ row }">
            <span style="font-family: monospace; font-size: 12px; color: #409eff; cursor: pointer;"
              @click="$router.push(`/valuation/detail/${row._id}`)">{{ row.valuationNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customer" label="客户" width="120" />
        <el-table-column prop="materialId" label="物料ID" width="120" />
        <el-table-column label="总成本" width="120">
          <template #default="{ row }">{{ formatMoney(row.totalCost) }}</template>
        </el-table-column>
        <el-table-column label="合理售价" width="120">
          <template #default="{ row }">{{ formatMoney(row.standardPrice) }}</template>
        </el-table-column>
        <el-table-column label="提交人" width="100">
          <template #default="{ row }">{{ row.submitterName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="success" @click="showApprove(row)">批准</el-button>
            <el-button text size="small" type="danger" @click="showReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="loadData" />
      </div>
    </div>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveDialog" title="审批通过" width="480px">
      <el-form :model="approveForm">
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialog = false">取消</el-button>
        <el-button type="success" :loading="approving" @click="confirmApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectDialog" title="驳回" width="480px">
      <el-form :model="rejectForm" :rules="{ comment: [{ required: true, message: '驳回原因必填' }] }" ref="rejectFormRef">
        <el-form-item label="驳回原因" prop="comment">
          <el-input v-model="rejectForm.comment" type="textarea" :rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="rejecting" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 批量驳回弹窗 -->
    <el-dialog v-model="showBatchReject" title="批量驳回" width="480px">
      <p style="margin-bottom:12px;color:#606266">将驳回 {{ selectedIds.length }} 份核价单</p>
      <el-form :model="batchRejectForm" :rules="{ comment: [{ required: true, message: '驳回原因必填' }] }" ref="batchRejectFormRef">
        <el-form-item label="驳回原因" prop="comment">
          <el-input v-model="batchRejectForm.comment" type="textarea" :rows="3" placeholder="统一驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchReject = false">取消</el-button>
        <el-button type="danger" :loading="batchRejecting" @click="confirmBatchReject">批量驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingApprovalList, approveValuation, rejectValuation, batchApprove, batchReject } from '@/api/approval'
import { formatMoney, formatDate } from '@/utils/utils'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const selectedIds = ref([])

// Approve
const approveDialog = ref(false)
const approveForm = ref({ comment: '', id: '' })
const approving = ref(false)

// Reject
const rejectDialog = ref(false)
const rejectForm = ref({ comment: '', id: '' })
const rejectFormRef = ref(null)
const rejecting = ref(false)

// Batch reject
const showBatchReject = ref(false)
const batchRejectForm = ref({ comment: '' })
const batchRejectFormRef = ref(null)
const batchRejecting = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await getPendingApprovalList({ page: page.value, pageSize: pageSize.value })
    tableData.value = res?.list || []
    total.value = res?.total || 0
  } finally { loading.value = false }
}

function onSelectionChange(selection) {
  selectedIds.value = selection.map((s) => s._id)
}

function showApprove(row) {
  approveForm.value = { comment: '', id: row._id }
  approveDialog.value = true
}

function showReject(row) {
  rejectForm.value = { comment: '', id: row._id }
  rejectDialog.value = true
}

async function confirmApprove() {
  approving.value = true
  try {
    await approveValuation({ id: approveForm.value.id, comment: approveForm.value.comment })
    ElMessage.success('审批通过')
    approveDialog.value = false
    loadData()
  } catch { /* handled */ }
  finally { approving.value = false }
}

async function confirmReject() {
  const valid = await rejectFormRef.value.validate().catch(() => false)
  if (!valid) return
  rejecting.value = true
  try {
    await rejectValuation({ id: rejectForm.value.id, comment: rejectForm.value.comment })
    ElMessage.success('已驳回')
    rejectDialog.value = false
    loadData()
  } catch { /* handled */ }
  finally { rejecting.value = false }
}

async function handleBatchApprove() {
  if (selectedIds.value.length === 0) return
  try {
    await batchApprove({ ids: selectedIds.value })
    ElMessage.success(`已批准 ${selectedIds.value.length} 份`)
    selectedIds.value = []
    loadData()
  } catch { /* handled */ }
}

async function confirmBatchReject() {
  const valid = await batchRejectFormRef.value.validate().catch(() => false)
  if (!valid) return
  batchRejecting.value = true
  try {
    await batchReject({ ids: selectedIds.value, comment: batchRejectForm.value.comment })
    ElMessage.success(`已驳回 ${selectedIds.value.length} 份`)
    showBatchReject.value = false
    selectedIds.value = []
    loadData()
  } catch { /* handled */ }
  finally { batchRejecting.value = false }
}

onMounted(loadData)
</script>
