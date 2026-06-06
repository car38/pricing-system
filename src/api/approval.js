import request from '@/utils/request'

export function getPendingApprovalList(data) {
  return request.post('/approval', { action: 'pendingList', data })
}

export function approveValuation(data) {
  return request.post('/approval', { action: 'approve', data })
}

export function rejectValuation(data) {
  return request.post('/approval', { action: 'reject', data })
}

export function batchApprove(data) {
  return request.post('/approval', { action: 'batchApprove', data })
}

export function batchReject(data) {
  return request.post('/approval', { action: 'batchReject', data })
}

export function getApprovalRecords(valuationId) {
  return request.post('/approval', { action: 'records', data: { valuationId } })
}
