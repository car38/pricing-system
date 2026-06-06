import request from '@/utils/request'

export function getSettings() {
  return request.post('/settings', { action: 'get', data: {} })
}

export function updateSettings(data) {
  return request.post('/settings', { action: 'update', data })
}

export function initDatabase() {
  return request.post('/init', { action: 'initDB', data: {} })
}
