<template>
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true">
      <el-form-item label="所属农田" prop="fieldId">
        <el-select
          v-model="queryParams.fieldId"
          placeholder="请选择农田"
          clearable
          filterable
          class="!w-240px"
        >
          <el-option
            v-for="item in fieldOptions"
            :key="item.id"
            :label="`${item.name}（${item.crop || '未知作物'}）`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型" prop="type">
        <el-input v-model="queryParams.type" placeholder="例如：施肥/打药" clearable class="!w-200px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="所属农田" align="center" prop="fieldId" width="160">
        <template #default="scope">
          {{ getFieldName(scope.row.fieldId) }}
        </template>
      </el-table-column>
      <el-table-column label="农事类型" align="center" prop="type" width="120" />
      <el-table-column label="产品/农资" align="center" prop="product" />
      <el-table-column label="用量" align="center" prop="dosage" width="100" />
      <el-table-column label="作业日期" align="center" prop="operateDate" width="120">
        <template #default="scope">{{ formatDate(scope.row.operateDate, 'YYYY-MM-DD') }}</template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
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
import { AgriFieldApi, AgriFieldRecordVO, AgriFieldVO } from '@/api/erp/agri/field'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'AgriFieldRecord' })

const loading = ref(true)
const total = ref(0)
const list = ref<AgriFieldRecordVO[]>([])
const fieldOptions = ref<AgriFieldVO[]>([])
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  fieldId: undefined as number | undefined,
  type: undefined as string | undefined
})
const queryFormRef = ref()

const getFieldName = (fieldId: number) => {
  const field = fieldOptions.value.find(f => f.id === fieldId)
  return field ? field.name : `农田#${fieldId}`
}

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

const loadFieldOptions = async () => {
  const data = await AgriFieldApi.getFieldPage({ pageNo: 1, pageSize: 100 })
  fieldOptions.value = data.list || []
}

const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

onMounted(async () => {
  await Promise.all([getList(), loadFieldOptions()])
})
</script>
