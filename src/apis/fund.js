import http from '../services/request'

/**
 * @description 
 * @param {*} params 请求接口的参数
 */

export const reqFundSuggest = params => { return http.get('/fund/search', params) }
export const reqFundAdd = params => { return http.post('/fund/add', params) }
export const reqFundGetAll = () => { return http.get('/fund/getall') }
export const reqFundModify = params => { return http.put('/fund/modify', params) }
export const reqFundGetById = params => { return http.get('/fund/get', params) }

export const reqFundDelById = params => { return http.delete('/fund/del', params) }