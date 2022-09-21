<template>
    fundHold:'{{text}}'
</template>

<script>
import {reqFundSuggest} from '@/apis/fund';

export default {
    
    methods:{
        test(){
            let res = reqFundSuggest({key:'1212'});
            console.log(res);
            this.text=res.Datas;
        },
    },
    mounted(){
        this.test();
    },
    data(){
        return{
            text:'',
        }
    }
}
</script>

<style>

</style>

