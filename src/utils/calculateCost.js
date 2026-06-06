/**
 * 核价计算公式
 *
 * 根据需求文档定义的完整成本核算公式
 */

/**
 * 执行完整的核价计算
 * @param {Object} params - 核价输入参数
 * @param {Object} settings - 系统设置（利润率、管理费率等）
 * @returns {Object} 计算结果
 */
export function calculateCost(params, settings = {}) {
  // 从参数解构
  const { storedStandardPrice = 0, storedTotalCost = 0,
    // 基础信息
    // 工艺参数
    cureTemp = 0,
    cureTime = 0,
    tonnage = 0,
    shiftHours = 11,
    cavities = 1,
    cycleTime = 0,
    // 用胶定额
    netWeight = 0,
    grossWeight = 0,
    glueConsumption = 0,
    // 质量成本
    lossRate = 10,
    defectRate = 0.3,
    // 原材料成本
    gluePrice = 0,
    // 人工工序成本
    trimming = 0,
    inspection = 0,
    // 制造分摊
    electricity = 0,
    equipmentDep = 0,
    moldAmort = 0,
    // 辅助成本
    packaging = 0,
    transport = 0,
  } = params

  // 系统设置（带默认值）
  const {
    managementRate = 10,       // 管理费率 默认10%
    minProfitRate = 5,         // 最低利润率 默认5%
    standardProfitRate = 15,   // 合理利润率 默认15%
    highProfitRate = 30,       // 高利润率 默认30%
  } = settings

  // ========== 1. 原材料成本 ==========
  const materialCost = (glueConsumption / 1000) * gluePrice

  // ========== 2. 人工工序成本 ==========
  const laborCost = (trimming || 0) + (inspection || 0)

  // ========== 3. 制造分摊 ==========
  const manufacturingCost = (electricity || 0) + (equipmentDep || 0) + (moldAmort || 0)

  // ========== 4. 小计 ==========
  const subtotal = materialCost + laborCost + manufacturingCost + (packaging || 0) + (transport || 0)

  // ========== 5. 管理费 ==========
  const managementFee = subtotal * (managementRate / 100)

  // ========== 6. 总成本 ==========
  const totalCost = storedTotalCost > 0 ? storedTotalCost : subtotal + managementFee

  // ========== 7. 三种定价 ==========
  const minPrice = storedStandardPrice > 0 ? totalCost * (1 + minProfitRate / 100) : 0
  const standardPrice = storedStandardPrice > 0 ? storedStandardPrice : 0
  const highPrice = storedStandardPrice > 0 ? totalCost * (1 + highProfitRate / 100) : 0

  // ========== 8. 毛利 ==========
  const grossProfit = standardPrice > 0 ? standardPrice - totalCost : 0
  const grossProfitRate = (standardPrice > 0 && totalCost > 0) ? (grossProfit / standardPrice) * 100 : null

  // ========== 9. 产能计算（仅前端展示） ==========
  const shiftSeconds = shiftHours * 3600
  const theoreticalCapacity = cycleTime > 0 ? Math.round((shiftSeconds / cycleTime) * cavities) : 0
  const actualCapacity = Math.round(theoreticalCapacity * (1 - lossRate / 100))
  const hourlyCapacity = shiftHours > 0 ? Math.round(theoreticalCapacity / shiftHours) : 0

  // 每个成本项占比（用于图表）
  const totalForPercent = materialCost + laborCost + manufacturingCost + packaging + transport + managementFee
  const costBreakdown = {
    materialCost: { label: '原材料成本', value: materialCost, percent: totalForPercent > 0 ? (materialCost / totalForPercent) * 100 : 0 },
    laborCost: { label: '人工工序成本', value: laborCost, percent: totalForPercent > 0 ? (laborCost / totalForPercent) * 100 : 0 },
    manufacturingCost: { label: '制造分摊', value: manufacturingCost, percent: totalForPercent > 0 ? (manufacturingCost / totalForPercent) * 100 : 0 },
    packaging: { label: '包装', value: packaging, percent: totalForPercent > 0 ? (packaging / totalForPercent) * 100 : 0 },
    transport: { label: '运输', value: transport, percent: totalForPercent > 0 ? (transport / totalForPercent) * 100 : 0 },
    managementFee: { label: '管理费', value: managementFee, percent: totalForPercent > 0 ? (managementFee / totalForPercent) * 100 : 0 },
  }

  return {
    // 成本明细
    materialCost,
    laborCost,
    manufacturingCost,
    packaging: packaging || 0,
    transport: transport || 0,
    subtotal,
    managementFee,
    totalCost,
    // 定价
    minPrice,
    standardPrice,
    highPrice,
    // 毛利
    grossProfit,
    grossProfitRate,
    // 产能
    theoreticalCapacity,
    actualCapacity,
    hourlyCapacity,
    // 成本结构（用于图表）
    costBreakdown,
    // 预警判定
    materialCostRatio: totalForPercent > 0 ? (materialCost / totalForPercent) * 100 : 0,
  }
}

/**
 * 获取成本结构饼图数据
 */
export function getCostChartData(costBreakdown) {
  if (!costBreakdown) return []
  const colorMap = {
    materialCost: '#409EFF',
    laborCost: '#67C23A',
    manufacturingCost: '#E6A23C',
    packaging: '#F56C6C',
    transport: '#909399',
    managementFee: '#B37FEB',
  }
  return Object.entries(costBreakdown).map(([key, item]) => ({
    name: item.label,
    value: Math.round(item.value * 10000) / 10000,
    itemStyle: { color: colorMap[key] || '#999' },
  }))
}

/**
 * 检查是否触发预警
 */
export function checkWarnings(result, settings = {}) {
  const warnings = []
  const { materialCostWarningThreshold = 70, gluePriceWarningThreshold = 5 } = settings

  // 材料成本占比预警
  if (result.materialCostRatio > materialCostWarningThreshold) {
    warnings.push({
      type: 'materialCost',
      severity: 'warning',
      message: `材料成本占比 ${result.materialCostRatio.toFixed(1)}% 超过预警阈值 ${materialCostWarningThreshold}%`,
    })
  }

  return warnings
}
