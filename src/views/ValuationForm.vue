<template>
  <div>
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <div v-if="isDetail">
        <el-button v-if="form.status === 'draft' && canEdit" type="primary"
          @click="$router.push(`/valuation/edit/${route.params.id}`)">编辑</el-button>
        <el-button @click="$router.push('/valuation/list')">返回列表</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" :disabled="isDetail && !isEditing">
      <el-row :gutter="24">
        <!-- 基础信息 -->
        <el-col :span="24">
          <div class="form-section">
            <div class="section-title">
              <el-icon><InfoFilled /></el-icon> 基础信息
            </div>
            <el-row :gutter="24">
              <el-col :span="8"><el-form-item label="客户" prop="customer">
                <el-input v-model="form.customer" placeholder="必填" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="物料ID" prop="materialId">
                <el-input v-model="form.materialId" placeholder="必填" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="材质规格">
                <el-input v-model="form.spec" placeholder="如 EPDM-70A" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="8"><el-form-item label="产品照片">
                <el-upload v-model:file-list="fileList" :auto-upload="false" list-type="picture-card" :limit="1" accept="image/*">
                  <el-icon><Plus /></el-icon>
                </el-upload></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="核价单号" v-if="form.valuationNo">
                <el-input :model-value="form.valuationNo" disabled /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="版本" v-if="form.version">
                <el-input-number :model-value="form.version" disabled style="width:100%" /></el-form-item></el-col>
            </el-row>
          </div>
        </el-col>

        <!-- 工艺参数 -->
        <el-col :span="24">
          <div class="form-section">
            <div class="section-title">
              <el-icon><Setting /></el-icon> 工艺参数
            </div>
            <el-row :gutter="24">
              <el-col :span="6"><el-form-item label="硫化温度(℃)">
                <el-input-number v-model="form.cureTemp" :min="0" :step="5" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="硫化时间(秒)">
                <el-input-number v-model="form.cureTime" :min="0" :step="10" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="机台吨位(T)">
                <el-input-number v-model="form.tonnage" :min="0" :step="50" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="班次时长(H/班)">
                <el-input-number v-model="form.shiftHours" :min="1" :max="24" :step="1" style="width:100%" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6"><el-form-item label="模具模穴数(穴)">
                <el-input-number v-model="form.cavities" :min="1" :step="1" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="成型周期(秒/模)">
                <el-input-number v-model="form.cycleTime" :min="0" :step="5" style="width:100%" @change="calc" /></el-form-item></el-col>
              <el-col :span="6" v-if="capacity.theoretical > 0">
                <el-form-item label="理论产能">
                  <el-input :model-value="`${capacity.theoretical} PCS/班`" disabled /></el-form-item></el-col>
              <el-col :span="6" v-if="capacity.actual > 0">
                <el-form-item label="实际产能">
                  <el-input :model-value="`${capacity.actual} PCS/班`" disabled /></el-form-item></el-col>
            </el-row>
          </div>
        </el-col>

        <!-- 用胶定额 & 质量成本 -->
        <el-col :span="24">
          <div class="form-section">
            <div class="section-title">
              <el-icon><Scale /></el-icon> 用胶定额 & 质量成本
            </div>
            <el-row :gutter="24">
              <el-col :span="6"><el-form-item label="净重(克)">
                <el-input-number v-model="form.netWeight" :precision="2" :min="0" :step="1" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="毛重(克)">
                <el-input-number v-model="form.grossWeight" :precision="2" :min="0" :step="1" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="最终用胶定额(g/只)" prop="glueConsumption">
                <el-input-number v-model="form.glueConsumption" :precision="2" :min="0" :step="0.1" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="生产损耗(%)" prop="lossRate">
                <el-input-number v-model="form.lossRate" :min="0" :max="100" :step="1" style="width:100%" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6"><el-form-item label="不良率(%)">
                <el-input-number v-model="form.defectRate" :precision="2" :min="0" :max="100" :step="0.1" style="width:100%" /></el-form-item></el-col>
            </el-row>
          </div>
        </el-col>

        <!-- 成本明细 -->
        <el-col :span="24">
          <div class="form-section">
            <div class="section-title">
              <el-icon><Money /></el-icon> 成本明细
            </div>
            <el-row :gutter="24">
              <el-col :span="8"><el-form-item label="胶料单价(元/KG)" prop="gluePrice">
                <el-input-number v-model="form.gluePrice" :precision="4" :min="0" :step="0.1" style="width:100%" @change="calc" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="修边(元/PCS)" prop="trimming">
                <el-input-number v-model="form.trimming" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="检验(元/PCS)" prop="inspection">
                <el-input-number v-model="form.inspection" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="8"><el-form-item label="电费(元/PCS)">
                <el-input-number v-model="form.electricity" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="设备折旧(元/PCS)">
                <el-input-number v-model="form.equipmentDep" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="模具摊销(元/PCS)">
                <el-input-number v-model="form.moldAmort" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="8"><el-form-item label="包装(元/PCS)">
                <el-input-number v-model="form.packaging" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="运输(元/PCS)">
                <el-input-number v-model="form.transport" :precision="4" :min="0" :step="0.01" style="width:100%" /></el-form-item></el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>

      <!-- 计算结果 -->
      <div v-if="result.totalCost > 0" class="result-section">
        <div class="section-title">
          <el-icon><DataAnalysis /></el-icon> 计算结果
        </div>
        <el-row :gutter="16" style="margin-bottom: 16px;">
          <el-col :span="6"><div class="result-card">
            <div class="result-label">总成本</div>
            <div class="result-value primary">{{ formatMoney(result.totalCost) }}</div>
          </div></el-col>
          <el-col :span="6"><div class="result-card">
            <div class="result-label">最低售价(5%)</div>
            <div class="result-value warning">{{ formatMoney(result.minPrice) }}</div>
          </div></el-col>
          <el-col :span="6"><div class="result-card">
            <div class="result-label">合理售价(15%)</div>
            <div class="result-value success">{{ formatMoney(result.standardPrice) }}</div>
          </div></el-col>
          <el-col :span="6"><div class="result-card">
            <div class="result-label">高利润售价(30%)</div>
            <div class="result-value danger">{{ formatMoney(result.highPrice) }}</div>
          </div></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="6"><div class="result-card small">
            <div class="result-label">原材料成本</div>
            <div class="result-value">{{ formatMoney(result.materialCost) }}</div>
          </div></el-col>
          <el-col :span="6"><div class="result-card small">
            <div class="result-label">人工工序成本</div>
            <div class="result-value">{{ formatMoney(result.laborCost) }}</div>
          </div></el-col>
          <el-col :span="6"><div class="result-card small">
            <div class="result-label">制造分摊</div>
            <div class="result-value">{{ formatMoney(result.manufacturingCost) }}</div>
          </div></el-col>
          <el-col :span="6"><div class="result-card small">
            <div class="result-label">毛利</div>
            <div class="result-value">{{ formatMoney(result.grossProfit) }}</div>
            <div class="result-sub">{{ (result.grossProfitRate != null ? result.grossProfitRate.toFixed(2) : '-') }}%</div>
          </div></el-col>
        </el-row>

        <!-- 产能 -->
        <el-row :gutter="16" style="margin-top: 12px;">
          <el-col :span="6"><el-tag>理论产能: {{ result.theoreticalCapacity }} PCS/班</el-tag></el-col>
          <el-col :span="6"><el-tag>实际产能: {{ result.actualCapacity }} PCS/班</el-tag></el-col>
          <el-col :span="6"><el-tag>小时产能: {{ result.hourlyCapacity }} PCS/H</el-tag></el-col>
        </el-row>

        <!-- 成本结构饼图 -->
        <div class="chart-container">
          <h4>成本结构</h4>
          <CostChart :data="costChartData" />
        </div>

        <!-- 预警 -->
        <el-alert v-for="w in warnings" :key="w.type" :title="w.message" :type="w.severity" show-icon
          style="margin-top: 8px;" />
      </div>

      <!-- 审批信息（详情模式） -->
      <div v-if="isDetail && detail.approvalRecords && detail.approvalRecords.length > 0" class="form-section">
        <div class="section-title">
          <el-icon><CircleCheck /></el-icon> 审批记录
        </div>
        <el-timeline>
          <el-timeline-item v-for="rec in detail.approvalRecords" :key="rec._id"
            :timestamp="formatDateTime(rec.operateTime)" placement="top">
            <div>
              <strong>{{ rec.operatorName }}</strong> -
              <el-tag :type="rec.action === 'approve' ? 'success' : 'danger'" size="small">
                {{ rec.action === 'approve' ? '批准' : '驳回' }}
              </el-tag>
              <p v-if="rec.comment" style="color:#606266;margin-top:4px">{{ rec.comment }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 版本历史（详情模式） -->
      <div v-if="isDetail && versionHistory.length > 0" class="form-section">
        <div class="section-title">
          <el-icon><Histogram /></el-icon> 版本历史
        </div>
        <el-table :data="versionHistory" stripe size="small">
          <el-table-column prop="version" label="版本" width="60" />
          <el-table-column label="变更人" width="120">
            <template #default="{ row }">{{ row.changedBy || '-' }}</template>
          </el-table-column>
          <el-table-column label="变更时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.changedAt) }}</template>
          </el-table-column>
          <el-table-column prop="changeReason" label="变更说明" />
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button text size="small" @click="viewVersion(row.version)">查看</el-button>
              <el-button v-if="row.version !== form.version && userStore.isSupervisor" text size="small"
                @click="rollbackVersion(row.version)">回滚</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 操作按钮 -->
      <div v-if="!isDetail || isEditing" style="margin-top: 24px;">
        <el-button type="primary" :loading="submitting" @click="handleSubmit('draft')">
          保存草稿
        </el-button>
        <el-button type="primary" plain :loading="submitting" @click="handleSubmit('pending')">
          提交审批
        </el-button>
        <el-button v-if="form.status === 'rejected'" type="warning" plain :loading="submitting"
          @click="handleSubmit('pending')">
          重新提交
        </el-button>
        <el-button @click="handleCopyFrom">从已有核价单复制</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </div>
    </el-form>

    <!-- 复制选择弹窗 -->
    <el-dialog v-model="copyDialogVisible" title="选择要复制的核价单" width="700px">
      <el-input v-model="copySearch" placeholder="搜索物料ID或客户" clearable style="margin-bottom: 12px;" />
      <el-table :data="copyCandidates" stripe v-loading="copyLoading" @row-click="selectCopyTarget">
        <el-table-column prop="valuationNo" label="单号" width="140" />
        <el-table-column prop="customer" label="客户" width="120" />
        <el-table-column prop="materialId" label="物料ID" width="120" />
        <el-table-column label="总成本" width="120">
          <template #default="{ row }">{{ formatMoney(row.totalCost) }}</template>
        </el-table-column>
        <el-table-column label="日期" width="100">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import {
  getValuationDetail, createValuation, updateValuation,
  getValuationHistory, getVersionDetail, rollbackVersion as apiRollback,
} from '@/api/valuation'
import { getSettings } from '@/api/settings'
import { calculateCost, getCostChartData, checkWarnings } from '@/utils/calculateCost'
import { formatMoney, formatDate, formatDateTime, calculateCapacity } from '@/utils/utils'
import CostChart from '@/components/CostChart.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const isCreate = computed(() => route.name === 'ValuationCreate' || !route.params.id)
const isDetail = computed(() => route.name === 'ValuationDetail' && !!route.params.id)
const isEditing = computed(() => route.name === 'ValuationEdit')
const pageTitle = computed(() => {
  if (isCreate.value) return '新建核价单'
  if (isEditing.value) return '编辑核价单'
  return '核价单详情'
})

const formRef = ref(null)
const submitting = ref(false)
const fileList = ref([])

// 表单数据
const form = reactive({
  customer: '', materialId: '', spec: '', image: '',
  cureTemp: 0, cureTime: 0, tonnage: 0, shiftHours: 11, cavities: 1, cycleTime: 0,
  netWeight: 0, grossWeight: 0, glueConsumption: 0, lossRate: 10, defectRate: 0.3,
  gluePrice: 0, trimming: 0, inspection: 0,
  electricity: 0, equipmentDep: 0, moldAmort: 0,
  packaging: 0, transport: 0,
  status: 'draft', version: 1,
})

const rules = {
  customer: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  materialId: [{ required: true, message: '物料ID不能为空', trigger: 'blur' }],
  glueConsumption: [{ required: true, message: '请输入用胶定额', trigger: 'blur' }],
  gluePrice: [{ required: true, message: '请输入胶料单价', trigger: 'blur' }],
  lossRate: [{ required: true, message: '请输入损耗率', trigger: 'blur' }],
}

// 计算结果
const result = ref({ totalCost: 0 })
const costChartData = ref([])
const warnings = ref([])
const capacity = computed(() => calculateCapacity(form))

// 设置
const settings = ref({})

// 详情数据
const detail = ref({ approvalRecords: [] })
const versionHistory = ref([])

// 复制
const copyDialogVisible = ref(false)
const copySearch = ref('')
const copyLoading = ref(false)
const copyCandidates = ref([])

// 自动计算
function calc() {
  const calcResult = calculateCost({ ...form, storedStandardPrice: form.standardPrice || 0, storedTotalCost: form.totalCost || 0 }, settings.value)
  result.value = calcResult
  costChartData.value = getCostChartData(calcResult.costBreakdown)
  warnings.value = checkWarnings(calcResult, settings.value)
}

// 监听成本相关字段变化
watch(
  () => [form.glueConsumption, form.gluePrice, form.trimming, form.inspection,
    form.electricity, form.equipmentDep, form.moldAmort, form.packaging, form.transport,
    form.cycleTime, form.shiftHours, form.cavities, form.lossRate],
  () => { if (form.glueConsumption > 0 || form.gluePrice > 0) calc() },
  { deep: true }
)

async function loadDetail() {
  if (!route.params.id) return
  try {
    const data = await getValuationDetail(route.params.id)
    Object.assign(form, data)
    detail.value = data

    if (data.totalCost > 0) calc()

    // 加载版本历史
    const history = await getValuationHistory(route.params.id)
    versionHistory.value = history || []
  } catch { /* handled */ }
}

async function loadSettings() {
  try {
    const s = await getSettings()
    settings.value = s
    appStore.setCurrentSettings(s)
  } catch { /* ignore */ }
}

async function handleSubmit(status) {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid || submitting.value) return

  // 计算最终结果
  calc()
  const submitData = {
    ...form,
    ...result.value,
    status,
  }
  if (status === 'pending') submitData.submitTime = new Date().toISOString()

  submitting.value = true
  try {
    if (isCreate.value) {
      await createValuation(submitData)
      ElMessage.success('核价单创建成功')
    } else {
      await updateValuation(submitData)
      ElMessage.success('核价单更新成功')
    }
    router.push('/valuation/list')
  } catch { /* handled */ }
  finally { submitting.value = false }
}

