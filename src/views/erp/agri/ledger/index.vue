<template>
  <ContentWrap>
    <!-- 筛选栏 -->
    <el-form :model="queryParams" :inline="true" label-width="70px">
      <el-form-item label="农资类型">
        <el-select v-model="queryParams.agriType" clearable placeholder="全部" class="!w-110px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.ERP_AGRI_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="queryParams.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="[new Date('2000-01-01 00:00:00'), new Date('2000-01-01 23:59:59')]"
          class="!w-260px"
        />
      </el-form-item>
      <el-form-item label="产品名称">
        <el-input v-model="queryParams.keyword" clearable placeholder="产品名称关键字" class="!w-150px" />
      </el-form-item>
      <el-form-item label="批次号">
        <el-input v-model="queryParams.batchNo" clearable placeholder="批次号" class="!w-130px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" /> 重置
        </el-button>
        <el-button
          v-if="activeTab === 'purchase' || activeTab === 'sales'"
          type="success" plain @click="handleExport" :loading="exportLoading"
        >
          <Icon icon="ep:download" /> 导出台账
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <!-- ===== 收发存台账 ===== -->
      <el-tab-pane label="收发存汇总" name="stockBalance">
        <el-table :data="stockList" v-loading="loading" border stripe show-summary :summary-method="stockSummaries">
          <el-table-column label="产品名称" prop="productName" min-width="150" fixed />
          <el-table-column label="农资类型" prop="agriType" width="90" align="center">
            <template #default="{ row }">
              <DictTag :type="DICT_TYPE.ERP_AGRI_TYPE" :value="row.agriType" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="standard" min-width="100" />
          <el-table-column label="批次号" prop="batchNo" min-width="120" />
          <el-table-column label="生产日期" prop="productionDate" min-width="110">
            <template #default="{ row }">{{ formatDate(row.productionDate, 'YYYY-MM-DD') }}</template>
          </el-table-column>
          <el-table-column label="有效期至" prop="expiryDate" min-width="110">
            <template #default="{ row }">
              <span :class="getExpiryClass(row.expiryDate)">
                {{ formatDate(row.expiryDate, 'YYYY-MM-DD') || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="期初库存" prop="openingStock" min-width="90" align="right" />
          <el-table-column label="本期进货" prop="inboundStock" min-width="90" align="right" />
          <el-table-column label="本期销售" prop="outboundStock" min-width="90" align="right" />
          <el-table-column label="期末库存" prop="closingStock" min-width="90" align="right">
            <template #default="{ row }">
              <span :class="row.closingStock <= 0 ? 'text-red-500 font-bold' : ''">
                {{ row.closingStock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" width="70" align="center" />
          <el-table-column label="限用" prop="isRestricted" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRestricted" type="danger" size="small">限用</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="登记证到期" prop="registrationExpiryDate" min-width="120">
            <template #default="{ row }">
              <span v-if="row.registrationExpiryDate" :class="getExpiryClass(row.registrationExpiryDate)">
                {{ formatDate(row.registrationExpiryDate, 'YYYY-MM-DD') }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 购进台账 ===== -->
      <el-tab-pane label="购进台账" name="purchase">
        <el-table :data="purchaseList" v-loading="loading" border stripe show-summary :summary-method="purchaseSummaries">
          <el-table-column label="采购单号" prop="orderNo" min-width="140" fixed />
          <el-table-column label="采购时间" prop="orderTime" min-width="110">
            <template #default="{ row }">{{ formatDate(row.orderTime, 'YYYY-MM-DD') }}</template>
          </el-table-column>
          <el-table-column label="供货商" prop="supplierName" min-width="120" />
          <el-table-column label="产品名称" prop="productName" min-width="150" />
          <el-table-column label="农资类型" prop="agriType" width="90" align="center">
            <template #default="{ row }">
              <DictTag :type="DICT_TYPE.ERP_AGRI_TYPE" :value="row.agriType" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="standard" min-width="100" />
          <el-table-column label="登记证号" prop="registrationNo" min-width="130" />
          <el-table-column label="批次号" prop="batchNo" min-width="120" />
          <el-table-column label="生产日期" prop="productionDate" min-width="110">
            <template #default="{ row }">{{ formatDate(row.productionDate, 'YYYY-MM-DD') || '-' }}</template>
          </el-table-column>
          <el-table-column label="有效期至" prop="expiryDate" min-width="110">
            <template #default="{ row }">
              <span :class="getExpiryClass(row.expiryDate)">
                {{ formatDate(row.expiryDate, 'YYYY-MM-DD') || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="count" min-width="80" align="right" />
          <el-table-column label="单位" prop="unitName" width="70" align="center" />
          <el-table-column label="单价(元)" prop="productPrice" min-width="90" align="right">
            <template #default="{ row }">{{ row.productPrice?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="金额(元)" prop="totalPrice" min-width="100" align="right">
            <template #default="{ row }">{{ row.totalPrice?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="限用" prop="isRestricted" width="65" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRestricted" type="danger" size="small">限用</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 销售台账 ===== -->
      <el-tab-pane label="销售台账" name="sales">
        <el-table :data="salesList" v-loading="loading" border stripe show-summary :summary-method="salesSummaries">
          <el-table-column label="销售单号" prop="orderNo" min-width="140" fixed />
          <el-table-column label="销售时间" prop="orderTime" min-width="110">
            <template #default="{ row }">{{ formatDate(row.orderTime, 'YYYY-MM-DD') }}</template>
          </el-table-column>
          <el-table-column label="客户" prop="customerName" min-width="100" />
          <el-table-column label="产品名称" prop="productName" min-width="150" />
          <el-table-column label="农资类型" prop="agriType" width="90" align="center">
            <template #default="{ row }">
              <DictTag :type="DICT_TYPE.ERP_AGRI_TYPE" :value="row.agriType" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="standard" min-width="100" />
          <el-table-column label="登记证号" prop="registrationNo" min-width="130" />
          <el-table-column label="批次号" prop="batchNo" min-width="120" />
          <el-table-column label="有效期至" prop="expiryDate" min-width="110">
            <template #default="{ row }">
              <span :class="getExpiryClass(row.expiryDate)">
                {{ formatDate(row.expiryDate, 'YYYY-MM-DD') || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="count" min-width="80" align="right" />
          <el-table-column label="单位" prop="unitName" width="70" align="center" />
          <el-table-column label="单价(元)" prop="productPrice" min-width="90" align="right">
            <template #default="{ row }">{{ row.productPrice?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="金额(元)" prop="totalPrice" min-width="100" align="right">
            <template #default="{ row }">{{ row.totalPrice?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="用途" prop="usageIntent" min-width="130" show-overflow-tooltip />
          <el-table-column label="限用" prop="isRestricted" width="65" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRestricted" type="danger" size="small">限用</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="购药人身份证" prop="buyerIdCard" min-width="160" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

      <!-- ===== 临期预警 ===== -->
      <el-tab-pane label="临期预警" name="expiring">
        <div class="mb-10px flex items-center gap-10px">
          <span class="text-gray-600">预警天数：</span>
          <el-input-number
            v-model="expiringDays"
            :min="1"
            :max="365"
            controls-position="right"
            class="!w-120px"
            @change="loadExpiringList"
          />
          <span class="text-gray-500 text-sm">天内到期的库存</span>
        </div>
        <el-table :data="expiringList" v-loading="loading" border stripe>
          <el-table-column label="产品名称" prop="productName" min-width="150" fixed />
          <el-table-column label="农资类型" prop="agriType" width="90" align="center">
            <template #default="{ row }">
              <DictTag :type="DICT_TYPE.ERP_AGRI_TYPE" :value="row.agriType" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="standard" min-width="100" />
          <el-table-column label="批次号" prop="batchNo" min-width="120" />
          <el-table-column label="有效期至" prop="expiryDate" min-width="120">
            <template #default="{ row }">
              <span class="font-bold" :class="getExpiryClass(row.expiryDate)">
                {{ formatDate(row.expiryDate, 'YYYY-MM-DD') }}
                （{{ getDaysLeft(row.expiryDate) }}天）
              </span>
            </template>
          </el-table-column>
          <el-table-column label="剩余库存" prop="closingStock" min-width="90" align="right" />
          <el-table-column label="单位" prop="unitName" width="70" align="center" />
          <el-table-column label="限用" prop="isRestricted" width="65" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRestricted" type="danger" size="small">限用</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import { AgriReportApi } from '@/api/erp/agri/report'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import dayjs from 'dayjs'

defineOptions({ name: 'AgriLedger' })

const activeTab = ref('stockBalance')
const loading = ref(false)
const exportLoading = ref(false)
const stockList = ref<any[]>([])
const purchaseList = ref<any[]>([])
const salesList = ref<any[]>([])
const expiringList = ref<any[]>([])
const expiringDays = ref(180)

const queryParams = reactive({
  timeRange: [
    dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
    dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss')
  ] as string[],
  agriType: undefined as number | undefined,
  keyword: '',
  batchNo: ''
})

const buildParams = () => ({
  beginTime: queryParams.timeRange?.[0],
  endTime: queryParams.timeRange?.[1],
  agriType: queryParams.agriType || undefined,
  keyword: queryParams.keyword || undefined,
  batchNo: queryParams.batchNo || undefined
})

const getList = async () => {
  loading.value = true
  try {
    const params = buildParams()
    if (activeTab.value === 'stockBalance') {
      stockList.value = (await AgriReportApi.getStockBalanceReport(params)) || []
    } else if (activeTab.value === 'purchase') {
      purchaseList.value = (await AgriReportApi.getPurchaseLedgerList(params)) || []
    } else if (activeTab.value === 'sales') {
      salesList.value = (await AgriReportApi.getSalesDetailList(params)) || []
    } else if (activeTab.value === 'expiring') {
      await loadExpiringList()
    }
  } finally {
    loading.value = false
  }
}

const loadExpiringList = async () => {
  loading.value = true
  try {
    expiringList.value = (await AgriReportApi.getExpiringStockList(expiringDays.value)) || []
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => getList()
const handleQuery = () => getList()

/** 导出当前 Tab 的台账数据 */
const handleExport = async () => {
  exportLoading.value = true
  const params = buildParams()
  try {
    if (activeTab.value === 'purchase') {
      await AgriReportApi.exportPurchaseLedgerExcel(params)
    } else if (activeTab.value === 'sales') {
      await AgriReportApi.exportSalesDetailExcel(params)
    }
  } finally {
    exportLoading.value = false
  }
}

const resetQuery = () => {
  queryParams.agriType = undefined
  queryParams.keyword = ''
  queryParams.batchNo = ''
  queryParams.timeRange = [
    dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
    dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss')
  ]
  getList()
}

/** 有效期样式 */
const getExpiryClass = (date: any) => {
  if (!date) return ''
  const days = dayjs(date).diff(dayjs(), 'day')
  if (days < 0) return 'text-red-600 font-bold'
  if (days < 30) return 'text-orange-500 font-bold'
  if (days < 90) return 'text-yellow-600'
  return ''
}

const getDaysLeft = (date: any) => {
  if (!date) return '-'
  return dayjs(date).diff(dayjs(), 'day')
}

/** 收发存合计 */
const stockSummaries = ({ columns, data }: any) => {
  const sums: string[] = []
  columns.forEach((col: any, idx: number) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (['openingStock', 'inboundStock', 'outboundStock', 'closingStock'].includes(col.property)) {
      sums[idx] = data.reduce((s: number, r: any) => s + (Number(r[col.property]) || 0), 0).toFixed(3)
    } else {
      sums[idx] = ''
    }
  })
  return sums
}

/** 购进合计 */
const purchaseSummaries = ({ columns, data }: any) => {
  const sums: string[] = []
  columns.forEach((col: any, idx: number) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (['count', 'totalPrice'].includes(col.property)) {
      sums[idx] = data.reduce((s: number, r: any) => s + (Number(r[col.property]) || 0), 0).toFixed(2)
    } else {
      sums[idx] = ''
    }
  })
  return sums
}

/** 销售合计 */
const salesSummaries = ({ columns, data }: any) => {
  const sums: string[] = []
  columns.forEach((col: any, idx: number) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (['count', 'totalPrice'].includes(col.property)) {
      sums[idx] = data.reduce((s: number, r: any) => s + (Number(r[col.property]) || 0), 0).toFixed(2)
    } else {
      sums[idx] = ''
    }
  })
  return sums
}

onMounted(() => getList())
</script>
