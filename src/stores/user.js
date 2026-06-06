import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { login as loginApi, getUserInfo } from '@/api/user'

/**
 * 用户状态管理
 * 管理登录态、用户信息、角色权限
 */
export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const permissions = ref(JSON.parse(localStorage.getItem('permissions') || '[]'))

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => userInfo.value?.role === 'super_admin')
  const isSupervisor = computed(() => userInfo.value?.role === 'supervisor' || userInfo.value?.role === 'super_admin')
  const isValuer = computed(() => ['super_admin', 'supervisor', 'valuer'].includes(userInfo.value?.role))
  const realName = computed(() => userInfo.value?.realName || userInfo.value?.username || '')
  const roleLabel = computed(() => {
    const map = { super_admin: '超级管理员', supervisor: '主管', valuer: '核价员', viewer: '只读用户' }
    return map[userInfo.value?.role] || '未知角色'
  })

  async function login(credentials) {
    const res = await loginApi(credentials)
    token.value = res.token
    userInfo.value = res.userInfo
    permissions.value = res.permissions || []
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.userInfo))
    localStorage.setItem('permissions', JSON.stringify(res.permissions || []))
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      userInfo.value = res
      localStorage.setItem('userInfo', JSON.stringify(res))
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('permissions')
    router.push('/login')
  }

  function checkLogin() {
    if (token.value && !userInfo.value) {
      fetchUserInfo()
    }
  }

  function hasPermission(perm) {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(perm)
  }

  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  return {
    token,
    userInfo,
    permissions,
    isLoggedIn,
    isSuperAdmin,
    isSupervisor,
    isValuer,
    realName,
    roleLabel,
    login,
    fetchUserInfo,
    logout,
    checkLogin,
    hasPermission,
    setUserInfo,
  }
})
