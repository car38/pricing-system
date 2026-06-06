import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录', noAuth: true } },
  {
    path: '/', component: () => import('@/layouts/MainLayout.vue'), redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据看板', icon: 'Odometer', roles: ['super_admin','supervisor','valuer','viewer'] } },
      { path: 'valuation/list', name: 'ValuationList', component: () => import('@/views/ValuationList.vue'), meta: { title: '核价单列表', icon: 'Document', roles: ['super_admin','supervisor','valuer','viewer'] } },
      { path: 'valuation/create', name: 'ValuationCreate', component: () => import('@/views/ValuationForm.vue'), meta: { title: '新建核价单', hidden: true, roles: ['super_admin','supervisor','valuer'] } },
      { path: 'valuation/edit/:id', name: 'ValuationEdit', component: () => import('@/views/ValuationForm.vue'), meta: { title: '编辑核价单', hidden: true, roles: ['super_admin','supervisor','valuer'] } },
      { path: 'valuation/detail/:id', name: 'ValuationDetail', component: () => import('@/views/ValuationForm.vue'), meta: { title: '核价单详情', hidden: true, roles: ['super_admin','supervisor','valuer','viewer'] } },
      { path: 'approval/pending', name: 'ApprovalPending', component: () => import('@/views/ApprovalPending.vue'), meta: { title: '待办审批', icon: 'Clock', roles: ['super_admin','supervisor'] } },
      { path: 'audit/logs', name: 'AuditLog', component: () => import('@/views/AuditLog.vue'), meta: { title: '更新日志', icon: 'List', roles: ['super_admin','supervisor','valuer','viewer'] } },
      { path: 'user/manage', name: 'UserManage', component: () => import('@/views/UserManage.vue'), meta: { title: '用户管理', icon: 'User', roles: ['super_admin'] } },
      { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { title: '系统设置', icon: 'Setting', roles: ['super_admin'] } },
    ],
  },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - 锦汇高分子科技`
  const token = localStorage.getItem('token')
  if (to.meta.noAuth) next()
  else if (!token) next('/login')
  else next()
})
export default router
