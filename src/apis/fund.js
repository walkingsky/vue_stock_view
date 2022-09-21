import http from '../services/request'

/**
 * @description 
 * @param {*} params 请求接口的参数
 */

export const reqFundSuggest = params => { return http.get('/fund/search', params) }