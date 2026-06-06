<template>
  <div>
    <div class="page-header"><h2>系统设置</h2><el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button></div>
    <el-form :model="form" label-width="180px" ref="formRef">
      <div class="form-section"><div class="section-title"><el-icon><TrendCharts /></el-icon> 利润率配置</div>
        <el-row :gutter="24">
          <el-col :span="8"><el-form-item label="最低利润率(%)" prop="minProfitRate"><el-input-number v-model="form.minProfitRate" :min="-50" :max="100" :precision="2" :step="0.5" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="合理利润率(%)" prop="standardProfitRate"><el-input-number v-model="form.standardProfitRate" :min="-50" :max="100" :precision="2" :step="0.5" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="高利润率(%)" prop="highProfitRate"><el-input-number v-model="form.highProfitRate" :min="-50" :max="100" :precision="2" :step="0.5" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </div>
      <div class="form-section"><div class="section-title"><el-icon><Coin /></el-icon> 费率配置</div>
        <el-row :gutter="24"><el-col :span="8"><el-form-item label="管理费率(%)" prop="managementRate"><el-input-number v-model="form.managementRate" :min="0" :max="100" :precision="2" :step="0.5" style="width:100%" /></el-form-item></el-col></el-row>
      </div>
      <div class="form-section"><div class="section-title"><el-icon><WarningFilled /></el-icon> 预警阈值配置</div>
        <el-row :gutter="24">
          <el-col :span="8"><el-form-item label="材料成本占比预警(%)"><el-input-number v-model="form.materialCostWarningThreshold" :min="0" :max="100" :step="5" style="width:100%" /><div style="font-size:12px;color:#909399;margin-top:4px">默认70%，超过则预警</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="成本倒挂预警(%)"><el-input-number v-model="form.lowProfitWarning" :min="-50" :max="0" :precision="1" :step="0.5" style="width:100%" /><div style="font-size:12px;color:#909399;margin-top:4px">默认-10%，毛利率低于此值则预警</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="胶料涨价预警(%)"><el-input-number v-model="form.gluePriceWarningThreshold" :min="0" :max="100" :precision="1" :step="0.5" style="width:100%" /><div style="font-size:12px;color:#909399;margin-top:4px">默认5%，超过则通知核价员</div></el-form-item></el-col>
        </el-row>
      </div>
      <div class="form-section"><div class="section-title"><el-icon><Message /></el-icon> 邮件通知设置</div>
        <el-row :gutter="24">
          <el-col :span="12"><el-form-item label="SMTP 地址"><el-input v-model="form.smtpHost" placeholder="smtp.example.com" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="端口"><el-input-number v-model="form.smtpPort" :min="1" :max="65535" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="加密方式"><el-select v-model="form.smtpSecure" style="width:100%"><el-option label="SSL/TLS" :value="true" /><el-option label="无" :value="false" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12"><el-form-item label="发件人邮箱"><el-input v-model="form.smtpUser" placeholder="notification@company.com" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="发件人密码/授权码"><el-input v-model="form.smtpPass" type="password" show-password placeholder="SMTP 密码或授权码" /></el-form-item></el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSettings } from '@/api/settings'
const formRef = ref(null), saving = ref(false)
const form = reactive({ minProfitRate:5, standardProfitRate:15, highProfitRate:30, managementRate:10, materialCostWarningThreshold:70, lowProfitWarning:-10, gluePriceWarningThreshold:5, smtpHost:'', smtpPort:465, smtpSecure:true, smtpUser:'', smtpPass:'' })
async function loadSettings() { try { const d=await getSettings(); if(d) Object.assign(form,d) } catch {} }
async function handleSave() { saving.value=true; try { await updateSettings({...form}); ElMessage.success('设置保存成功') } catch{} finally { saving.value=false } }
onMounted(loadSettings)
</script>
<style scoped>
.form-section { background:#fff; border-radius:8px; padding:20px; margin-bottom:16px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
.section-title { font-size:15px; font-weight:600; color:#303133; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid #dcdfe6; display:flex; align-items:center; gap:6px; }
</style>
