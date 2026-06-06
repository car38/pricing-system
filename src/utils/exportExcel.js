/**
 * Excel 导入导出工具
 * 使用 SheetJS (xlsx) 处理 Excel 文件
 */
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'

/**
 * 导出核价单列表为 Excel
 * @param {Array} data - 核价单数据
 * @param {Object} filters - 筛选条件，用于文件名
 */
export function exportValuationExcel(data, filters = {}) {
  // 定义列映射
  const headers = [
    { key: 'valuationNo', label: '核价单号' },
    { key: 'customer', label: '客户' },
    { key: 'materialId', label: '物料ID' },
    { key: 'spec', label: '材质规格' },
    { key: 'gluePrice', label: '胶料单价(元/KG)' },
    { key: 'totalCost', label: '总成本(元/PCS)' },
    { key: 'minPrice', label: '最低售价(元/PCS)' },
    { key: 'standardPrice', label: '合理售价(元/PCS)' },
    { key: 'highPrice', label: '高利润售价(元/PCS)' },
    { key: 'grossProfitRate', label: '毛利率(%)' },
    { key: 'status', label: '状态' },
    { key: 'createdAt', label: '创建时间' },
  ]

  // 状态映射
  const statusMap = {
    draft: '草稿',
    pending: '待审批',
    approved: '已批准',
    active: '已生效',
    rejected: '已驳回',
  }

  // 准备数据
  const rows = data.map((item) => {
    const row = {}
    headers.forEach((h) => {
      if (h.key === 'status') {
        row[h.label] = statusMap[item[h.key]] || item[h.key]
      } else if (h.key === 'createdAt') {
        row[h.label] = item[h.key] ? dayjs(item[h.key]).format('YYYY-MM-DD HH:mm:ss') : ''
      } else if (['totalCost', 'minPrice', 'standardPrice', 'highPrice', 'grossProfitRate', 'gluePrice'].includes(h.key)) {
        row[h.label] = item[h.key] !== undefined ? Number(item[h.key]).toFixed(4) : ''
      } else {
        row[h.label] = item[h.key] !== undefined ? item[h.key] : ''
      }
    })
    return row
  })

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // 设置列宽
  ws['!cols'] = headers.map(() => ({ wch: 18 }))
  XLSX.utils.book_append_sheet(wb, ws, '核价单')

  // 导出
  const filterStr = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}-${v}`)
    .join('_')
  const fileName = `核价单_${filterStr || '全部'}_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName)
}

/**
 * 生成导入模板 Excel
 */
export function downloadImportTemplate() {
  const headers = [
    { key: 'customer', label: '客户(必填)', width: 15 },
    { key: 'materialId', label: '物料ID(必填)', width: 20 },
    { key: 'spec', label: '材质规格', width: 15 },
    { key: 'cureTemp', label: '硫化温度(℃)', width: 15 },
    { key: 'cureTime', label: '硫化时间(秒)', width: 15 },
    { key: 'tonnage', label: '机台吨位(T)', width: 15 },
    { key: 'shiftHours', label: '班次时长(H)', width: 15 },
    { key: 'cavities', label: '模具模穴数', width: 15 },
    { key: 'cycleTime', label: '成型周期(秒)', width: 15 },
    { key: 'netWeight', label: '净重(克)', width: 12 },
    { key: 'grossWeight', label: '毛重(克)', width: 12 },
    { key: 'glueConsumption', label: '用胶定额(g/只)', width: 15 },
    { key: 'lossRate', label: '损耗率(%)', width: 12 },
    { key: 'defectRate', label: '不良率(%)', width: 12 },
    { key: 'gluePrice', label: '胶料单价(元/KG)', width: 18 },
    { key: 'trimming', label: '修边(元/PCS)', width: 15 },
    { key: 'inspection', label: '检验(元/PCS)', width: 15 },
    { key: 'electricity', label: '电费(元/PCS)', width: 15 },
    { key: 'equipmentDep', label: '设备折旧(元/PCS)', width: 18 },
    { key: 'moldAmort', label: '模具摊销(元/PCS)', width: 18 },
    { key: 'packaging', label: '包装(元/PCS)', width: 15 },
    { key: 'transport', label: '运输(元/PCS)', width: 15 },
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet([{}], { header: headers.map((h) => h.label) })
  ws['!cols'] = headers.map((h) => ({ wch: h.width }))

  // 添加第二行示例数据
  const sampleRow = {}
  headers.forEach((h) => {
    const examples = {
      customer: '示例客户',
      materialId: 'MAT-001',
      spec: 'EPDM-70A',
      cureTemp: '170',
      cureTime: '300',
      tonnage: '200',
      shiftHours: '11',
      cavities: '4',
      cycleTime: '45',
      netWeight: '50',
      grossWeight: '65',
      glueConsumption: '60',
      lossRate: '10',
      defectRate: '0.3',
      gluePrice: '25',
      trimming: '0.15',
      inspection: '0.08',
      electricity: '0.12',
      equipmentDep: '0.05',
      moldAmort: '0.03',
      packaging: '0.20',
      transport: '0.10',
    }
    sampleRow[h.label] = examples[h.key] || ''
  })
  XLSX.utils.sheet_add_json(ws, [sampleRow], { skipHeader: true, origin: 'A2' })

  // 添加说明行
  const noteRow = {}
  noteRow[headers[0].label] = '注：黄色列为必填项，蓝色行为示例数据'
  XLSX.utils.sheet_add_json(ws, [noteRow], { skipHeader: true, origin: 'A3' })

  XLSX.utils.book_append_sheet(wb, ws, '导入模板')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), '核价单导入模板.xlsx')
}

