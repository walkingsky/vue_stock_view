import http from '../services/request'


export const reqLogin = params => { return http.post('/login', params) }
export const reqLogout = params => { return http.get('/logout', params) }