/**
 * JSON 文件数据库
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'data.json')

let db = null

const DEFAULTS = {
  users: [], valuations: [], valuation_history: [], approval_records: [],
  settings: { _id: 'system_settings', minProfitRate: 5, standardProfitRate: 15, highProfitRate: 30, managementRate: 10, materialCostWarningThreshold: 70, gluePriceWarningThreshold: 5, lowProfitWarning: -10, smtpHost: '', smtpPort: 465, smtpSecure: true, smtpUser: '', smtpPass: '', updatedAt: null },
}

export function getDb() {
  if (db) return db
  try {
    if (existsSync(DB_PATH)) {
      db = JSON.parse(readFileSync(DB_PATH, 'utf8'))
      for (const k of Object.keys(DEFAULTS)) { if (db[k] === undefined) db[k] = k === 'settings' ? { ...DEFAULTS.settings } : [] }
    } else {
      db = JSON.parse(JSON.stringify(DEFAULTS))
    }
  } catch { db = JSON.parse(JSON.stringify(DEFAULTS)) }
  return db
}

export function saveDb() { writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8') }

export function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8).toUpperCase() }

let vc = 1000
export function genValuationNo() { vc++; return `PV-${String(vc).padStart(4, '0')}` }

export function initDb() {}

export function seedData() {
  const d = getDb()
  if (d.users.length > 0) return
  const now = new Date().toISOString()

  const uid1 = genId(), uid2 = genId(), uid3 = genId(), uid4 = genId()
  d.users.push(
    { _id: uid1, _openid: 'open_admin', username: 'admin', password: bcrypt.hashSync('admin123', 10), realName: '\u8d85\u7ea7\u7ba1\u7406\u5458', role: 'super_admin', departmentName: '\u7ba1\u7406\u90e8', email: 'admin@company.com', status: 'active', createdAt: now },
    { _id: uid2, _openid: 'open_valuer1', username: 'valuer1', password: bcrypt.hashSync('valuer123', 10), realName: '\u5f20\u6838\u7b97', role: 'valuer', departmentName: '\u6838\u4ef7\u90e8', email: 'valuer1@company.com', status: 'active', createdAt: now },
    { _id: uid3, _openid: 'open_supervisor1', username: 'supervisor1', password: bcrypt.hashSync('sup123', 10), realName: '\u674e\u4e3b\u7ba1', role: 'supervisor', departmentName: '\u6838\u4ef7\u90e8', email: 'supervisor1@company.com', status: 'active', createdAt: now },
    { _id: uid4, _openid: 'open_viewer1', username: 'viewer1', password: bcrypt.hashSync('viewer123', 10), realName: '\u738b\u67e5\u770b', role: 'viewer', departmentName: '\u6838\u4ef7\u90e8', email: 'viewer1@company.com', status: 'active', createdAt: now },
  )
  d.settings.updatedAt = now
  saveDb()
  console.log('seed data: 4 users created')
}
