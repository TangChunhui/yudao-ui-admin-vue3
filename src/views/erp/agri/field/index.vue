<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="农田名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入农田名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="种植作物" prop="crop">
        <el-input
          v-model="queryParams.crop"
          placeholder="请输入当前种植作物"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="所属用户ID" align="center" prop="memberId" width="100" />
      <el-table-column label="农田名称" align="center" prop="name" />
      <el-table-column label="面积(亩)" align="center" prop="area" width="90" />
      <el-table-column label="位置" align="center" prop="location" />
      <el-table-column label="当前作物" align="center" prop="crop" />
      <el-table-column label="土壤类型" align="center" prop="soilType" />
      <el-table-column label="播种日期" align="center" prop="sowDate" width="120" />
      <el-table-column label="生长阶段" align="center" prop="growthStage" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 编辑弹窗 -->
  <Dialog title="编辑农田信息" v-model="dialogVisible" width="520px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" v-loading="formLoading">
      <el-form-item label="农田名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入农田名称" />
      </el-form-item>
      <el-form-item label="面积(亩)" prop="area">
        <el-input-number v-model="formData.area" :min="0" :precision="2" :step="1" class="!w-full" />
      </el-form-item>
      <el-form-item label="位置" prop="location">
        <el-input v-model="formData.location" placeholder="请输入农田位置" />
      </el-form-item>
      <el-form-item label="当前作物" prop="crop">
        <el-input v-model="formData.crop" placeholder="请输入当前种植作物" />
      </el-form-item>
      <el-form-item label="土壤类型" prop="soilType">
        <el-input v-model="formData.soilType" placeholder="请输入土壤类型" />
      </el-form-item>
      <el-form-item label="播种日期" prop="sowDate">
        <el-date-picker
          v-model="formData.sowDate"
          type="date"
          placeholder="请选择播种日期"
          value-format="YYYY-MM-DD"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="生长阶段" prop="growthStage">
        <el-input v-model="formData.growthStage" placeholder="例：苗期/拔节期/成熟期" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="备注信息" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AgriFieldApi, AgriFieldVO } from '@/api/erp/agri/field'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'AgriField' })

const loading = ref(true)
const total = ref(0)
const list = ref<AgriFieldVO[]>([])
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  crop: undefined
})
const queryFormRef = ref()

// 弹窗
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = ref<Partial<AgriFieldVO>>({})
const formRules = {
  name: [{ required: true, message: '请输入农田名称', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const data = await AgriFieldApi.getFieldPage(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const handleUpdate = (row: AgriFieldVO) => {
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    await AgriFieldApi.updateField(formData.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该农田信息吗？', '提示', { type: 'warning' })
    await AgriFieldApi.deleteField(id)
    ElMessage.success('删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
