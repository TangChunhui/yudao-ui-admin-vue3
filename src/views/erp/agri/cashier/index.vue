<template>
  <div class="agri-cashier-container">
    <!-- 顶部今日营业统计 -->
    <div class="today-stats-bar">
      <div class="stat-item">
        <span class="stat-label">今日收银笔数</span>
        <span class="stat-value text-blue-600">{{ todayStats.count }} 笔</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">今日收银金额</span>
        <span class="stat-value text-green-600">¥ {{ todayStats.amount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">当前购物车</span>
        <span class="stat-value text-orange-600">{{ cart.length }} 种 / {{ cartTotalCount }} 件</span>
      </div>
      <el-button size="small" plain @click="loadTodayStats" :icon="'ep:refresh'">刷新</el-button>
    </div>

    <el-row :gutter="20" class="main-area">
      <!-- 左侧：产品选择区 -->
      <el-col :span="16" class="main-area">
        <el-card class="product-selection-card" shadow="never">
          <template #header>
            <div class="header-search">
                <el-input
                  ref="scanInputRef"
                  v-model="productSearch"
                  placeholder="扫码枪直接扫入 或 搜索产品名称（F10 结算）"
                  prefix-icon="ep:search"
                  clearable
                  class="search-bar"
                  @input="loadProducts"
                  @keyup.enter="handleScanEnter"
                />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 300px)">
            <el-row :gutter="15">
              <el-col v-for="item in productList" :key="item.id" :span="6">
                <div class="product-item" @click="addToCart(item)">
                  <div class="product-badge" v-if="item.isRestricted">限用</div>
                  <div class="name">{{ item.name }}</div>
                  <div class="spec text-gray-400" v-if="item.standard">{{ item.standard }}</div>
                  <div class="price">￥{{ item.price }}</div>
                </div>
              </el-col>
            </el-row>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 右侧：结算 -->
      <el-col :span="8" class="main-area">
        <el-card class="checkout-card" shadow="never">
          <template #header><span class="font-bold text-16px">收银结算</span></template>
          <el-table :data="cart" height="260">
            <el-table-column prop="name" label="品名" min-width="100" show-overflow-tooltip />
            <el-table-column label="数量" width="110" align="center">
              <template #default="scope">
                <div class="flex items-center justify-center gap-4px">
                  <el-button size="small" circle @click="decreaseCount(scope.row)" :icon="'ep:minus'" />
                  <span class="min-w-24px text-center font-bold">{{ scope.row.count }}</span>
                  <el-button size="small" circle type="primary" @click="scope.row.count++" :icon="'ep:plus'" />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="80" align="right">
              <template #default="scope">￥{{ (scope.row.price * scope.row.count).toFixed(2) }}</template>
            </el-table-column>
          </el-table>

          <div class="form-section mt-15px">
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

          <div class="footer-btn mt-10px">
            <div class="total">共计：￥{{ totalAmount.toFixed(2) }}</div>
            <div class="flex gap-10px mt-10px">
              <el-button plain @click="cart = []" :disabled="cart.length === 0">清空</el-button>
              <el-button type="success" size="large" style="flex: 1" @click="submit" :disabled="cart.length === 0">
                确认收款 (F10)
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
const cartTotalCount = computed(() => cart.value.reduce((s, i) => s + i.count, 0))

/** 加载今日收银统计 */
const loadTodayStats = async () => {
  try {
    const data = await AgriReportApi.getAgriFinanceSummary()
    const receiptCount = (data.flowList || []).filter((f: any) => f.type === 1).length
    todayStats.value = {
      count: receiptCount,
      amount: data.todaySalesAmount != null ? Number(data.todaySalesAmount).toFixed(2) : '0.00'
    }
  } catch {
    // 统计接口失败不影响主流程
  }
}

/** 加载产品列表并处理扫码枪逻辑 */
const loadProducts = async () => {
  const data = await ProductApi.getProductPage({ name: productSearch.value, pageSize: 20 })
  productList.value = data.list.map(i => ({
    id: i.id,
    name: i.name,
    price: i.salePrice || i.minPrice || 0,
    unitId: i.unitId,
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

const decreaseCount = (item) => {
  if (item.count > 1) {
    item.count--
  } else {
    const idx = cart.value.indexOf(item)
    if (idx !== -1) cart.value.splice(idx, 1)
  }
}

const submit = async () => {
  if (cart.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确认收到 ¥${totalAmount.value.toFixed(2)}？`, '收银确认')
    const orderData = {
      customerId: customerId.value || 1, // 默认散客 ID=1
      orderTime: new Date().getTime(),
      discountPercent: 0,
      items: cart.value.map(i => ({ productId: i.id, productUnitId: i.unitId, count: i.count, productPrice: i.price })),
      remark: '快速收银订单',
      cashierId: cashierId.value,
      cameraId: cameraId.value || undefined
    }
    const orderId = await SaleOrderApi.createSaleOrder(orderData as any)
    if (orderId) {
      try { await SaleOrderApi.updateSaleOrderStatus(orderId as any, 20) } catch (_) {}
    }
    ElMessage.success('收银成功！')
    cart.value = []
    customerId.value = null
    loadProducts()
    loadTodayStats()
  } catch (e) {}
}

/** 键盘快捷键监听 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'F10') {
    e.preventDefault()
    submit()
  }
}

onMounted(async () => {
  loadProducts()
  loadTodayStats()
  try {
    deviceList.value = (await AgriReportApi.getSeetongDevices()) || []
  } catch {
    deviceList.value = []
  }
  nextTick(() => {
    scanInputRef.value?.focus()
  })
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.agri-cashier-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  padding: 10px 20px;
}

.today-stats-bar {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 10px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  margin-top: 2px;
}

.main-area {
  flex: 1;
  overflow: hidden;
}

.product-selection-card,
.checkout-card {
  height: 100%;
}

.product-item {
  padding: 12px 10px;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.product-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.product-item:active {
  transform: scale(0.97);
}

.product-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #f56c6c;
  color: white;
  padding: 1px 5px;
  font-size: 10px;
  border-radius: 0 6px 0 6px;
}

.product-item .name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-item .spec {
  font-size: 11px;
  margin: 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-item .price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
  margin-top: 4px;
}

.total {
  font-size: 22px;
  color: #f56c6c;
  font-weight: bold;
}
</style>
