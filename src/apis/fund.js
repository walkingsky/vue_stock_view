import http from '../services/request'

/**
 * @description 
 * @param {*} params 请求接口的参数
 */

export const reqFundSuggest = params => { return http.get('/fund/search', params) }
//基金交易记录的接口
export const reqFundTradeAdd = params => { return http.post('/fund/trade/add', params) }
export const reqFundTradeGetAll = () => { return http.get('/fund/trade/getall') }
export const reqFundTradeModify = params => { return http.put('/fund/trade/modify', params) }
export const reqFundTradeGetById = params => { return http.get('/fund/trade/get', params) }
export const reqFundTradeDelById = params => { return http.delete('/fund/trade/del', params) }
//基金持仓记录接口
export const reqFundHoldGetAll = () => { return http.get('/fund/hold/getall') }
export const reqFundGz = params => { return http.get('/fund/hold/gz', params) }
export const reqFundLsjz = params => { return http.get('/fund/hold/lsjz', params) }