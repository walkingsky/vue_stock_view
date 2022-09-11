import http from '../services/request'

/**
 * @description 获取用户列表
 * @param {*} params 请求接口的参数
 */
// 此处定义的reqUserList方法会调用我们封装的request中的get方法，get方法的第一个参数是请求地址，第二参数是query参数
export const reqUserList = params => { return http.get('/user/list', params) }
export const reqGetHoldStocks = params => { return http.get('/stock/hold', params) }
