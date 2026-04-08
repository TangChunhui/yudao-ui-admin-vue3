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
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="所属用户ID" align="center" prop="memberId" />
      <el-table-column label="农田名称" align="center" prop="name" />
      <el-table-column label="面积(亩)" align="center" prop="area" />
      <el-table-column label="位置" align="center" prop="location" />
      <el-table-column label="当前作物" align="center" prop="crop" />
      <el-table-column label="操作" align="center">
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AgriFieldApi, AgriFieldVO } from '@/api/erp/agri/field'
import { ElMessage, ElMessageBox } from 'element-plus'

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
  ElMessage.info('编辑功能弹窗暂省略，请参考后端接口直接挂载弹窗组件即可')
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该农田信息吗？')
    await AgriFieldApi.deleteField(id)
    ElMessage.success('删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
