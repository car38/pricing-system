<template>
  <div>
    <div class="page-header">
      <h2>核价单列表</h2>
      <div>
        <el-button @click="downloadImportTemplate" v-if="userStore.isValuer"><el-icon><Download /></el-icon>下载导入模板</el-button>
        <el-button type="primary" @click="$router.push('/valuation/create')" v-if="userStore.isValuer"><el-icon><Plus /></el-icon>新建核价单</el-button>
      </div>
    </div>

    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="物料ID"><el-input v-model="searchForm.materialId" placeholder="模糊搜索" clearable style="width:160px" @clear="handleSearch" @keyup.enter="handleSearch" /></el-form-item>
        <el-form-item label="客户"><el-input v-model="searchForm.customer" placeholder="模糊搜索" clearable style="width:160px" @clear="handleSearch" @keyup.enter="handleSearch" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:130px" @change="handleSearch">
            <el-option label="草稿" value="draft" /><el-option label="待审批" value="pending" /><el-option label="已批准" value="approved" /><el-option label="已生效" value="active" /><el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:220px" @change="handleSearch" /></el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">查询</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
    </div>

    <div class="data-table" style="overflow-x:auto">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span style="color:#909399;font-size:13px">共 {{ total }} 条记录</span>
          <template v-if="selectedIds.length > 0 && userStore.isValuer">
            <el-button size="small" type="primary" plain @click="handleBatchSubmit">批量提交</el-button>
            <el-button size="small" type="danger" plain @click="handleBatchDelete">批量删除</el-button>
          </template>
        </div>
        <div class="table-toolbar-right">
          <el-button text @click="handleExport"><el-icon><Download /></el-icon>导出</el-button>
          <el-button text @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe style="width:100%" @selection-change="onSelectionChange"
        :default-sort="{ prop: 'createdAt', order: 'descending' }" @sort-change="handleSortChange">
        <el-table-column type="selection" width="40" />
        <el-table-column label="核价单号" width="160">
          <template #default="{ row }"><span style="font-family:monospace;font-size:12px;cursor:pointer;color:#409eff" @click="$router.push(`/valuation/detail/${row._id}`)">{{ row.valuationNo }}</span></template>
        </el-table-column>
        <el-table-column label="客户" width="130">
          <template #default="{ row }"><el-button text size="small" type="primary" @click="filterBy('customer', row.customer)">{{ row.customer }}</el-button></template>
        </el-table-column>
        <el-table-column label="物料ID" width="150">
          <template #default="{ row }"><span style="display:inline-flex;align-items:center;gap:2px"><el-button text size="small" type="primary" @click="filterBy('materialId', row.materialId)">{{ row.materialId }}</el-button><el-button text size="small" @click.stop="showMaterialTrend(row.materialId)" title="成本趋势"><el-icon size="14"><TrendCharts /></el-icon></el-button></span></template>
        </el-table-column>
        <el-table-column label="材质规格" width="120">
          <template #default="{ row }"><el-button text size="small" @click="filterBy('spec', row.spec)">{{ row.spec }}</el-button></template>
        </el-table-column>
        <el-table-column label="总成本" width="130" sortable="custom">
          <template #default="{ row }">{{ formatMoney(row.totalCost) }}</template>
        </el-table-column>
        <el-table-column label="含税销售单价" width="140">
          <template #default="{ row }">{{ row.standardPrice != null && row.standardPrice > 0 ? formatMoney(row.standardPrice) : '-' }}</template>
        </el-table-column>
        <el-table-column label="毛利率" width="90">
          <template #default="{ row }">{{ row.grossProfitRate != null ? row.grossProfitRate.toFixed(1) + '%' : '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90"><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column>
        <el-table-column label="提交人" width="100"><template #default="{ row }">{{ row.submitterName || '-' }}</template></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="110" sortable="custom"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="$router.push(`/valuation/detail/${row._id}`)">查看</el-button>
            <el-button v-if="canEdit(row)" text size="small" @click="$router.push(`/valuation/edit/${row._id}`)">编辑</el-button>
            <el-button v-if="row.status === 'draft' && canEdit(row)" text size="small" @click="handleSubmit(row._id)">提交</el-button>
            <el-popconfirm v-if="canEdit(row)" title="确认删除？" @confirm="handleDelete(row._id)">
              <template #reference><el-button text type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" @change="loadData" />
      </div>
    </div>

    <el-dialog v-model="trendDialogVisible" :title="trendTitle" width="800px" destroy-on-close>
      <div v-if="trendLoading" style="text-align:center;padding:40px"><el-icon class="is-loading" :size="32"><Loading /></el-icon></div>
      <div v-else-if="trendData.length === 0" style="text-align:center;padding:40px"><el-empty description="暂无数据" /></div>
      <v-chart v-else :option="trendChartOption" style="height:360px" autoresize />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getValuationList, deleteValuation, submitValuation, copyValuation, batchSubmitValuation, batchDeleteValuation } from '@/api/valuation'
