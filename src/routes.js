const routes = [
    { path: "/stock/hold", name: 'stockHold', label: '持仓股票', component: () => import('./components/stockHold.vue'), },
    { path: "/stock/history", name: 'stockHistory', label: '历史持仓', component: () => import('./components/stockHistory.vue'), },
    { path: "/stock/industry", name: 'stockIndustry', label: '行业分析', component: () => import('./components/stockIndustry.vue'), },
    { path: "/fund/hold", name: 'fundHold', label: '历史持仓', component: () => import('./components/fundHold.vue'), },
]

export default routes