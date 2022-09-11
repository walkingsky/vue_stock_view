<template>
    <div id="myEchart" ref="myEchart" style="width: 100%;height:450px" ></div>
    <a-table 
        :data-source="data" 
        :columns="columns"        
        :loading="loading"
        @expand="expandCustomRow" 
        :expandedRowKeys="expandedRowKeys"
     >
        <template #expandedRowRender>
            <a-table 
                :columns="innerColumns" 
                :data-source="innerData" 
                :pagination="false"
                :loading="innerLoading"
            >
            </a-table>        
        </template>
    </a-table>
    
</template>
<script>
import * as echarts from 'echarts';
//import { DownOutlined } from '@ant-design/icons-vue';
import { reqGetHoldStocks ,reqGetStockHistory} from '@/apis/stock';
//import { usePagination } from 'vue-request';
//import axios from 'axios';

const columns = [{
        title: '证券名称',
        dataIndex: 'name',
        //sorter: true,
    }, {
        title: '证券代码',
        dataIndex: 'code',
    }, {
        title: '当前数量',
        dataIndex: 'num',
        sorter: (a,b)=>a.num-b.num,
    },{
        title: '成本价',
        dataIndex: 'costPrice',
        sorter: (a,b)=>a.costPrice-b.costPrice,
    },{
        title: '市值价',
        dataIndex: 'marketVule',
        defaultSortOrder:'descend',
        sorter: (a,b)=>a.marketVule-b.marketVule,
    },{
        title: '市场',
        dataIndex: 'market',
    }];

const innerColumns =[
    {
        title: '日期',
        dataIndex: 'date',
        sorter: (a,b)=>{
            let aTime = new Date(a.date).getTime();
            let bTime = new Date(b.date).getTime();
            return aTime - bTime;
        }
    },
    {
        title: '时间',
        dataIndex: 'time',
        defaultSortOrder:'descend',
        sorter: (a,b)=>{
            let aTime = new Date(a.date+' '+a.time).getTime();
            let bTime = new Date(b.date+' '+b.time).getTime();
            return aTime - bTime;
        }
    },
    {
        title: '买卖方向',
        dataIndex: 'sell_buy',
    },
    {
        title: '交易价格',
        dataIndex: 'price',
        sorter: (a,b)=>a.price-b.price,
    },
    {
        title: '成交量',
        dataIndex: 'num',
        sorter: (a,b)=>a.num-b.num,
    },
];

export  default ({
    components:{
        //DownOutlined,
    },
    setup(){
               
        return {            
            
        };
    },
    methods:{
        /**
         * 获取表格数据
         */
        async getTableData(){
            this.loading = true;
            const res = await reqGetHoldStocks();
            //console.log(res.data);
            this.data = res.data;
            this.loading = false;
        },
        /**
         * 根据股票代码，市场参数获取股票交易历史数据
         * @params {code} 6位股票代码
         * @params {market} 市场
         */
        async getInnerTableData (code,market){
            this.innerLoading = true;
            const res = await reqGetStockHistory({code:code,market:market});
            this.innerLoading = false;
            this.innerData = res.data;
        },
        expandCustomRow(expanded, record) {
            if (this.expandedRowKeys.length > 0) { //进这个判断说明当前已经有展开的了
            //返回某个指定的字符串值在字符串中首次出现的位置，下标为0
                let index = this.expandedRowKeys.indexOf(record.key);
                if (index > -1) { //如果出现则截取这个id,1d到1相当于0，针对重复点击一个
                    this.expandedRowKeys.splice(index, 1);
                } else {
                //如果没出现则截取所有id,添加点击id，0到1，针对已经有一个展开，点另一个会进入判断
                this.expandedRowKeys.splice(0, this.expandedRowKeys.length);
                this.expandedRowKeys.push(record.key);
                }
            } else {
            //数组长度小于0，说明都没展开，第一次点击，id添加到数组，数组有谁的id谁就展开
                this.expandedRowKeys.push(record.key);  
            }
            if(expanded === true)
                this.getInnerTableData(record.code,record.market);
        },
        drawEtharts(){
            let myChart = echarts.init(document.getElementById("myEchart"));
            let option ={                
                legend: {},
                tooltip: {},
                dataset: {
                    dimensions: ['product', '业务类型', '额度占用情况', '缴纳情况'],
                    source: [
                        {product: '水果1', '业务类型': 43.3, '额度占用情况': 85.8, '缴纳情况': 93.7},
                        {product: '水果2', '业务类型': 83.1, '额度占用情况': 73.4, '缴纳情况': 55.1},
                        {product: '水果3', '业务类型': 86.4, '额度占用情况': 65.2, '缴纳情况': 82.5},
                        {product: '水果4', '业务类型': 72.4, '额度占用情况': 53.9, '缴纳情况': 39.1},
                        {product: '水果5', '业务类型': 43.3, '额度占用情况': 85.8, '缴纳情况': 93.7},
                        {product: '水果6', '业务类型': 83.1, '额度占用情况': 73.4, '缴纳情况': 55.1},
                        {product: '水果7', '业务类型': 86.4, '额度占用情况': 65.2, '缴纳情况': 82.5},
                        {product: '水果8', '业务类型': 72.4, '额度占用情况': 53.9, '缴纳情况': 39.1}
                    ]
                },
                xAxis: {type: 'category'},
                yAxis: {},
                // Declare several bar series, each will be mapped
                // to a column of dataset.source by default.
                series: [
                    {type: 'bar'},
                    {type: 'bar'},
                    {type: 'bar'}
                ]
            };
            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
        },
    },
    mounted(){
        this.drawEtharts();  
        this.getTableData();      
    },
    data(){
        return{
            data: [],
            innerData:[],
            columns,
            innerColumns,
            loading:false,
            innerLoading:false,
            expandedRowKeys:[],
        }
    }
    
});
</script>

