<template>
  <Dialog title="服务订单派单处理" v-model="dialogVisible" width="540px">
    <!-- 订单信息（只读） -->
    <el-descriptions :column="2" border size="small" class="mb-15px">
      <el-descriptions-item label="服务类型">
        <el-tag v-if="orderInfo.serviceType === 'drone_spray'">飞防打药</el-tag>
        <el-tag type="warning" v-else-if="orderInfo.serviceType === 'drone_sow'">飞防撒肥</el-tag>
        <el-tag type="success" v-else-if="orderInfo.serviceType === 'drying'">粮食烘干</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="需求面积/量">{{ orderInfo.serviceArea }}</el-descriptions-item>
      <el-descriptions-item label="期望日期">{{ formatDate(orderInfo.expectDate, 'YYYY-MM-DD') }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ orderInfo.contactName }} {{ orderInfo.contactMobile }}</el-descriptions-item>
      <el-descriptions-item label="服务地址" :span="2">{{ orderInfo.address || '-' }}</el-descriptions-item>
    </el-descriptions>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="订单状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="0">待处理</el-radio>
          <el-radio :label="1">已派单(进行中)</el-radio>
          <el-radio :label="2">已完成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="核定价格" prop="price">
        <el-input-number v-model="formData.price" :min="0" :precision="2" :step="10" class="!w-full" />
      </el-form-item>
      <el-form-item label="派单备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="填写派单信息（如分配给具体服务队）" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AgriServiceOrderApi, AgriServiceOrderVO } from '@/api/erp/agri/serviceOrder'
import { ElMessage } from 'element-plus'
import { formatDate } from '@/utils/formatTime'

const dialogVisible = ref(false)
const formLoading = ref(false)
const orderInfo = ref<Partial<AgriServiceOrderVO>>({})
const formData = ref<any>({
  id: undefined,
  status: 0,
  price: 0,
  remark: ''
})
const formRef = ref()
const formRules = {
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const emit = defineEmits(['success'])

const open = (row: AgriServiceOrderVO) => {
  dialogVisible.value = true
  orderInfo.value = row
  formData.value.id = row.id
  formData.value.status = row.status
  formData.value.price = row.price || 0
  formData.value.remark = row.remark || ''
}

const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    await AgriServiceOrderApi.updateServiceOrder(formData.value)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
