<template>
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true">
      <el-form-item label="服务类型" prop="serviceType">
        <el-select v-model="queryParams.serviceType" placeholder="请选择服务" clearable class="!w-240px">
          <el-option label="飞防打药" value="drone_spray" />
          <el-option label="飞防撒肥" value="drone_sow" />
          <el-option label="粮食烘干" value="drying" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option label="待处理" :value="0" />
          <el-option label="派单中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="联系人" prop="contactName">
        <el-input v-model="queryParams.contactName" placeholder="联系人姓名" clearable class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="订单编号" align="center" prop="id" />
      <el-table-column label="用户ID" align="center" prop="memberId" />
      <el-table-column label="服务类型" align="center" prop="serviceType">
        <template #default="scope">
          <el-tag v-if="scope.row.serviceType === 'drone_spray'">飞防打药</el-tag>
          <el-tag type="warning" v-else-if="scope.row.serviceType === 'drone_sow'">飞防撒肥</el-tag>
          <el-tag type="success" v-else-if="scope.row.serviceType === 'drying'">粮食烘干</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="服务状态" align="center" prop="status">
        <template #default="scope">
          <el-tag type="danger" v-if="scope.row.status === 0">待处理</el-tag>
          <el-tag type="primary" v-else-if="scope.row.status === 1">已派单</el-tag>
          <el-tag type="success" v-else-if="scope.row.status === 2">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="需求面积/量" align="center" prop="serviceArea" width="110" />
      <el-table-column label="服务地址" align="center" prop="address" min-width="130" show-overflow-tooltip />
      <el-table-column label="期望日期" align="center" prop="expectDate" width="115">
        <template #default="scope">{{ formatDate(scope.row.expectDate, 'YYYY-MM-DD') }}</template>
      </el-table-column>
      <el-table-column label="联系人" align="center" prop="contactName" width="90" />
      <el-table-column label="联系电话" align="center" prop="contactMobile" width="120" />
      <el-table-column label="提交时间" align="center" prop="createTime" width="160">
        <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm(scope.row)">派单处理</el-button>
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

  <!-- 表单弹窗 -->
  <ServiceOrderForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AgriServiceOrderApi, AgriServiceOrderVO } from '@/api/erp/agri/serviceOrder'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/formatTime'
import ServiceOrderForm from './ServiceOrderForm.vue'

defineOptions({ name: 'AgriServiceOrder' })

const loading = ref(true)
const total = ref(0)
const list = ref<AgriServiceOrderVO[]>([])
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  serviceType: undefined,
  status: undefined,
  contactName: undefined
})
const queryFormRef = ref()
const formRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await AgriServiceOrderApi.getServiceOrderPage(queryParams.value)
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

const openForm = (row: AgriServiceOrderVO) => {
  formRef.value.open(row)
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该服务订单？')
    await AgriServiceOrderApi.deleteServiceOrder(id)
    ElMessage.success('删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
