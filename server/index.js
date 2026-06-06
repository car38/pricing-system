import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getDb, saveDb, genId, genValuationNo, initDb, seedData } from './database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = 'pricing-system-jwt-2026'

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.static(join(__dirname, '..', 'dist')))

function auth(req, res, next) {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET)
    next()
  } catch { res.json({ code: 401, message: 'no auth', data: null }) }
}

function ok(d = null, m = 'ok') { return { code: 0, message: m, data: d } }
function fail(m = 'fail', c = -1) { return { code: c, message: m, data: null } }

// USER
app.post('/api/user', async (req, res) => {
  const { action, data } = req.body || {}
  const db = getDb()
  switch (action) {
    case 'login': {
      const { username, password } = data || {}
      if (!username || !password) return res.json(fail('missing username/password'))
      const user = db.users.find(u => u.username === username)
      if (!user) return res.json(fail('wrong username or password'))
      if (user.status === 'inactive') return res.json(fail('account disabled'))
      if (!bcrypt.compareSync(password, user.password)) return res.json(fail('wrong username or password'))
      user.lastLoginAt = new Date().toISOString(); saveDb()
      const token = jwt.sign({ userId: user._id, _openid: user._openid, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
      const { password: _, ...userInfo } = user
      return res.json(ok({ token, userInfo, permissions: getPermissions(user.role) }))
    }
    case 'getUserInfo': {
      try {
        const decoded = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET)
        const user = db.users.find(u => u._id === decoded.userId)
        if (!user) return res.json(fail('no user'))
        const { password: _, ...info } = user
        return res.json(ok(info))
      } catch { return res.json(fail('no auth')) }
    }
    case 'getUsers': return res.json(ok({ list: db.users.map(({ password, ...u }) => u) }))
    case 'createUser': {
      const { username, password, realName, role, departmentName, email } = data || {}
      if (!username || !password) return res.json(fail('missing fields'))
      if (db.users.find(u => u.username === username)) return res.json(fail('username exists'))
      const id = genId()
      db.users.push({ _id: id, _openid: `open_${username}`, username, password: bcrypt.hashSync(password, 10), realName: realName || username, role: role || 'valuer', departmentName: departmentName || '', email: email || '', status: 'active', createdAt: new Date().toISOString() })
      saveDb(); return res.json(ok({ _id: id }))
    }
    case 'updateUser': {
      const { id, ...fields } = data || {}
      const user = db.users.find(u => u._id === id)
      if (!user) return res.json(fail('no user'))
      Object.assign(user, fields, { updatedAt: new Date().toISOString() })
      delete user.password; saveDb(); return res.json(ok(null, 'updated'))
    }
    case 'deleteUser': { const idx = db.users.findIndex(u => u._id === data?.id); if (idx >= 0) db.users.splice(idx, 1); saveDb(); return res.json(ok(null, 'deleted')) }
    case 'resetPassword': { const user = db.users.find(u => u._id === data?.id); if (user) user.password = bcrypt.hashSync('123456', 10); saveDb(); return res.json(ok(null, 'reset')) }
    default: return res.json(fail('unknown action'))
  }
})

// VALUATION
app.post('/api/valuation', auth, (req, res) => {
  const { action, data } = req.body || {}
  const db = getDb()
  const user = req.user
  let vals = [...db.valuations]
  if (user.role === 'valuer') vals = vals.filter(v => v._openid === user._openid)

  switch (action) {
    case 'list': {
      const { page = 1, pageSize = 10, materialId, customer, status, startDate, endDate } = data || {}
      let f = [...vals]
      if (materialId) f = f.filter(v => (v.materialId || '').toLowerCase().includes(materialId.toLowerCase()))
      if (customer) f = f.filter(v => (v.customer || '').toLowerCase().includes(customer.toLowerCase()))
      if (status) f = f.filter(v => v.status === status)
      if (startDate && endDate) { const s = new Date(startDate).getTime(), e = new Date(endDate + 'T23:59:59').getTime(); f = f.filter(v => { const t = new Date(v.createdAt).getTime(); return t >= s && t <= e }) }
      f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const total = f.length, skip = (page - 1) * pageSize
      return res.json(ok({ list: f.slice(skip, skip + pageSize), total, page, pageSize }))
    }
    case 'get': {
      const val = db.valuations.find(v => v._id === data?.id)
      if (!val) return res.json(fail('not found'))
      val.approvalRecords = db.approval_records.filter(r => r.valuationId === val._id).sort((a, b) => new Date(a.operateTime) - new Date(b.operateTime))
      return res.json(ok(val))
    }
    case 'create': {
      const { customer, materialId } = data || {}
      if (!customer || !materialId) return res.json(fail('missing fields'))
      const id = genId(), now = new Date().toISOString(), vn = genValuationNo()
      db.valuations.push({ _id: id, _openid: user._openid, valuationNo: vn, status: 'draft', version: 1, createdAt: now, updatedAt: now, ...data, submitterName: user.username, submitterId: user.userId })
      saveDb(); return res.json(ok({ _id: id, valuationNo: vn }))
    }
    case 'update': {
      const { id, ...fields } = data || {}
      const idx = db.valuations.findIndex(v => v._id === id)
      if (idx < 0) return res.json(fail('not found'))
      const doc = db.valuations[idx]
      if (doc.status !== 'draft' && doc.status !== 'rejected') return res.json(fail('cannot edit'))
      const newVer = (doc.version || 1) + 1
      db.valuations[idx] = { ...doc, ...fields, version: newVer, updatedAt: new Date().toISOString() }
      db.valuation_history.push({ _id: genId(), valuationId: id, version: newVer, snapshot: JSON.stringify(db.valuations[idx]), changedBy: user.username, changedAt: new Date().toISOString(), changeReason: fields.changeReason || 'edited' })
      saveDb(); return res.json(ok(null, 'updated'))
    }
    case 'submit': {
      const doc = db.valuations.find(v => v._id === data?.id)
      if (doc) { doc.status = 'pending'; doc.submitTime = new Date().toISOString(); doc.submitterName = user.username }
      if (doc) db.approval_records.push({ _id: genId(), valuationId: data.id, action: 'submit', comment: 'submitted', operatorId: user.userId, operatorName: user.username, operateTime: new Date().toISOString() })
      saveDb(); return res.json(ok(null, 'submitted'))
    }
    case 'delete': { const idx = db.valuations.findIndex(v => v._id === data?.id); if (idx >= 0) db.valuations.splice(idx, 1); saveDb(); return res.json(ok(null, 'deleted')) }
    case 'copy': {
      const src = db.valuations.find(v => v._id === data?.id)
      if (!src) return res.json(fail('not found'))
      const { _id, valuationNo, status, submitTime, submitterName, submitterId, createdAt, updatedAt, version, approvalRecords, ...rest } = src
      const id = genId(), now = new Date().toISOString()
      db.valuations.push({ _id: id, ...rest, valuationNo: genValuationNo(), _openid: user._openid, submitterName: user.username, status: 'draft', version: 1, createdAt: now, updatedAt: now })
      saveDb(); return res.json(ok({ _id: id }, 'copied'))
    }
    case 'getHistory': {
      const list = db.valuation_history.filter(h => h.valuationId === data?.valuationId).sort((a, b) => b.version - a.version)
      return res.json(ok(list))
    }
    default: return res.json(fail('unknown action'))
  }
})

// APPROVAL
app.post('/api/approval', auth, (req, res) => {
  const { action, data } = req.body || {}
  const db = getDb(), user = req.user
  if (!['super_admin', 'supervisor'].includes(user.role)) return res.json(fail('no permission'))
  switch (action) {
    case 'pendingList': {
      const { page = 1, pageSize = 10 } = data || {}
      let pending = db.valuations.filter(v => v.status === 'pending')
      if (user.role === 'supervisor') {
        const u = db.users.find(x => x._id === user.userId)
        if (u?.departmentName) {
          const deptOpenids = db.users.filter(x => x.departmentName === u.departmentName).map(x => x._openid)
          pending = pending.filter(v => deptOpenids.includes(v._openid))
        }
      }
      pending.sort((a, b) => new Date(b.submitTime || 0) - new Date(a.submitTime || 0))
      const total = pending.length, skip = (page - 1) * pageSize
      return res.json(ok({ list: pending.slice(skip, skip + pageSize), total, page, pageSize }))
    }
    case 'approve': {
      const doc = db.valuations.find(v => v._id === data?.id)
      if (!doc) return res.json(fail('not found'))
      if (doc.status !== 'pending') return res.json(fail('not pending'))
      doc.status = 'approved'; doc.approverId = user.userId; doc.approverName = user.username; doc.approveTime = new Date().toISOString(); doc.approveComment = data?.comment || ''
      db.approval_records.push({ _id: genId(), valuationId: data.id, action: 'approve', comment: data?.comment || '', operatorId: user.userId, operatorName: user.username, operateTime: new Date().toISOString() })
      saveDb(); return res.json(ok(null, 'approved'))
    }
    case 'reject': {
      if (!data?.comment) return res.json(fail('reason required'))
      const doc = db.valuations.find(v => v._id === data.id)
      if (!doc) return res.json(fail('not found'))
      if (doc.status !== 'pending') return res.json(fail('not pending'))
      doc.status = 'rejected'; doc.approverId = user.userId; doc.approverName = user.username; doc.approveTime = new Date().toISOString(); doc.rejectReason = data.comment
      db.approval_records.push({ _id: genId(), valuationId: data.id, action: 'reject', comment: data.comment, operatorId: user.userId, operatorName: user.username, operateTime: new Date().toISOString() })
      saveDb(); return res.json(ok(null, 'rejected'))
    }
    case 'batchApprove': {
      for (const id of (data?.ids || [])) {
        const doc = db.valuations.find(v => v._id === id)
        if (doc && doc.status === 'pending') {
          doc.status = 'approved'; doc.approverId = user.userId; doc.approverName = user.username; doc.approveTime = new Date().toISOString()
          db.approval_records.push({ _id: genId(), valuationId: id, action: 'approve', comment: data?.comment || '', operatorId: user.userId, operatorName: user.username, operateTime: new Date().toISOString() })
        }
      }
      saveDb(); return res.json(ok(null, `batch approved ${(data?.ids || []).length}`))
    }
    default: return res.json(fail('unknown action'))
  }
})

// DASHBOARD
app.post('/api/dashboard', auth, (req, res) => {
  const db = getDb(), now = new Date(), vals = db.valuations
  const ms = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const mv = vals.filter(v => v.createdAt >= ms)
  const lms = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lmc = vals.filter(v => v.createdAt >= lms && v.createdAt < ms).length
  const mc = lmc > 0 ? Math.round(((mv.length - lmc) / lmc) * 100) : mv.length > 0 ? 100 : 0
  const pc = vals.filter(v => v.status === 'pending').length
  const ac = mv.length > 0 ? Math.round(mv.reduce((s, v) => s + (v.totalCost || 0), 0) / mv.length * 10000) / 10000 : 0
  const cm = {}; vals.forEach(v => { const k = v.customer || '?'; cm[k] = (cm[k] || 0) + 1 })
  const ct = Object.entries(cm).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 10)
  const vm = {}; vals.forEach(v => { const k = v.submitterName || '?'; vm[k] = (vm[k] || 0) + 1 })
  const vr = Object.entries(vm).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value)
  const trend = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1), e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const mc2 = vals.filter(v => { const t = new Date(v.createdAt).getTime(); return t >= d.getTime() && t <= e.getTime() && (v.totalCost || 0) > 0 }).map(v => v.totalCost)
    trend.push({ month: `${d.getMonth() + 1}月`, avgCost: mc2.length > 0 ? Math.round((mc2.reduce((a, b) => a + b, 0) / mc2.length) * 10000) / 10000 : 0, maxCost: mc2.length > 0 ? Math.max(...mc2) : 0, minCost: mc2.length > 0 ? Math.min(...mc2) : 0, count: mc2.length })
  }
  const sums = { mc: 0, lc: 0, mfc: 0, pkg: 0, tr: 0, mf: 0 }
  const cnt = vals.length
  vals.forEach(v => { sums.mc += v.materialCost || 0; sums.lc += v.laborCost || 0; sums.mfc += v.manufacturingCost || 0; sums.pkg += v.packaging || 0; sums.tr += v.transport || 0; sums.mf += v.managementFee || 0 })
  const ct2 = Object.values(sums).reduce((a, b) => a + b, 0) || 1
  const bd = [
    { name: '原材料成本', value: cnt > 0 ? Math.round((sums.mc / cnt) * 10000) / 10000 : 0, percent: Math.round((sums.mc / ct2) * 1000) / 10 },
    { name: '人工工序成本', value: cnt > 0 ? Math.round((sums.lc / cnt) * 10000) / 10000 : 0, percent: Math.round((sums.lc / ct2) * 1000) / 10 },
    { name: '制造分摊', value: cnt > 0 ? Math.round((sums.mfc / cnt) * 10000) / 10000 : 0, percent: Math.round((sums.mfc / ct2) * 1000) / 10 },
    { name: '包装', value: cnt > 0 ? Math.round((sums.pkg / cnt) * 10000) / 10000 : 0, percent: Math.round((sums.pkg / ct2) * 1000) / 10 },
    { name: '运输', value: cnt > 0 ? Math.round((sums.tr / cnt) * 10000) / 10000 : 0, percent: Math.round((sums.tr / ct2) * 1000) / 10 },
    { name: '管理费', value: cnt > 0 ? Math.round((sums.mf / cnt) * 10000) / 10000 : 0, percent: Math.round((sums.mf / ct2) * 1000) / 10 },
  ]
  const mt = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1), e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    mt.push({ month: `${d.getMonth() + 1}月`, count: vals.filter(v => { const t = new Date(v.createdAt).getTime(); return t >= d.getTime() && t <= e.getTime() }).length })
  }
  const th = db.settings?.materialCostWarningThreshold || 70
  const pt = db.settings?.lowProfitWarning || -20
  const mw = vals.filter(v => v.totalCost > 0 && ((v.materialCost || 0) / v.totalCost) * 100 > th && v.status !== 'draft').map(v => ({ _id: v._id, customer: v.customer, materialId: v.materialId, valuationNo: v.valuationNo, ratio: Math.round(((v.materialCost || 0) / (v.totalCost || 1)) * 1000) / 10 })).slice(0, 20)
  const glueMap = {}
  vals.forEach(v => { if(v.materialId && v.gluePrice > 0) { if(!glueMap[v.materialId]) glueMap[v.materialId] = []; glueMap[v.materialId].push({ price: v.gluePrice, customer: v.customer, id: v._id, createdAt: v.createdAt }) } })
  const gw = []
  Object.entries(glueMap).forEach(([mid, prices]) => {
    prices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (prices.length >= 2) {
      const increase = ((prices[0].price - prices[1].price) / prices[1].price) * 100
      if (increase > 5) gw.push({ materialId: mid, latestPrice: prices[0].price, previousPrice: prices[1].price, increase: Math.round(increase * 10) / 10, customer: prices[0].customer, valuationId: prices[0].id })
    }
  })

  const lw = vals.filter(v => v.grossProfitRate !== null && v.grossProfitRate < pt && v.grossProfitRate < 0).map(v => ({ _id: v._id, customer: v.customer, materialId: v.materialId, valuationNo: v.valuationNo, grossProfitRate: v.grossProfitRate })).slice(0, 20)
  return res.json(ok({ kpi: { totalCount: vals.length, monthCount: mv.length, momChange: mc, pendingCount: pc, avgCost: ac }, customerTop: ct, valuerRanking: vr, costTrend: trend, costStructure: { breakdown: bd, total: Math.round(ct2 / (cnt || 1) * 10000) / 10000 }, monthlyTrend: mt, warnings: { materialWarnings: mw, glueWarnings: gw, lowProfitWarnings: lw, threshold: th, profitThreshold: pt } }))
})



