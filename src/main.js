import { createApp } from 'vue'
import antd from 'ant-design-vue'
import App from './App.vue'
import 'ant-design-vue/dist/antd.css'
import router from '@/route'
import Vuex from 'vuex'


const app = createApp(App);
app.config.productionTip = false;

app.use(antd);
app.use(router);
app.use(Vuex);

app.mount('#app');
