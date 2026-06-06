<template>
  <div class="app-layout">
    <div class="app-sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="sidebar-logo">
        <div class="logo-icon">锦</div>
        <span v-show="!appStore.sidebarCollapsed">锦汇高分子科技</span>
      </div>
      <el-scrollbar style="flex:1">
        <el-menu :default-active="route.path" :collapse="appStore.sidebarCollapsed" :collapse-transition="false" background-color="#1d1e1f" text-color="#bfcbd9" active-text-color="#409eff" router>
          <el-menu-item index="/dashboard"><el-icon><Odometer /></el-icon><template #title>数据看板</template></el-menu-item>
          <el-menu-item index="/valuation/list"><el-icon><Document /></el-icon><template #title>核价单列表</template></el-menu-item>
          <el-menu-item v-if="userStore.isSupervisor" index="/approval/pending"><el-icon><Clock /></el-icon><template #title>待办审批</template></el-menu-item>
          <el-menu-item index="/audit/logs"><el-icon><List /></el-icon><template #title>更新日志</template></el-menu-item>
          <el-menu-item v-if="userStore.isSuperAdmin" index="/user/manage"><el-icon><User /></el-icon><template #title>用户管理</template></el-menu-item>
          <el-menu-item v-if="userStore.isSuperAdmin" index="/settings"><el-icon><Setting /></el-icon><template #title>系统设置</template></el-menu-item>
        </el-menu>
      </el-scrollbar>
    </div>
    <div class="app-main">
      <header class="app-header">
        <div class="header-left">
          <el-button text @click="appStore.toggleSidebar"><el-icon :size="20"><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else /></el-icon></el-button>
          <el-breadcrumb><el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item><el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item></el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-avatar :size="28" icon="UserFilled" />
            <span class="username">{{ userStore.realName }}</span>
            <el-tag size="small" type="info" effect="plain">{{ userStore.roleLabel }}</el-tag>
            <el-button text size="small" @click="handleLogout">退出</el-button>
          </span>
        </div>
      </header>
      <main class="app-content"><router-view /></main>
    </div>
  </div>
</template>
<script setup>
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
function handleLogout() { userStore.logout() }
</script>
<style scoped>
.app-layout { display:flex; height:100vh; overflow:hidden; }
.sidebar-logo { height:60px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:600; color:#fff; border-bottom:1px solid rgba(255,255,255,0.08); gap:10px; }
.sidebar-logo .logo-icon { width:32px; height:32px; background:#409eff; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:bold; flex-shrink:0; }
.app-sidebar { width:220px; background:#1d1e1f; color:#fff; display:flex; flex-direction:column; flex-shrink:0; transition:width .3s; z-index:100; }
.app-sidebar.collapsed { width:64px; }
.app-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.app-header { height:60px; background:#fff; border-bottom:1px solid #dcdfe6; display:flex; align-items:center; padding:0 20px; justify-content:space-between; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
.header-left, .header-right { display:flex; align-items:center; gap:12px; }
.user-info { display:flex; align-items:center; gap:8px; }
.username { font-size:14px; color:#303133; }
.app-content { flex:1; padding:20px; overflow-y:auto; background:#f5f7fa; }
</style>
