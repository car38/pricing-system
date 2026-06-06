import request from '@/utils/request'

export function getAllDashboardData() {
  return request.post('/dashboard', { action: 'all', data: {} })
}

export function getDashboardKpi() {
  return request.post('/dashboard', { action: 'kpi', data: {} })
}

export function getCustomerTop(count = 10) {
  return request.post('/dashboard', { action: 'customerTop', data: { count } })
}

export function getValuerRanking() {
  return request.post('/dashboard', { action: 'valuerRanking', data: {} })
}

export function getCostTrend() {
  return request.post('/dashboard', { action: 'costTrend', data: {} })
}

export function getCostStructure() {
  return request.post('/dashboard', { action: 'costStructure', data: {} })
}

export function getMonthlyTrend() {
  return request.post('/dashboard', { action: 'monthlyTrend', data: {} })
}

export function getDashboardWarnings() {
  return request.post('/dashboard', { action: 'warnings', data: {} })
}