// 复制功能
async function handleCopyFrom() {
  copyDialogVisible.value = true
  copyLoading.value = true
  try {
    const res = await getValuationList({ pageSize: 20 })
    copyCandidates.value = res?.list || []
  } finally { copyLoading.value = false }
}

function selectCopyTarget(row) {
  Object.assign(form, {
    customer: row.customer, materialId: row.materialId, spec: row.spec,
    cureTemp: row.cureTemp, cureTime: row.cureTime, tonnage: row.tonnage,
    shiftHours: row.shiftHours, cavities: row.cavities, cycleTime: row.cycleTime,
    netWeight: row.netWeight, grossWeight: row.grossWeight,
    glueConsumption: row.glueConsumption, lossRate: row.lossRate, defectRate: row.defectRate,
    gluePrice: row.gluePrice, trimming: row.trimming, inspection: row.inspection,
    electricity: row.electricity, equipmentDep: row.equipmentDep, moldAmort: row.moldAmort,
    packaging: row.packaging, transport: row.transport,
    image: row.image || '',
  })
  copyDialogVisible.value = false
  calc()
  ElMessage.success('已复制数据，请修改后保存')
}

// 版本查看与回滚
async function viewVersion(version) {
  try {
    const data = await getVersionDetail(route.params.id, version)
    ElMessage.info(`版本 ${version}: 总成本 ${formatMoney(data.totalCost)}`)
  } catch { /* handled */ }
}

async function rollbackVersion(version) {
  try {
    await apiRollback(route.params.id, version)
    ElMessage.success('已回滚到版本 ' + version)
    loadDetail()
  } catch { /* handled */ }
}

onMounted(() => {
  loadSettings()
  if (route.params.id) loadDetail()
})
</script>

<style scoped>
.form-section {
  background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid #dcdfe6; display: flex; align-items: center; gap: 6px;
}
.result-section {
  background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.result-card {
  background: #f5f7fa; border-radius: 8px; padding: 16px; text-align: center;
}
.result-card.small { padding: 12px; }
.result-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.result-value { font-size: 20px; font-weight: 600; }
.result-value.primary { color: #409eff; }
.result-value.warning { color: #e6a23c; }
.result-value.success { color: #67c23a; }
.result-value.danger { color: #f56c6c; }
.result-sub { font-size: 12px; color: #909399; margin-top: 2px; }
.chart-container {
  margin-top: 16px; padding: 16px; background: #fafafa; border-radius: 8px;
}
.chart-container h4 { font-size: 14px; margin-bottom: 8px; }
</style>
