<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">锦</div>
        <h2>锦汇高分子科技</h2>
        <p>核价管理系统</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width:100%" size="large" @click="handleLogin">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>只读用户: viewer1 / 密码: viewer123</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }
async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid || loading.value) return
  loading.value = true
  try { await userStore.login(form); ElMessage.success('登录成功'); router.push('/dashboard') } catch {}
  finally { loading.value = false }
}
</script>
<style scoped>
.login-container { display:flex; height:100vh; align-items:center; justify-content:center; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); }
.login-card { width:420px; padding:40px; background:#fff; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.1); }
.login-header { text-align:center; margin-bottom:32px; }
.login-logo { width:56px; height:56px; margin:0 auto 16px; background:#409eff; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:bold; color:#fff; }
.login-header h2 { font-size:22px; color:#303133; margin-bottom:4px; }
.login-header p { font-size:13px; color:#909399; }
.login-footer { text-align:center; margin-top:16px; color:#909399; font-size:12px; }
</style>
