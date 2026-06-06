import request from '@/utils/request'

export function getValuationList(data) {
  return request.post('/valuation', { action: 'list', data })
}

export function getValuationDetail(id) {
  return request.post('/valuation', { action: 'get', data: { id } })
}

export function createValuation(data) {
  return request.post('/valuation', { action: 'create', data })
}

export function updateValuation(data) {
  return request.post('/valuation', { action: 'update', data })
}

export function deleteValuation(id) {
  return request.post('/valuation', { action: 'delete', data: { id } })
}

export function submitValuation(id) {
  return request.post('/valuation', { action: 'submit', data: { id } })
}

export function copyValuation(id) {
  return request.post('/valuation', { action: 'copy', data: { id } })
}

export function batchSubmitValuation(ids) {
  return request.post('/valuation', { action: 'batchSubmit', data: { ids } })
}

export function batchDeleteValuation(ids) {
  return request.post('/valuation', { action: 'batchDelete', data: { ids } })
}

export function getValuationHistory(valuationId) {
  return request.post('/valuation', { action: 'getHistory', data: { valuationId } })
}

export function getVersionDetail(valuationId, version) {
  return request.post('/valuation', { action: 'getVersionDetail', data: { valuationId, version } })
}

export function rollbackVersion(valuationId, version) {
  return request.post('/valuation', { action: 'rollback', data: { valuationId, version } })
}

export function compareVersions(valuationId, v1, v2) {
  return request.post('/valuation', { action: 'compareVersions', data: { valuationId, versionA: v1, versionB: v2 } })
}

export function batchImportValuation(data) {
  return request.post('/valuation', { action: 'batchImport', data })
}
