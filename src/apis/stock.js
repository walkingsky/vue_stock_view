import http from '../services/request'

/**
 * @description 
 * @param {*} params 请求接口的参数
 */
export const reqUserList = params => { return http.get('/user/list', params) }
export const reqGetHoldStocks = params => { return http.get('/stock/hold', params) }
export const reqGetStockHistory = params => { return http.get('/stock/history', params) }
export const reqGetStockByCode = params => { return http.get('/stock/126', params) }
export const reqGetStockByCodeEast = params => { return http.get('/stock/east', params) }
export const reqGetStockDataHistory = params => { return http.get('/stock/historydata', params) }
export const reqGetIndustryData = params => { return http.get('/industry', params) }
export const reqGetIndustryInfoData = params => { return http.get('/industry/info', params) }
export const reqGetIndustryHistoryData = params => { return http.get('/industry/history', params) }

