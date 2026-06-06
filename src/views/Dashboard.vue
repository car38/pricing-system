<template>
  <div class="dashboard-page">
    <div class="kpi-grid">
      <StatCard label="总核价单数" :value="kpi.totalCount" icon="Document" color="#409eff" sublabel="累计全部状态" />
      <StatCard label="本月新增" :value="kpi.monthCount" icon="TrendCharts" color="#67c23a" :trend="kpi.momChange" />
      <StatCard label="待审批" :value="kpi.pendingCount" icon="Clock" color="#e6a23c" icon-bg="#fdf6ec" :clickable="true" sublabel="点击查看" @click="goToApproval" />
      <StatCard label="本月平均总成本" :value="formattedAvgCost" icon="Money" color="#f56c6c" sublabel="元/PCS" />
    </div>
    <div v-if="loading" class="loading-wrapper"><el-skeleton :rows="6" animated /></div>
    <template v-else>
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="12"><div class="chart-card">
          <div class="chart-header"><h3>各客户核价单数量 TOP10</h3><span class="chart-hint">点击柱形跳转列表</span></div>
          <div v-if="customerTop.length===0" class="chart-empty"><el-empty description="暂无客户数据" /></div>
          <v-chart v-else :option="customerChartOption" style="height:300px" autoresize @click="handleCustomerClick" />
        </div></el-col>
        <el-col :xs="24" :lg="12"><div class="chart-card">
          <div class="chart-header"><h3><el-icon color="#e6a23c"><WarningFilled /></el-icon> 成本倒挂预警</h3></div>
          <div v-if="warnings.lowProfitWarnings?.length===0" class="chart-empty"><el-empty description="暂无成本倒挂预警" /></div>
          <el-table v-else :data="warnings.lowProfitWarnings" stripe size="small" style="width:100%" @row-click="(r)=>$router.push(`/valuation/detail/${r._id}`)">
            <el-table-column prop="valuationNo" label="核价单号" width="140" />
            <el-table-column prop="customer" label="客户" width="120" />
            <el-table-column prop="materialId" label="物料ID" width="120" />
            <el-table-column label="毛利率" width="100"><template #default="{row}"><el-tag type="danger" effect="dark">{{ row.grossProfitRate!=null?Number(row.grossProfitRate).toFixed(2)+'%':'-' }}</el-tag></template></el-table-column>
          </el-table>
        </div></el-col>
      </el-row>
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="12"><div class="chart-card">
          <div class="chart-header">
            <h3>成本趋势</h3>
            <el-select v-model="trendMaterial" filterable clearable placeholder="选择物料查看成本走势" style="width:240px" @change="loadMaterialTrend">
              <el-option v-for="id in materialList" :key="id" :label="id" :value="id" />
            </el-select>
          </div>
          <div v-if="!trendMaterial" class="chart-empty"><el-empty description="请在上方选择物料" /></div>
          <div v-else-if="materialTrendLoading" class="chart-empty"><el-icon class="is-loading" :size="32"><Loading /></el-icon></div>
          <div v-else-if="materialTrendData.length===0" class="chart-empty"><el-empty description="暂无数据" /></div>
          <v-chart v-else :option="materialTrendOption" style="height:300px" autoresize />
        </div></el-col>
        <el-col :xs="24" :lg="12"><div class="chart-card">
          <div class="chart-header"><h3>成本结构分布</h3></div>
          <div v-if="!costStructure?.breakdown?.length" class="chart-empty"><el-empty description="暂无成本数据" /></div>
          <v-chart v-else :option="costPieOption" style="height:300px" autoresize />
        </div></el-col>
      </el-row>
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="12"><div class="chart-card">
          <div class="chart-header"><h3><el-icon color="#e6a23c"><WarningFilled /></el-icon> 材料成本占比预警</h3></div>
          <div v-if="warnings.materialWarnings?.length===0" class="chart-empty"><el-empty description="暂无材料成本超标预警" /></div>
          <el-table v-else :data="warnings.materialWarnings" stripe size="small" style="width:100%" @row-click="(r)=>$router.push(`/valuation/detail/${r._id}`)">
            <el-table-column prop="valuationNo" label="核价单号" width="140" />
            <el-table-column prop="customer" label="客户" width="120" />
            <el-table-column prop="materialId" label="物料ID" width="120" />
            <el-table-column label="材料成本占比" width="110"><template #default="{row}"><el-tag type="danger" effect="dark">{{ row.ratio }}%</el-tag></template></el-table-column>
          </el-table>
        </div></el-col>
        <el-col :xs="24" :lg="12"><div class="chart-card">
          <div class="chart-header"><h3><el-icon color="#e6a23c"><WarningFilled /></el-icon> 胶料涨价预警</h3></div>
          <div v-if="warnings.glueWarnings?.length===0" class="chart-empty"><el-empty description="暂无胶料涨价预警" /></div>
          <el-table v-else :data="warnings.glueWarnings" stripe size="small" style="width:100%">
            <el-table-column prop="materialId" label="物料ID" width="130" />
            <el-table-column label="上次价格" width="120"><template #default="{row}">{{ formatMoney(row.previousPrice) }}</template></el-table-column>
            <el-table-column label="最新价格" width="120"><template #default="{row}">{{ formatMoney(row.latestPrice) }}</template></el-table-column>
            <el-table-column label="涨幅" width="90"><template #default="{row}"><el-tag :type="row.increase>10?'danger':'warning'" effect="dark">+{{ row.increase }}%</el-tag></template></el-table-column>
          </el-table>
        </div></el-col>
      </el-row>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { getAllDashboardData } from '@/api/dashboard'