import { formatMoney, formatDate } from '@/utils/utils'
import { exportValuationExcel, downloadImportTemplate } from '@/utils/exportExcel'
import StatusTag from '@/components/StatusTag.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { getMaterialTrend } from '@/api/material'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const selectedIds = ref([])
const sortProp = ref('createdAt')
const sortOrder = ref('desc')

const trendDialogVisible = ref(false)
const trendMaterialId = ref('')
const trendTitle = ref('')
const trendLoading = ref(false)
const trendData = ref([])
const trendChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['含税销售单价', '总成本', '材料成本', '胶料单价'], top: 0 },
  grid: { left: 60, right: 30, bottom: 40, top: 40 },
  xAxis: { type: 'category', data: trendData.value.map(d => d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''), axisLabel: { rotate: 30, fontSize: 11 } },
  yAxis: [{ type: 'value', name: '成本(元)' }, { type: 'value', name: '胶料单价', min: 0 }],
  series: [
    { name: '含税销售单价', type: 'line', smooth: true, data: trendData.value.map(d => d.standardPrice), symbol: 'triangle', symbolSize: 8, lineStyle: { width: 2, color: '#f56c6c', type: 'dashed' }, itemStyle: { color: '#f56c6c' } },
    { name: '总成本', type: 'line', smooth: true, data: trendData.value.map(d => d.totalCost), symbol: 'circle', symbolSize: 6, lineStyle: { width: 2, color: '#e6a23c' }, itemStyle: { color: '#e6a23c' } },
    { name: '材料成本', type: 'bar', data: trendData.value.map(d => d.materialCost), itemStyle: { color: '#409eff', borderRadius: [2,2,0,0] }, barMaxWidth: 20 },
    { name: '胶料单价', type: 'line', smooth: true, yAxisIndex: 1, data: trendData.value.map(d => d.gluePrice), symbol: 'diamond', symbolSize: 6, lineStyle: { width: 2, color: '#67c23a', type: 'dashed' }, itemStyle: { color: '#67c23a' } },
  ]
}))
async function showMaterialTrend(materialId) {
  trendMaterialId.value = materialId
  trendTitle.value = materialId + ' 成本趋势'
  trendDialogVisible.value = true
  trendLoading.value = true
  try { trendData.value = await getMaterialTrend(materialId) || [] }
  catch { trendData.value = [] }
  finally { trendLoading.value = false }
}

const searchForm = reactive({ materialId: '', customer: '', status: '', dateRange: '' })

function canEdit(row) {
  if (userStore.isSuperAdmin) return true
  if (userStore.userInfo?._openid === row._openid) return true
  return false
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, sortBy: sortProp.value, sortOrder: sortOrder.value }
    if (searchForm.materialId) params.materialId = searchForm.materialId
    if (searchForm.customer) params.customer = searchForm.customer
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange) { params.startDate = searchForm.dateRange[0]; params.endDate = searchForm.dateRange[1] }
    const res = await getValuationList(params)
    tableData.value = res?.list || []
    total.value = res?.total || 0
  } finally { loading.value = false }
}

function filterBy(field, value) { searchForm[field] = value; page.value = 1; loadData() }
function handleSearch() { page.value = 1; loadData() }
function handleReset() { Object.assign(searchForm, { materialId: '', customer: '', status: '', dateRange: '' }); page.value = 1; loadData() }
function handleSortChange({ prop, order }) { sortProp.value = prop || 'createdAt'; sortOrder.value = order === 'ascending' ? 'asc' : 'desc'; loadData() }
function onSelectionChange(selection) { selectedIds.value = selection.map(s => s._id) }

async function handleSubmit(id) { try { await submitValuation(id); ElMessage.success('已提交审批'); loadData() } catch {} }
async function handleDelete(id) { try { await deleteValuation(id); ElMessage.success('删除成功'); loadData() } catch {} }
async function handleCopy(id) { try { await copyValuation(id); ElMessage.success('已复制'); loadData() } catch {} }
async function handleBatchSubmit() { if (!selectedIds.value.length) return; try { await batchSubmitValuation(selectedIds.value); ElMessage.success('已提交'); selectedIds.value = []; loadData() } catch {} }
async function handleBatchDelete() { if (!selectedIds.value.length) return; try { await batchDeleteValuation(selectedIds.value); ElMessage.success('已删除'); selectedIds.value = []; loadData() } catch {} }
function handleExport() { if (!tableData.value.length) { ElMessage.warning('暂无数据'); return }; exportValuationExcel(tableData.value, searchForm) }

onMounted(loadData)
</script>
