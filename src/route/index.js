import { createRouter, createWebHistory } from 'vue-router'
import App from '@/components/mainPage'
import loginPage from '@/components/loginPage'
import store from "@/store";

const routes = [
    {
        path: "/",
        component: App,
        meta: {
            isLogin: true,
            title: '主页',
        }
    },
    {
        path: "/login",
        component: loginPage,
        meta: {
            isLogin: false,
            title: '登录',
        }
    },
];

const router = createRouter({
    //history模式：createWebHistory , hash模式：createWebHashHistory
    history: createWebHistory(process.env.BASE_URL),
    routes: routes
});


// 全局路由守卫
router.beforeEach((to, from, next) => {
    // console.log(to, from)
    if (to.meta.title) {
        document.title = `${to.meta.title}`;
    }
    //获取用户登录成功后储存的登录标志
    let getFlag = localStorage.getItem("Flag");
    let token = localStorage.getItem("token");
    //如果登录标志存在且为isLogin，即用户已登录
    if (getFlag === "isLogin" && token !== null) {

        //设置vuex登录状态为已登录
        store.state.isLogin = true;
        next();

        //如果已登录，还想想进入登录注册界面，则定向回首页
        if (!to.meta.isLogin) {
            //iViewUi友好提示
            // iView.Message.error('请先退出登录');
            next({
                path: '/'
            });
        }

        //如果登录标志不存在，即未登录
    } else {

        //用户想进入需要登录的页面，则定向回登录界面
        if (to.meta.isLogin) {
            next({
                path: '/login',
            });
            //用户进入无需登录的界面，则跳转继续
        } else {
            next();
        }

    }
});

router.afterEach(() => {
    window.scroll(0, 0);
});

export default router