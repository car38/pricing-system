import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 应用状态管理
 * 管理侧边栏、面包屑、全局 loading 等
 */
export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const globalLoading = ref(false)
  const currentSettings = ref(null)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setGlobalLoading(val) {
    globalLoading.value = val
  }

  function setCurrentSettings(settings) {
    currentSettings.value = settings
  }

  return {
    sidebarCollapsed,
    globalLoading,
    currentSettings,
    toggleSidebar,
    setGlobalLoading,
    setCurrentSettings,
  }
})
