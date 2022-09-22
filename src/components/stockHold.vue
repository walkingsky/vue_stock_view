<template>
    <div id="timeChart" ref="timeChart" style="width: 100%;height:450px" v-if="showTimeChart"></div>
    <div id="kChart" ref="kChart" style="width: 100%;height:450px" v-if="showKChart"></div>
    <a-table
        class="ant-table-my" 
        :data-source="data" 
        :columns="columns"        
        :loading="loading"
        @expand="expandCustomRow" 
        :expandedRowKeys="expandedRowKeys"
        :customRow="clickRow"
        :scroll="{ y: 550 }"
        :pagination="false"
     >
        <template #expandedRowRender>
            <a-table 
                class="ant-table-sub"
                :columns="innerColumns" 
                :data-source="innerData" 
                :pagination="false"
                :loading="innerLoading"
                :scroll="{ y: 300 }"
                :row-class-name="(_record, index) => (_record.sell_buy =='买入' ? 'table-buy' : 'table-sell')"
            >
            </a-table>        
        </template>
        <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
                <span>
                    <a-typography-link @click.stop="showHistory(record,true)">历史行情</a-typography-link>
                <a-divider type="vertical" />
                    <a-typography-link @click.stop="this.showKChart = false">关闭历史行情</a-typography-link>
                </span>
            </template>
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
import { reqGetHoldStocks ,reqGetStockHistory,reqGetStockByCode,reqGetStockDataHistory,reqGetStockByCodeEast} from '@/apis/stock';
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
    },{
        title: '操作',
        key: 'action',
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
    beforeUnmount(){
        clearInterval(this.timer);
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
         * 126 实时数据
         * @params {code} 6位股票代码
         * @params {market} 市场
         */
         async getStockData126 (code,market){
            
            const res = await reqGetStockByCode({code:code,market:market});
            //console.log(res );
            this.drawEcharts(res);
        },
        /**
         * 东财实时数据
         * @params {code} 6位股票代码
         * @params {market} 市场
         */
         async getStockDataEast (code,market,refrashKChart){
            
            this.showTimeChart = true;
            const res = await reqGetStockByCodeEast({code:code,market:market});
            //console.log(res );            
            this.drawEchartsEast(res.data);
            if(this.showKChart && refrashKChart === true)
                this.showHistory({code:code,market:market},false);
        },
        /**
         * 获取股票历史行情
         */
        async showHistory(record,refreshTimeChart=false){
            if (refreshTimeChart == true)
            {
                this.getStockDataEast(record.code,record.market,true);
                this.currentCode = record.code;
                this.currentMarket = record.market;
            }
                
            this.showKChart = true;            
            const res = await reqGetStockDataHistory({code:record.code,market:record.market});
            const res2 = await reqGetStockHistory({code:record.code,market:record.market});
            //console.log(res);
            this.drawEchartsHistory(res,res2.results);
        },
        /**
         * 展开一个节点，关闭其他展开节点
         * @param {*} expanded 
         * @param {*} record 
         */
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
        clickRow(record){
            return {
                onClick:()=> {                   
                    //console.log(record);
                    //this.getStockData126(record.code,record.market);
                    this.getStockDataEast(record.code,record.market,true);
                    this.currentCode = record.code;
                    this.currentMarket = record.market;
                }
            }
        },
        /**
         * 绘制echarts 行情曲线图,126数据
         */
        drawEcharts(response){
            let y_data_chigu=[];
            let markPointData = [
                {type:'max',name:'最高'},
                {type:'min',name:'最低'}];
            echarts.dispose(document.getElementById('timeChart'));
            let myChart = echarts.init(document.getElementById("timeChart"));
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

        /**
         * 绘制echarts 行情曲线图,东财数据
         */
         drawEchartsEast(response){
            let markPointData = [
                {type:'max',name:'最高'},
                {type:'min',name:'最低'}];
            echarts.dispose(document.getElementById('timeChart'));
            let myChart = echarts.init(document.getElementById("timeChart"));
            var x_Axis=[],y_data=[],i=0,y_data_bili=[],volumes=[];
            for ( var data in response.trends){               
                let datas = response.trends[data].split(',');
                //console.log(typeof(temp_string));
                x_Axis.push(datas[0]);                
                y_data.push(datas[2]);
                y_data_bili.push(((datas[2]-response.preClose)/response.preClose*100).toFixed(2));
                volumes.push([i, datas[5], datas[1] > datas[2] ? 1 : -1]);
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
                animation:false,
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    }
                },
                grid: [
                    {
                        left: '10%',
                        right: '8%',
                        height: '65%'
                    },
                    {
                        left: '10%',
                        right: '8%',
                        top: '80%',
                        height: '16%'
                    }
                ],
                xAxis: [
                    {
                        data: x_Axis
                    },
                    {
                        type: 'category',
                        gridIndex: 1,
                        data: x_Axis,                        
                    }
                ],
                legend:{
                    data:['股价','浮动比','交易量']
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
                        scale: true,
                        gridIndex: 1,
                        splitNumber: 2,
                        name:"交易量",
                        axisLine:false,                        
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
                                { yAxis:response.preClose  ,name:"昨日收盘"}
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
                        data: y_data_bili,                        
                        //formatter: '{value}%' 								
                    },
                    {
                        name: '交易量',
                        type: 'bar',
                        xAxisIndex: 1,
                        yAxisIndex: 2,
                        data: volumes,
                    }
                ]
            };
            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
        },

        calculateMA(dayCount, data) {
            var result = [];
            for (var i = 0, len = data.values.length; i < len; i++) {
                if (i < dayCount) {
                    result.push('-');
                    continue;
                }
                var sum = 0;
                for (var j = 0; j < dayCount; j++) {
                    sum += data.values[i - j][1];
                }
                result.push(+(sum / dayCount).toFixed(3));
            }
            return result;
        },
        /**
         * 绘制股票历史行情曲线图
         */
        drawEchartsHistory(response,rawData){
            const upColor = '#ec0000';
            const upBorderColor = '#8A0000';
            const downColor = '#00da3c';
            const downBorderColor = '#008F28';

            //console.log(response);
            let categoryData = [];
            let values = [];
            let volumes = [];
            let buy = [];
            let sell = [];
            let position = [];
            let pointmark = [];
            var position_his = 0;
            for (var item in response.data.klines) {
                //console.log(response.data.klines[item]);
                var datas = response.data.klines[item].split(',');
                //console.log(datas);
                categoryData.push(datas[0]);
                //var jiaoyi = false;
                var buy_num = 0;
                var sell_num = 0;
                var position_num = 0;

                for (var i in rawData) {
                    if (rawData[i].date == datas[0]) {

                        if (rawData[i].sell_buy == '买入') {
                            buy_num += rawData[i].num;
                            //position_his += buy_num;
                        } else {
                            sell_num += rawData[i].num;
                            //position_his -= sell_num;
                        }
                        //console.log(rawData[i].sell_buy);
                    }
                    pointmark.push({
                        name: 'Mark',
                        coord: [rawData[i].date, rawData[i].price],
                        value: rawData[i].num,
                        itemStyle: {
                            color: rawData[i].sell_buy == '买入' ? 'rgb(41,60,85)' : 'rgb(220,10,10)'
                        }
                    });
                }
                position_his = position_his + buy_num + sell_num;
                if (position_his < 0)
                    position_his = 0;                
                position_num = position_his;

                buy.push([parseInt(item), buy_num, 1]);
                sell.push([parseInt(item), sell_num, -1]);
                position.push([parseInt(item), position_num]);

                values.push([parseFloat(datas[1]), parseFloat(datas[2]), parseFloat(datas[4]), parseFloat(datas[3])]);
                volumes.push(datas[0]);

            }

            var data = {
                categoryData,
                values,
                volumes,
                buy: buy,
                sell: sell,
                position: position
            }
            var option = {
                title: {
                    text: response.data.name,
                },
                animation: false,
                legend: {
                    bottom: 10,
                    left: 'center',
                    data: ['K值数据', 'MA5', 'MA10', 'MA20', 'MA30']
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    },
                    borderWidth: 1,
                    borderColor: '#ccc',
                    padding: 10,
                    textStyle: {
                        color: '#000'
                    },
                    position: function (pos, params, el, elRect, size) {
                        const obj = {
                            top: 10
                        };
                        obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
                        return obj;
                    }
                },
                axisPointer: {
                    link: [
                        {
                            xAxisIndex: 'all'
                        }
                    ],
                    label: {
                        backgroundColor: '#777'
                    }
                },
                toolbox: {
                    feature: {
                        dataZoom: {
                            yAxisIndex: false
                        },
                        brush: {
                            type: ['lineX', 'clear']
                        }
                    }
                },
                brush: {
                    xAxisIndex: 'all',
                    brushLink: 'all',
                    outOfBrush: {
                        colorAlpha: 0.1
                    }
                },
                visualMap: {
                    show: false,
                    seriesIndex: 5,
                    dimension: 2,
                    pieces: [
                        {
                            value: 1,
                            color: downColor
                        },
                        {
                            value: -1,
                            color: upColor
                        }
                    ]
                },
                grid: [
                    {
                        left: '10%',
                        right: '8%',
                        height: '50%'
                    },
                    {
                        left: '10%',
                        right: '8%',
                        top: '63%',
                        height: '16%'
                    }
                ],
                xAxis: [
                    {
                        type: 'category',
                        data: data.categoryData,
                        scale: true,
                        boundaryGap: false,
                        axisLine: { onZero: false },
                        splitLine: { show: false },
                        min: 'dataMin',
                        max: 'dataMax',
                        axisPointer: {
                            z: 100
                        }
                    },
                    {
                        type: 'category',
                        gridIndex: 1,
                        data: data.categoryData,
                        scale: true,
                        boundaryGap: false,
                        axisLine: { onZero: false },
                        axisTick: { show: false },
                        splitLine: { show: false },
                        axisLabel: { show: false },
                        min: 'dataMin',
                        max: 'dataMax'
                    }
                ],
                yAxis: [
                    {
                        scale: true,
                        splitArea: {
                            show: true
                        }
                    },
                    {
                        scale: true,
                        gridIndex: 1,
                        splitNumber: 2,
                        axisLabel: { show: false },
                        axisLine: { show: false },
                        axisTick: { show: false },
                        splitLine: { show: false }
                    }
                ],
                dataZoom: [
                    {
                        type: 'inside',
                        xAxisIndex: [0, 1],
                        start: 95,
                        end: 100
                    },
                    {
                        show: true,
                        xAxisIndex: [0, 1],
                        type: 'slider',
                        top: '85%',
                        start: 95,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: 'K值数据',
                        type: 'candlestick',
                        data: data.values,
                        itemStyle: {
                            color: upColor,
                            color0: downColor,
                            borderColor: upBorderColor,
                            borderColor0: downBorderColor
                        },
                    },
                    {
                        name: 'MA5',
                        type: 'line',
                        data: this.calculateMA(5, data),
                        smooth: false,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: 'MA10',
                        type: 'line',
                        data: this.calculateMA(10, data),
                        smooth: true,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: 'MA20',
                        type: 'line',
                        data: this.calculateMA(20, data),
                        smooth: true,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: 'MA30',
                        type: 'line',
                        data: this.calculateMA(30, data),
                        smooth: true,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: '买入',
                        type: 'bar',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        data: data.buy
                    },

                    {
                        name: '卖出',
                        type: 'bar',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        data: data.sell
                    },
                    {
                        name: '持仓',
                        type: 'line',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        data: data.position
                    }
                ]
            };
            //console.log(option);
            echarts.dispose(document.getElementById('kChart'));
            var myChart = echarts.init(document.getElementById('kChart'));
            myChart.setOption(option);
        },
    },
    mounted(){
        //this.drawEtharts();  
        this.getTableData(); 
        this.timer = setInterval(()=>{
            if(this.showTimeChart === true && this.currentCode != '' && this.currentMarket !='')
            {
                this.getStockDataEast(this.currentCode,this.currentMarket,false);
            }                
        },10000);     
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
            showTimeChart:false,
            showKChart:false,
            currentCode:'',
            currentMarket:'',
            timer:null,
        }
    }
    
});
</script>
<style scoped>
.ant-table-my :deep( .ant-table-tbody > tr > td ) {
    padding: 6px 2px;
}
.ant-table-sub :deep( .ant-table-tbody > tr > td ) {
    padding: 6px 8px;
}
</style>

