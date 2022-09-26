<template>
    <a-space style="width: 100%">
        <a-button type="primary" @click="handleAdd">添加交易记录</a-button>
    </a-space>
    <a-table
        size="small"
        :data-source="data" 
        :columns="columns"        
        :loading="loading"
        :customRow="clickRow"
        :scroll="{ y: `calc(100vh - 160px)` }"
        :pagination="false"
     >
        <template #bodyCell="{ column,text, record }">
            <template v-if="!['id', 'name','type','code','tradedate','op'].includes(column.dataIndex)">
                <div>
                <a-input-number
                    v-if="editableData[record.id]"
                    v-model:value="editableData[record.id][column.dataIndex]"
                    :controls=false
                />
                <template v-else>
                    {{ text }}
                </template>
                </div>
            </template>
            <template v-if="['code'].includes(column.dataIndex)">
                <div>
                <a-auto-complete
                    v-if="editableData[record.id]"
                    v-model:value="editableData[record.id][column.dataIndex]"
                    style="margin: -5px 0;width:100%"
                    :options="optionDatas"
                    :dropdown-match-select-width="500"
                    @select="onSelect"
                    @search="onSearch"
                >
                <template #option="item">
                    <div style="display: flex; justify-content: space-between">
                    <span>                       
                        {{ item.NAME }}                       
                    </span>
                    <span>{{ item.CODE }}</span>
                    </div>
                </template>
                </a-auto-complete>
                <template v-else>
                    {{ text }}
                </template>
                </div>
            </template>
            <template v-if="['tradedate'].includes(column.dataIndex)">
                <div>
                <a-date-picker 
                    v-if="editableData[record.id]"
                    v-model:value="editableData[record.id][column.dataIndex]"
                    :format="dateFormat"
                />
                <template v-else>
                    {{ text }}
                </template>
                </div>
            </template>
            <template v-if="['type'].includes(column.dataIndex)">
                <div>
                <a-select 
                    v-if="editableData[record.id]"
                    v-model:value="editableData[record.id][column.dataIndex]"
                >
                    <a-select-option value="买入">买入</a-select-option>
                    <a-select-option value="卖出">卖出</a-select-option>
                    <a-select-option value="转入">转入</a-select-option>
                    <a-select-option value="转出">转出</a-select-option>
                    <a-select-option value="分红">分红</a-select-option>
                    <a-select-option value="增强">增强</a-select-option>
                </a-select>
                <template v-else>
                    {{ text }}
                </template>
                </div>
            </template>
            <template v-if="column.dataIndex === 'op'">
                
                <span>
                    <span v-if="editableData[record.id]">
                        <a-typography-link @click.stop="save(record)">保存</a-typography-link>
                        <a-divider type="vertical" />
                        <a-typography-link @click.stop="cancel(record.id)">取消</a-typography-link>                       
                    </span>
                    <span v-else>
                        <a @click.stop="edit(record.id)">编辑</a>
                    </span>
                    <a-divider type="vertical" />
                    <a-popconfirm
                    v-if="data.length"
                    title="确认删除?"
                    @confirm="onDelete(record.id)"
                    >
                        <a>删除</a>
                    </a-popconfirm>                
                </span>
            </template>
        </template>    
    </a-table>
</template>

<script>
import {reqFundSuggest,reqFundTradeAdd,reqFundTradeGetAll,reqFundTradeGetById, reqFundTradeModify,reqFundTradeDelById} from '@/apis/fund';
import { message } from 'ant-design-vue';
import { cloneDeep } from 'lodash-es';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

/**
 * 返回当天日期字符串 
 */
