<template>
  <div class="agri-cashier-container">
    <el-row :gutter="20" class="full-height">
      <!-- 左侧：产品选择区 -->
      <el-col :span="16" class="full-height">
        <el-card class="product-selection-card" shadow="never">
          <template #header>
            <div class="header-search">
                <el-input
                  ref="scanInputRef"
                  v-model="productSearch"
                  placeholder="扫码枪直接扫入 或 搜索产品名称"
                  prefix-icon="ep:search"
                  clearable
                  class="search-bar"
                  @input="loadProducts"
                  @keyup.enter="handleScanEnter"
                />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 250px)">
            <el-row :gutter="15">
              <el-col v-for="item in productList" :key="item.id" :span="6">
                <div class="product-item" @click="addToCart(item)">
                  <div class="product-badge" v-if="item.isRestricted">限用</div>
                  <div class="name">{{ item.name }}</div>
                  <div class="price">￥{{ item.price }}</div>
                </div>
              </el-col>
            </el-row>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 右侧：结算 -->
      <el-col :span="8" class="full-height">
        <el-card class="checkout-card" shadow="never">
          <template #header><span>收银结算</span></template>
          <el-table :data="cart" height="300">
            <el-table-column prop="name" label="品名" />
            <el-table-column prop="count" label="数量" width="80" />
            <el-table-column label="小计" width="80">
              <template #default="scope">￥{{ (scope.row.price * scope.row.count).toFixed(2) }}</template>
            </el-table-column>
          </el-table>

          <div class="form-section mt-20px">
            <el-form label-position="top">
              <el-form-item label="消费者 (可选)">
                  <div class="flex gap-2">
                    <el-select
                      v-model="customerId"
                      filterable
                      remote
                      reserve-keyword
                      placeholder="选择熟人/匿名"
                      :remote-method="searchCustomer"
                      style="flex: 1"
                      clearable
                    >
                      <el-option
                        v-for="item in customerOptions"
                        :key="item.id"
                        :label="item.name + (item.mobile ? ' - ' + item.mobile : '')"
                        :value="item.id"
                      />
                    </el-select>
                    <el-button type="info" plain @click="selectAnonymous">散客</el-button>
                  </div>
              </el-form-item>
              <el-form-item label="收银人 (夫妻店模式)">
                <el-radio-group v-model="cashierId" size="large">
                  <el-radio-button label="1">店主 (夫)</el-radio-button>
                  <el-radio-button label="2">店主 (妻)</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="监控摄像头 (视频存证)">
                <el-select
                  v-model="cameraId"
                  clearable
                  filterable
                  allow-create
                  placeholder="选择摄像头（可手动输入ID）"
                  style="width: 100%"
                >
                  <el-option
                    v-for="d in deviceList"
                    :key="d.deviceId"
                    :label="`${d.deviceName}${d.channelName ? ' - ' + d.channelName : ''}`"
                    :value="d.deviceId"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <div class="footer-btn mt-20px">
            <div class="total">共计：￥{{ totalAmount.toFixed(2) }}</div>
            <el-button type="success" size="large" style="width: 100%" @click="submit">确认收款</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ProductApi } from '@/api/erp/product/product'
import { CustomerApi } from '@/api/erp/sale/customer'
import { SaleOrderApi } from '@/api/erp/sale/order'
import { AgriReportApi } from '@/api/erp/agri/report'

defineOptions({ name: 'AgriCashier' })

const scanInputRef = ref()
const productSearch = ref('')
const customerId = ref<number | null>(null)
const cashierId = ref('1')
const cameraId = ref<string | null>(null)
const cart = ref<any[]>([])
const productList = ref<any[]>([])
const customerOptions = ref<any[]>([])
const deviceList = ref<any[]>([])
const todayStats = ref({ count: 0, amount: '0.00' })

const totalAmount = computed(() => cart.value.reduce((s, i) => s + i.price * i.count, 0))

/** 加载今日收银统计 */
const loadTodayStats = async () => {
  const data = await AgriReportApi.getAgriFinanceSummary()
  todayStats.value = {
    count: data.todayReceiptCount || 0,
    amount: data.todayReceiptAmount || '0.00'
  }
}

/** 加载产品列表并处理扫码枪逻辑 */
const loadProducts = async () => {
  const data = await ProductApi.getProductPage({ name: productSearch.value, pageSize: 20 })
  productList.value = data.list.map(i => ({
    id: i.id,
    name: i.name,
    price: i.minPrice,
    standard: i.standard,
    isRestricted: i.isRestricted,
    stockCount: i.stockCount || 0,
    barCode: i.barCode
  }))
}

/** 核心：处理扫码枪按键 (通常以 Enter 结尾) */
const handleScanEnter = async () => {
  if (!productSearch.value) return
  
  // 1. 先尝试在当前列表中精确匹配条码
  let target = productList.value.find(p => p.barCode === productSearch.value || p.name === productSearch.value)
  
  // 2. 如果当前页没匹配到，去后端精准搜一次条码
  if (!target) {
    const data = await ProductApi.getProductPage({ barCode: productSearch.value, pageSize: 1 })
    if (data.list && data.list.length > 0) {
      target = data.list[0]
    }
  }

  if (target) {
    addToCart(target)
    productSearch.value = '' // 清空，准备下一扫
    ElMessage.success(`已加入：${target.name}`)
  } else {
    // 如果没搜到，就维持现状让用户手动选
    loadProducts()
  }
}

/** 快速选择匿名客 */
const selectAnonymous = () => {
  customerId.value = 1 // 预设 1 为系统默认匿名客 ID
  ElMessage.info('已选择：匿名散客')
}

/** 搜索熟人 (针对夫妻店高频客户) */
const searchCustomer = async (query) => {
  if (!query) return
  const data = await CustomerApi.getCustomerPage({ name: query, pageSize: 5 })
  customerOptions.value = data.list
}

const addToCart = (p) => {
  const item = cart.value.find(i => i.id === p.id)
  if (item) item.count++
  else cart.value.push({ ...p, count: 1 })
}

const submit = async () => {
  if (cart.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(`确认收到 ${totalAmount.value} 元？(夫/妻一键结账)`, '收银确认')
    const orderData = {
      customerId: customerId.value,
      items: cart.value.map(i => ({ productId: i.id, count: i.count })),
      remark: '快速收银订单',
      cashierId: cashierId.value,
      cameraId: cameraId.value || undefined
    }
    await SaleOrderApi.createSaleOrder(orderData as any)
    ElMessage.success('收银成功！')
    cart.value = []
    customerId.value = null
    loadProducts()
    loadTodayStats()
  } catch (e) {}
}

/** 键盘快捷键监听 */
onMounted(async () => {
  loadProducts()
  loadTodayStats()
  // 加载摄像头设备列表
  try {
    deviceList.value = (await AgriReportApi.getSeetongDevices()) || []
  } catch {
    deviceList.value = []
  }
  nextTick(() => {
    scanInputRef.value?.focus()
  })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F10') submit()
  })
})
</script>

<style scoped>
.product-item { padding: 15px; border: 1px solid #eee; cursor: pointer; position: relative; }
.product-badge { position: absolute; top:0; right: 0; background: red; color: white; padding: 2px 5px; font-size: 10px;}
.total { font-size: 24px; color: red; font-weight: bold; margin-bottom: 20px;}
</style>