import { getMaterialList, getMaterialTrend } from '@/api/material'
import { formatMoney } from '@/utils/utils'
import StatCard from '@/components/StatCard.vue'
use([CanvasRenderer,BarChart,LineChart,PieChart,GridComponent,TooltipComponent,LegendComponent,TitleComponent])
const router=useRouter(),loading=ref(true)
const kpi=reactive({totalCount:0,monthCount:0,momChange:0,pendingCount:0,avgCost:0})
const formattedAvgCost=computed(()=>kpi.avgCost?'¥'+Number(kpi.avgCost).toLocaleString('zh-CN',{minimumFractionDigits:4}):'¥0.0000')
function goToApproval(){router.push('/approval/pending')}
const customerTop=ref([])
const customerChartOption=computed(()=>({tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:(p)=>'<strong>'+p[0].name+'</strong><br/>核价单数: '+p[0].value+' 份'},grid:{left:80,right:30,bottom:40,top:20},xAxis:{type:'value'},yAxis:{type:'category',data:[...customerTop.value].reverse().map(c=>c.name),axisLabel:{fontSize:12}},series:[{type:'bar',data:[...customerTop.value].reverse().map(c=>c.value),barMaxWidth:28,cursor:'pointer',itemStyle:{color:{type:'linear',x:0,y:0,x2:1,y2:0,colorStops:[{offset:0,color:'#409eff'},{offset:1,color:'#79bbff'}]},borderRadius:[0,6,6,0]},emphasis:{itemStyle:{color:'#337ecc'}}}]}))
function handleCustomerClick(p){if(p.name)router.push('/valuation/list?customer='+encodeURIComponent(p.name))}
const costStructure=ref(null)
const pieColors=['#409eff','#67c23a','#e6a23c','#f56c6c','#909399','#b37feb']
const costPieOption=computed(()=>({tooltip:{trigger:'item',formatter:(p)=>'<strong>'+p.name+'</strong><br/>¥'+Number(p.value).toFixed(4)+'<br/>占比: '+p.percent+'%'},legend:{orient:'vertical',right:10,top:'center',textStyle:{fontSize:12}},series:[{type:'pie',radius:['40%','68%'],center:['40%','50%'],avoidLabelOverlap:true,itemStyle:{borderRadius:6,borderColor:'#fff',borderWidth:2},label:{show:true,formatter:'{d}%',fontSize:11},emphasis:{label:{show:true,fontSize:14,fontWeight:'bold'}},data:(costStructure.value?.breakdown||[]).map((item,i)=>({...item,itemStyle:{color:pieColors[i%pieColors.length]}}))}]}))
const warnings=reactive({materialWarnings:[],glueWarnings:[],lowProfitWarnings:[],threshold:70,profitThreshold:-20})
const materialList=ref([])
const trendMaterial=ref('')
const materialTrendLoading=ref(false)
const materialTrendData=ref([])
const materialTrendOption=computed(()=>({tooltip:{trigger:'axis'},legend:{data:['总成本','材料成本','胶料单价','含税销售单价'],top:0},grid:{left:60,right:30,bottom:40,top:40},xAxis:{type:'category',data:materialTrendData.value.map(d=>d.createdAt?new Date(d.createdAt).toLocaleDateString():''),axisLabel:{rotate:30,fontSize:11}},yAxis:[{type:'value',name:'成本(元)'},{type:'value',name:'胶料单价',min:0}],series:[{name:'总成本',type:'line',smooth:true,data:materialTrendData.value.map(d=>d.totalCost),symbol:'circle',symbolSize:6,lineStyle:{width:2,color:'#e6a23c'},itemStyle:{color:'#e6a23c'}},{name:'材料成本',type:'bar',data:materialTrendData.value.map(d=>d.materialCost),itemStyle:{color:'#409eff',borderRadius:[2,2,0,0]},barMaxWidth:20},{name:'胶料单价',type:'line',smooth:true,yAxisIndex:1,data:materialTrendData.value.map(d=>d.gluePrice),symbol:'diamond',symbolSize:6,lineStyle:{width:2,color:'#67c23a',type:'dashed'},itemStyle:{color:'#67c23a'}},{name:'含税销售单价',type:'line',smooth:true,data:materialTrendData.value.map(d=>d.standardPrice),symbol:'triangle',symbolSize:8,lineStyle:{width:2,color:'#f56c6c',type:'dashed'},itemStyle:{color:'#f56c6c'}}]}))
async function loadMaterialTrend(id){if(!id){materialTrendData.value=[];return}materialTrendLoading.value=true;try{materialTrendData.value=await getMaterialTrend(id)||[]}catch{materialTrendData.value=[]}finally{materialTrendLoading.value=false}}
async function loadData(){
  loading.value=true
  try{
    const [data,matList]=await Promise.all([getAllDashboardData(),getMaterialList().catch(()=>[])])
    materialList.value=matList||[]
    if(data?.kpi)Object.assign(kpi,data.kpi)
    customerTop.value=data?.customerTop||[]
    costStructure.value=data?.costStructure||null
    if(data?.warnings){
      warnings.materialWarnings=data.warnings.materialWarnings||[]
      warnings.glueWarnings=data.warnings.glueWarnings||[]
      warnings.lowProfitWarnings=data.warnings.lowProfitWarnings||[]
      warnings.threshold=data.warnings.threshold||70
      warnings.profitThreshold=data.warnings.profitThreshold||-20
    }
  }catch{}finally{loading.value=false}
}
onMounted(loadData)
</script>
<style scoped>
.dashboard-page{max-width:1400px;margin:0 auto}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:24px}
.chart-row{margin-bottom:16px!important}
.chart-card{background:#fff;border-radius:10px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);transition:box-shadow .2s}
.chart-card:hover{box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.chart-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #f0f0f0}
.chart-header h3{font-size:15px;font-weight:600;color:#303133;display:flex;align-items:center;gap:6px}
.chart-hint{font-size:12px;color:#909399}
.chart-empty{min-height:200px;display:flex;align-items:center;justify-content:center}
.loading-wrapper{background:#fff;border-radius:10px;padding:40px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
@media(max-width:768px){.kpi-grid{grid-template-columns:1fr 1fr}}
</style>