function getNowFormatDate() {
    let date = new Date();
    let seperator1 = "-";
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate;
    return currentdate;
}
const columns = [
    {
        title: 'id',
        dataIndex: 'id',
        sorter: (a,b)=>a.id-b.id,
        defaultSortOrder:'ascend',
        width:60,
        key:'id',
    },{
        title: '基金名称',
        dataIndex: 'name',
        width:260,
        sorter: (a, b) => a.name.localeCompare(b.name),
    }, {
        title: '基金代码',
        dataIndex: 'code',
        width:105,
        sorter: (a,b)=>a.code-b.code,
    }, {
        title: '交易日期',
        dataIndex: 'tradedate',        
        sorter: (a,b)=>{
            let aTime = new Date(a.tradedate).getTime();
            let bTime = new Date(b.tradedate).getTime();
            return aTime - bTime;
        },
    },{
        title: '交易类型',
        dataIndex: 'type',
        width:120,
        sorter: (a, b) => a.type.localeCompare(b.type),
    },{
        title: '份额',
        dataIndex: 'shares',
        sorter: (a,b)=>a.shares-b.shares,
    },{
        title: '单位净值',
        dataIndex: 'nav',
    },{
        title: '手续费',
        dataIndex: 'commission',
    },{
        title: '交易金额',
        dataIndex: 'amount',
        sorter: (a,b)=>a.amount-b.amount,
    },{
        title: '转出退回金额',
        dataIndex: 'returned',
        sorter: (a,b)=>a.returned-b.returned,
    },{
        title: '操作',
        dataIndex: 'op'
    }];

export default {
    setup(){
        const dateFormat = 'YYYY-MM-DD';
        return{
            dateFormat,
        }

    },    
    methods:{
        async getRecord(id){
            this.loading = true;
            if (id == undefined){
                let res = await reqFundTradeGetAll();
                this.data = res.data;
            }else{
                let res = await reqFundTradeGetById(id);
            }
            this.loading = false;
        },
        clickRow(record){
            return {
                onClick:()=> {
                    this.currentId = record.id;
                }
            }
        },
        edit(id){
            this.editableData[id] = cloneDeep(this.data.filter(item => id === item.id)[0]);
            this.editableData[id]['tradedate'] = dayjs(this.editableData[id]['tradedate'], this.dateFormat);
            this.currentId = id;
        },
        async save(record){
            //校验数据

            
            let recordData = {
                id: parseInt( record.id),
                name: record.name,
                code: this.editableData[record.id].code,
                tradedate: this.editableData[record.id].tradedate.format('YYYY-MM-DD'),
                type: this.editableData[record.id].type,
                shares:this.editableData[record.id].shares,
                nav:this.editableData[record.id].nav,
                commission:this.editableData[record.id].commission,
                amount:this.editableData[record.id].amount,
                returned:this.editableData[record.id].returned,
            };
            if(this.data.filter(item => record.id === item.id)[0].new === true)
                var res = await reqFundTradeAdd(recordData);
            else
                res = await reqFundTradeModify(recordData);
            if(res.success === true)
            {
                message.success('保存成功');
                delete this.editableData[record.id];
                this.currentId = null;
                this.getRecord();
            }else{
                message.error('保存出错，请重试');
            }
        },
        cancel(id){
            delete this.editableData[id];
            this.currentId = null;
        },
        async onDelete(id){
            let res = await reqFundTradeDelById({id:id});
            if(res.success === true)
            {
                this.getRecord();
                message.success('删除成功');
            }else{
                message.error('删除出错');
            }
        },
        onSelect(value,option){
            for (let i in this.data){
                if(this.data[i].id == this.currentId){
                    this.data[i].name = option.NAME;
                    break;
                }                    
            }
        },
        async onSearch(searchText){
            let res = await reqFundSuggest({key:searchText});
            for(let i in res.Datas){
                res.Datas[i].value = res.Datas[i].CODE;
            }
            this.optionDatas = res.Datas;

        },
        handleAdd(){
            var newData = {
                id: `${this.countA}`,
                name:'',
                code: '',
                tradedate: getNowFormatDate(),
                type: '买入',
                shares:0,
                nav:0,
                commission:0,
                amount:0,
                returned:0,
                new:true,
            };
            this.data.push(newData);
            this.edit(newData.id);
        },
    },
    computed: {
        countA(){
            if(this.data.length == 0)
                return 1 ;
            let c = this.data;
            let a = c.sort((a,b) => {return b.id-a.id })[0];
            return parseInt(a.id)  + 1 ;
        }
    },
    mounted(){
        this.getRecord();
    },
    data(){
        return{
            columns,
            data:[],
            loading:false,
            count:0,
            editableData:{},
            optionDatas:[],
            currentId:null,
        }
    }
}
</script>

<style scoped>

</style>

