import dayjs from 'dayjs'

/**
 * 格式化日期
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  return date ? dayjs(date).format(format) : ''
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  return date ? dayjs(date).format(format) : ''
}

/**
 * 格式化金额 (¥xxx.xx)
 */
export function formatMoney(value) {
  if (value === null || value === undefined || isNaN(value)) return '¥0.0000'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
}

/**
 * 千分位格式化数字
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/**
 * 产能自动计算
 */
export function calculateCapacity(params) {
  const { shiftHours = 11, cycleTime = 0, cavities = 1, lossRate = 10 } = params
  if (!cycleTime || cycleTime <= 0) return { theoretical: 0, actual: 0, hourly: 0 }
  const theoretical = Math.round((shiftHours * 3600) / cycleTime * cavities)
  const actual = Math.round(theoretical * (1 - lossRate / 100))
  const hourly = shiftHours ? Math.round(theoretical / shiftHours) : 0
  return { theoretical, actual, hourly }
}

/**
 * 生成短唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase()
}

/**
 * 从云存储fileID提取可访问URL
 */
export function getFileUrl(fileId) {
  if (!fileId) return ''
  if (fileId.startsWith('http')) return fileId
  return `https://${import.meta.env.VITE_CLOUD_ENV_ID}.tcb.qcloud.la/${fileId}`
}

/**
 * 防抖
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
