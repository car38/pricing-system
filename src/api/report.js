import request from '@/utils/request'

export function getDashboardData() {
  return request.post('/report', { action: 'dashboard', data: {} })
}

export function getMonthlyTrend() {
  return request.post('/report', { action: 'monthlyTrend', data: {} })
}

export function getCustomerTop(count = 10) {
  return request.post('/report', { action: 'customerTop', data: { count } })
}

export function getValuerRanking() {
  return request.post('/report', { action: 'valuerRanking', data: {} })
}

export function exportValuationReport(data) {
  return request.post('/report', { action: 'exportReport', data, responseType: 'blob' })
}

export function exportQuotePDF(valuationId) {
  return request.post('/report', { action: 'exportPDF', data: { valuationId }, responseType: 'blob' })
}
