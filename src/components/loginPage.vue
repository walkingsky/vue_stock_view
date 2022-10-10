<template>
    
    <a-row type="flex" justify="center" align="middle" style="height:500px">
        <a-col :span="8"></a-col>
        <a-col :span="8">
            
                <a-form
                :model="formState"
                name="basic"
                :label-col="{ span: 8 }"
                :wrapper-col="{ span: 16 }"
                autocomplete="off"
                @finish="onFinish"
                @finishFailed="onFinishFailed"
            >
                <a-form-item
                label="用户名"
                name="username"
                :rules="[{ required: true, message: 'Please input your username!' }]"
                >
                <a-input v-model:value="formState.username" />
                </a-form-item>

                <a-form-item
                label="密码"
                name="password"
                :rules="[{ required: true, message: 'Please input your password!' }]"
                >
                <a-input-password v-model:value="formState.password" autoComplete="on"/>
                </a-form-item>

                <a-form-item name="remember" :wrapper-col="{ offset: 8, span: 16 }">
                <a-checkbox v-model:checked="formState.remember">保留登录状态</a-checkbox>
                </a-form-item>

                <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                <a-button type="primary" html-type="submit">登录</a-button>
                </a-form-item>
            </a-form>        
        </a-col>
        <a-col :span="8"></a-col>
    </a-row>

</template>


<script>
    import { defineComponent, reactive } from 'vue';
    import {reqLogin} from '@/apis/login';
    import {message} from 'ant-design-vue';
    import {setToken} from '@/utils/session';
    import { useRouter } from "vue-router";

    export default defineComponent ({
        setup() {
            const formState = reactive({
            username: '',
            password: '',
            remember: true,
            });
            const router = useRouter();

            return{
                formState,
                router,
            }
        },
        methods:{ 
            async login(username,password){
                var res = await reqLogin({'username':username,'password':password});
                console.log(res);
                if(res.code === 401){
                    message.error('登录错误');
                }else if(res.code === 200){
                    message.success('登录成功');
                    let token = res.token;
                    setToken(token);
                    localStorage.setItem("Flag", 'isLogin');
                    this.router.push('/');
                }
            },
            onFinish(values){
                
                this.login(values.username,values.password);
            },
            onFinishFailed(errorInfo){
                console.log(errorInfo);
            },       
        },
        mounted(){
            
        },
    
    });
</script>