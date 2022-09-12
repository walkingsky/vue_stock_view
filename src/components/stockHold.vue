<template>
    <div id="myEchart" ref="myEchart" style="width: 100%;height:450px" ></div>
    <a-table 
        :data-source="data" 
        :columns="columns"        
        :loading="loading"
        @expand="expandCustomRow" 
        :expandedRowKeys="expandedRowKeys"
        :customRow="clickRow"
        :scroll="{ y: 550 }"
     >
        <template #expandedRowRender>
            <a-table 
                :columns="innerColumns" 
                :data-source="innerData" 
                :pagination="false"
                :loading="innerLoading"
                :scroll="{ y: 300 }"
                :row-class-name="(_record, index) => (_record.sell_buy =='买入' ? 'table-buy' : 'table-sell')"
            >
            </a-table>        
        </template>
    </a-table>
    
</template>
<style scoped>
    :deep(.table-buy) td {
      background-color: #bcf9aa;
    }
    :deep(.table-sell) td {
      background-color: #fab9b9;
    }
</style>
<script>
import * as echarts from 'echarts';
//import { DownOutlined } from '@ant-design/icons-vue';
import { reqGetHoldStocks ,reqGetStockHistory,reqGetStockByCode} from '@/apis/stock';
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
        /**
         * 根据股票代码，获取股票的当天交易数据
         * @params {code} 6位股票代码
         * @params {market} 市场
         */
         async getStockData (code,market){
            
            const res = await reqGetStockByCode({code:code,market:market});
            //console.log(res );
            this.drawEtharts(res);
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

        /**
         * 点击表格行，获取改行股票的当前的行情数据
         */
        clickRow(record,index){
            return {
                onClick:()=> {                   
                    console.log(record);
                    console.log(index);
                    this.getStockData(record.code,record.market);
                }
            }
        },
        /**
         * 绘制echarts 行情曲线图
         */
        drawEtharts(response){
            let y_data_chigu=[];
            let markPointData = [
                {type:'max',name:'最高'},
                {type:'min',name:'最低'}];
            let myChart = echarts.init(document.getElementById("myEchart"));
            var x_Axis=[],y_data=[],i=0,y_data_bili=[];
            for ( var data in response.data){               
                let temp_string = response.data[data][0];
                //console.log(typeof(temp_string));
                x_Axis.push(temp_string.substr(0, 2)+':'+temp_string.substr(2));                
                y_data.push(response.data[data][1]);
                y_data_bili.push(((response.data[data][1]-response.yestclose)/response.yestclose*100).toFixed(2));
                i ++;						
            }
            while(i<242){
                x_Axis.push("");
                i++;
            }
            var colors = ['#5470C6', '#91CC75', '#EE6666'];
            var option = {
                title: {
                    text: response.name
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    }
                },
                grid: [
                    {
                        left: '5%',
                        right: '20%',
                        //bottom: 20
                    },
                    {
                        left: '85%',
                        right: '5%',
                        //height: 80,
                        //bottom: 10
                    }
                ],
                xAxis: [
                    {
                        data: x_Axis
                    },
                    {
                        scale:true,
                        //type:'value',
                        gridIndex:1,
                        //data:y_data_chigu
                        data:['持有','买入','卖出']
                        
                    }
                ],
                legend:{
                    data:['股价','浮动比','持股数量']
                },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none'
                        },
                        magicType: {type: ['line', 'bar']},
                        restore: {},
                        saveAsImage: {}
                    }
                },                
                yAxis: [
                    {
                        type:'value',
                        scale:true,
                        name:"股价",
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: colors[0]
                            }
                        },
                        axisLabel: {
                            formatter: '{value} 元'
                        }
                    },
                    {
                        type:'value',
                        scale:true,
                        name:"浮动比",
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: colors[0]
                            }
                        },
                        axisLabel: {
                            formatter: '{value}%'
                        }
                    },
                    {
                        //type:'category',
                        type:'value',								
                        name:"持股数量",
                        //offset: 60,
                        gridIndex:1,
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: colors[0]
                            }
                        },
                        
                    }
                ],
                series: [
                    {
                        name: '股价',
                        smooth: 0.2,
                        type: 'line',
                        data: y_data,
                        markLine:{
                            data:[
                                //{ type:"max",coord:[1,response.yestclose]  ,name:"昨日收盘"}
                                { yAxis:response.yestclose  ,name:"昨日收盘"}
                            ]
                        },
                        markPoint:{
                            symbol: "pin",
                            data:markPointData
                        }
                    },
                    {
                        name: '浮动比',								
                        type: 'bar',
                        yAxisIndex:1,
                        xAxisIndex:0,
                        data: y_data_bili								
                    },
                    {
                        name: '持股数量',								
                        type: 'bar',
                        yAxisIndex:2,
                        xAxisIndex:1,
                        //data: ['持有','买入','卖出']	
                        data:y_data_chigu							
                    }
                ]
            };
            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
        },
    },
    mounted(){
        //this.drawEtharts();  
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

