<template>
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true">
      <el-form-item label="农田ID" prop="fieldId">
        <el-input v-model="queryParams.fieldId" placeholder="请输入农田ID" clearable class="!w-240px" />
      </el-form-item>
      <el-form-item label="操作类型" prop="type">
        <el-input v-model="queryParams.type" placeholder="请输入类型(例如:施肥/打药)" clearable class="!w-240px" />
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
      <el-table-column label="所属农田ID" align="center" prop="fieldId" />
      <el-table-column label="用户ID" align="center" prop="memberId" />
      <el-table-column label="农事类型" align="center" prop="type" />
      <el-table-column label="产品" align="center" prop="product" />
      <el-table-column label="用量" align="center" prop="dosage" />
      <el-table-column label="作业日期" align="center" prop="operateDate" />
      <el-table-column label="备注" align="center" prop="remark" />
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
import { AgriFieldApi, AgriFieldRecordVO } from '@/api/erp/agri/field'

defineOptions({ name: 'AgriFieldRecord' })

const loading = ref(true)
const total = ref(0)
const list = ref<AgriFieldRecordVO[]>([])
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  fieldId: undefined,
  type: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await AgriFieldApi.getFieldRecordPage(queryParams.value)
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

onMounted(() => {
  getList()
})
</script>
