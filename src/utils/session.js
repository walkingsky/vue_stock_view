/**
 * 获取本地存储的token
 * @returns 本地存储的token值
 */
export const getToken = () => {
    return localStorage.getItem("token");
}
/**
 * 将token值保存到本地存储
 * @param {str} value token值，字符串
 */
export const setToken = (value) => {
    localStorage.setItem("token", value);
}