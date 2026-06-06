<template>
  <div>
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>添加用户
      </el-button>
    </div>

    <div class="data-table">
      <el-table :data="tableData" v-loading="loading" stripe style="width:100%">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="username" label="用户名" width="130" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="roleType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="departmentName" label="部门" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button text size="small" @click="handleResetPassword(row._id)">重置密码</el-button>
            <el-button v-if="row.status === 'active'" text type="warning" size="small"
              @click="handleToggleStatus(row._id, 'inactive')">禁用</el-button>
            <el-button v-else text type="success" size="small"
              @click="handleToggleStatus(row._id, 'active')">启用</el-button>
            <el-popconfirm title="确认删除该用户？" @confirm="handleDelete(row._id)">
              <template #reference><el-button text type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑用户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '添加用户'" width="520px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="主管" value="supervisor" />
            <el-option label="核价员" value="valuer" />
            <el-option label="只读用户" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.departmentName" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '@/api/user'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = computed(() => !!editId.value)
const editId = ref('')
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  username: '', password: '', realName: '', role: 'valuer', departmentName: '', email: '',
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function roleLabel(role) {
  const map = { super_admin: '超级管理员', supervisor: '主管', valuer: '核价员', viewer: '只读用户' }
  return map[role] || role
}

function roleType(role) {
  const map = { super_admin: 'danger', supervisor: 'warning', valuer: 'primary', viewer: 'info' }
  return map[role] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getUsers()
    tableData.value = res?.list || []
  } finally { loading.value = false }
}

function showAddDialog() {
  editId.value = ''
  Object.assign(form, { username: '', password: '', realName: '', role: 'valuer', departmentName: '', email: '' })
  dialogVisible.value = true
}

function showEditDialog(row) {
  editId.value = row._id
  Object.assign(form, {
    username: row.username, realName: row.realName, role: row.role,
    departmentName: row.departmentName || '', email: row.email || '',
  })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid || submitting.value) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateUser({ id: editId.value, ...form })
      ElMessage.success('用户更新成功')
    } else {
      await createUser(form)
      ElMessage.success('用户创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch { /* handled */ }
  finally { submitting.value = false }
}

async function handleResetPassword(id) {
  try {
    await resetUserPassword({ id })
    ElMessage.success('密码已重置为 123456')
  } catch { /* handled */ }
}

async function handleToggleStatus(id, status) {
  try {
    await updateUser({ id, status })
    ElMessage.success(status === 'active' ? '已启用' : '已禁用')
    loadData()
  } catch { /* handled */ }
}

async function handleDelete(id) {
  try {
    await deleteUser({ id })
    ElMessage.success('用户已删除')
    loadData()
  } catch { /* handled */ }
}

onMounted(loadData)
</script>
