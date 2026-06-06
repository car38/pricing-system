import request from '@/utils/request'

/** 获取所有物料ID列表 */
export function getMaterialList() {
  return request.post('/material/list', {})
}

/** 获取物料成本历史趋势 */
export function getMaterialTrend(materialId) {
  return request.post('/material/trend', { action: 'trend', data: { materialId } })
}