/**
 * 解析导入的 Excel 文件，校验必填字段并返回数据
 * @param {File} file - 上传的 Excel 文件
 * @returns {Object} { data: 有效数据行, errors: 错误行信息 }
 */
export function parseImportExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

        const validData = []
        const errors = []
        const requiredFields = ['客户(必填)', '物料ID(必填)']

        rows.forEach((row, index) => {
          const lineNum = index + 2 // +2 因为 header 在第1行
          const missingFields = requiredFields.filter((f) => !row[f] || String(row[f]).trim() === '')

          if (missingFields.length > 0) {
            errors.push({
              line: lineNum,
              message: `缺少必填字段: ${missingFields.join(', ')}`,
            })
            return
          }

          // 跳过说明行
          if (String(row['客户(必填)']).startsWith('注：')) return

          // 转换字段名（中文 -> 英文）
          const fieldMap = {
            '客户(必填)': 'customer',
            '物料ID(必填)': 'materialId',
            '材质规格': 'spec',
            '硫化温度(℃)': 'cureTemp',
            '硫化时间(秒)': 'cureTime',
            '机台吨位(T)': 'tonnage',
            '班次时长(H)': 'shiftHours',
            '模具模穴数': 'cavities',
            '成型周期(秒)': 'cycleTime',
            '净重(克)': 'netWeight',
            '毛重(克)': 'grossWeight',
            '用胶定额(g/只)': 'glueConsumption',
            '损耗率(%)': 'lossRate',
            '不良率(%)': 'defectRate',
            '胶料单价(元/KG)': 'gluePrice',
            '修边(元/PCS)': 'trimming',
            '检验(元/PCS)': 'inspection',
            '电费(元/PCS)': 'electricity',
            '设备折旧(元/PCS)': 'equipmentDep',
            '模具摊销(元/PCS)': 'moldAmort',
            '包装(元/PCS)': 'packaging',
            '运输(元/PCS)': 'transport',
          }

          const item = {}
          Object.entries(row).forEach(([cnKey, value]) => {
            const enKey = fieldMap[cnKey]
            if (enKey) {
              // 数字字段转换
              const numericFields = [
                'cureTemp', 'cureTime', 'tonnage', 'shiftHours', 'cavities', 'cycleTime',
                'netWeight', 'grossWeight', 'glueConsumption', 'lossRate', 'defectRate',
                'gluePrice', 'trimming', 'inspection', 'electricity', 'equipmentDep',
                'moldAmort', 'packaging', 'transport',
              ]
              if (numericFields.includes(enKey)) {
                item[enKey] = Number(value) || 0
              } else {
                item[enKey] = String(value).trim()
              }
            }
          })

          // 设置默认值
          if (!item.lossRate) item.lossRate = 10
          if (!item.defectRate) item.defectRate = 0.3
          if (!item.shiftHours) item.shiftHours = 11

          validData.push(item)
        })

        resolve({ data: validData, errors })
      } catch (err) {
        reject(new Error('Excel 文件解析失败: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}
