import { createApp } from 'vue'
import antd from 'ant-design-vue'
import App from './App.vue'
import 'ant-design-vue/dist/antd.css'
import 'default-passive-events'

const app = createApp(App)
app.config.productionTip = false

app.use(antd)

app.mount('#app')
