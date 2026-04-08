import request from '@/config/axios'

export interface AgriFieldVO {
  id: number
  memberId: number
  name: string
  area: number
  location: string
  crop: string
  soilType: string
  sowDate: number
  growthStage: string
  remark: string
  createTime: Date
}

export interface AgriFieldRecordVO {
  id: number
  fieldId: number
  memberId: number
  type: string
  product: string
  dosage: string
  operateDate: number
  remark: string
}

export const AgriFieldApi = {
  getFieldPage: async (params: any) => {
    return await request.get({ url: '/erp/agri/field/page', params })
  },
  updateField: async (data: any) => {
    return await request.put({ url: '/erp/agri/field/update', data })
  },
  deleteField: async (id: number) => {
    return await request.delete({ url: '/erp/agri/field/delete?id=' + id })
  },
  getFieldRecordPage: async (params: any) => {
    return await request.get({ url: '/erp/agri/field/record/page', params })
  }
}
