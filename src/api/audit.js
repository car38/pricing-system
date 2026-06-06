import request from '@/utils/request'

/** 获取更新日志 */
export function getAuditLogs(params) {
  return request.post('/audit/logs', { action: 'list', data: params })
}
