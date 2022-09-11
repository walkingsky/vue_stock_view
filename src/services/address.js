// 根据 process.env.NODE_ENV 切换不同的 baseURL
const isPro = process.env.NODE_ENV === 'production'

module.exports = {
    // 'apis'：vue.config.js中proxy设置的代理
    baseURL: isPro ? 'http://192.168.100.120/apis' : 'http://localhost:5000/apis'
}