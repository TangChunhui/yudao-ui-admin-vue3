import request from '@/config/axios'

export interface AgriServiceOrderVO {
  id: number
  memberId: number
  serviceType: string
  status: number
  fieldId: number
  serviceArea: number
  expectDate: number
  contactName: string
  contactMobile: string
  address: string
  price: number
  remark: string
  createTime: Date
}

export const AgriServiceOrderApi = {
  getServiceOrderPage: async (params: any) => {
    return await request.get({ url: '/erp/agri/service-order/page', params })
  },
  updateServiceOrder: async (data: any) => {
    return await request.put({ url: '/erp/agri/service-order/update', data })
  },
  deleteServiceOrder: async (id: number) => {
    return await request.delete({ url: '/erp/agri/service-order/delete?id=' + id })
  }
}