app.post('/api/material/list', auth, (req, res) => {
  const db = getDb()
  const ids = [...new Set(db.valuations.map(v => v.materialId).filter(Boolean))]
  ids.sort()
  res.json(ok(ids))
})



app.post('/api/audit/logs', auth, (req, res) => {
  const db = getDb()
  const records = [
    ...db.approval_records.map(r => ({ ...r, type: 'approval' })),
    ...db.valuation_history.map(h => ({ _id: h._id, valuationId: h.valuationId, action: 'edit', comment: h.changeReason, operatorName: h.changedBy, operateTime: h.changedAt, type: 'edit', version: h.version })),
  ]
  records.sort((a, b) => new Date(b.operateTime) - new Date(a.operateTime))
  const { page = 1, pageSize = 20 } = req.body?.data || {}
  const total = records.length
  const skip = (page - 1) * pageSize
  res.json(ok({ list: records.slice(skip, skip + pageSize), total, page, pageSize }))
})

// MATERIAL TREND
app.post('/api/material/trend', auth, (req, res) => {
  const { materialId } = req.body?.data || {}
  if (!materialId) return res.json(fail('no materialId'))
  const db = getDb()
  const records = db.valuations.filter(v => v.materialId === materialId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(v => ({ _id: v._id, valuationNo: v.valuationNo, customer: v.customer, totalCost: v.totalCost, standardPrice: v.standardPrice, grossProfitRate: v.grossProfitRate, createdAt: v.createdAt, materialCost: v.materialCost, gluePrice: v.gluePrice, glueConsumption: v.glueConsumption }))
  res.json(ok(records))
})

// SETTINGS
app.post('/api/settings', auth, (req, res) => {
  const { action, data } = req.body || {}
  const db = getDb()
  switch (action) {
    case 'get': return res.json(ok(db.settings || {}))
    case 'update': Object.assign(db.settings, data, { updatedAt: new Date().toISOString() }); saveDb(); return res.json(ok(null, 'saved'))
    default: return res.json(fail('unknown'))
  }
})

initDb()
seedData()

app.get('*', (req, res) => { res.sendFile(join(__dirname, '..', 'dist', 'index.html')) })

app.listen(PORT, '0.0.0.0', () => { console.log(`\nOK http://localhost:${PORT}\n`) })

function getPermissions(role) {
  const all = ['valuation:view', 'valuation:create', 'valuation:edit', 'valuation:delete', 'valuation:submit', 'approval:view', 'report:view']
  if (role === 'super_admin') return [...all, 'approval:approve', 'user:manage', 'settings:manage', 'valuation:all']
  if (role === 'supervisor') return [...all, 'approval:approve']
  if (role === 'valuer') return all
  return ['valuation:view', 'report:view']
}
