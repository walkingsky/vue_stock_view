<template>
    <a-row type="flex">
        <a-col flex="auto">
            <div id="timeChart" ref="timeChart" style="width:100%;height:450px" v-if="showTimeChart" ></div>
            <div id="kChart" ref="kChart" style="width: 100%;height:450px" v-if="showKChart"></div>
        </a-col>
        <a-col flex="120px" v-if="showTimeChart || showKChart">
            <a-table
                size="small"
                :data-source="data" 
                :columns="columnsRadio"
                :scroll="{ y: (showTimeChart && showKChart)?900:450 }"
                :pagination="false"            
            >
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                    <a-typography-link @click.stop="getStockDataEast(record.code,record.market,true);currentCode = record.code;currentMarket = record.market;">{{record.name}}</a-typography-link>
                </template>
            </template>
            </a-table>
        </a-col>
    </a-row>
    <div v-if="calculator.show" style="width:100%;height:100px">
        <div >
            <a-row style="width:100%" align="bottom">
                <a-col :span="6">
                    买入价格：<a-slider v-model:value="calculator.buy.value" :min="calculator.buy.min" :max="calculator.buy.max" :step="0.001"/>
                </a-col>
                <a-col :span="2">
                    <a-input-number v-model:value="calculator.buy.value" :min="calculator.buy.min" :max="calculator.buy.max" style="margin-left: 16px" :step="0.001"/>
                </a-col>
                <a-col :span="6">
                    份额基数：
                    <a-input-number v-model:value="calculator.base" :step="10" :min="10" :max="10000" />
                </a-col>
            </a-row>
        </div>
        <div>
            <a-row style="width:100%" align="bottom">
                <a-col :span="6">
                    卖出价格：<a-slider v-model:value="calculator.sell.value" :min="calculator.sell.min" :max="calculator.sell.max" :step="0.001"/>
                </a-col>
                <a-col :span="2">
                    <a-input-number v-model:value="calculator.sell.value" :min="calculator.sell.min" :max="calculator.sell.max" style="margin-left: 16px" :step="0.001"/>
                </a-col>
                <a-col :span="2">
                    {{calculator.base}}股:{{calculate(calculator.base)}}
                </a-col>
                <a-col :span="2">
                    {{calculator.base*2}}股:{{calculate(calculator.base*2)}}
                </a-col>
                <a-col :span="2">
                    {{calculator.base*3}}股:{{calculate(calculator.base*3)}}
                </a-col>
                <a-col :span="2">
                    {{calculator.base*4}}股:{{calculate(calculator.base*4)}}
                </a-col>
                <a-col :span="2">
                    {{calculator.base*5}}股:{{calculate(calculator.base*5)}}
                </a-col>
                <a-col :span="2">
                    {{calculator.base*6}}股:{{calculate(calculator.base*6)}}
                </a-col>
            </a-row>
        </div>
    </div>        
    <a-space align="center" style="margin-bottom: 10px">
    自动匹配Y轴范围:
        <a-switch v-model:checked="this.yAxisMaxAuto" @change="reSetTimeChart"></a-switch>
        <a-button @click="this.showKChart=false">关闭历史行情</a-button>
        打开收益计算器 <a-switch size="small" v-model:checked="calculator.show" @change="openCalculator"/>
    </a-space>
    <a-table
        size="small"
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
                size="small"
                :columns="innerColumns" 
                :data-source="innerData" 
                :pagination="false"
                :loading="innerLoading"
                :scroll="{ y: 300 }"
                :customRow="subTableclickRow"
                :row-class-name="(_record, index) => (_record.sell_buy =='买入' ? 'table-buy' : 'table-sell')"
            >
            </a-table>        
        </template>
        <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
                <span>
                    <a-typography-link @click=";">分时行情</a-typography-link>
                <a-divider type="vertical" />
                    <a-typography-link @click.stop="showHistory(record,true)">历史行情</a-typography-link>
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
import { reqGetHoldStocks ,reqGetStockHistory,reqGetStockDataHistory,reqGetStockByCodeEast} from '@/apis/stock';
import { isOperation } from '@/utils/common';

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
const columnsRadio = [
    {
      
        title: '证券名称',
        dataIndex: 'name',
        key:'action',
       
    }
];
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
    {
        title: '成交金额',
        dataIndex: 'vol',
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
        if(this.timer != null)
            clearInterval(this.timer);
    },
    methods:{
        /**
         * 获取表格数据
         */
        async getTableData(){
            this.loading = true;
            const res = await reqGetHoldStocks({history:'0'});
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
         * 东财实时数据
         * @params {code} 6位股票代码
         * @params {market} 市场
         */
         async getStockDataEast (code,market,refrashKChart){   
            const res = await reqGetStockByCodeEast({code:code,market:market});           
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
            this.drawEchartsHistory(res,res2.results);
        },
        /**
         * 计算收益
         * @param {int} shares 卖出份额数
         */
        calculate(shares){
            return ((this.calculator.sell.value - this.calculator.buy.value)*shares - this.calculator.buy.value*shares*0.01 -this.calculator.sell.value*shares*0.00025).toFixed(2);
        },
        openCalculator(){
            if(this.calculate.show)
                this.calculate.getValue=true;
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
                    this.showTimeChart = true;
                    //等渲染完成后执行
                    this.$nextTick(function () {
                        if(this.myChart==null)
                            this.myChart = echarts.init(document.getElementById("timeChart"));
                    });
    
                    this.getStockDataEast(record.code,record.market,true);
                    this.currentCode = record.code;
                    this.currentMarket = record.market;
                }
            }
        },
        /**
         * 子表点击行操作
         */
        subTableclickRow(record){
            return{
                onClick:()=>{
                    if(this.calculator.show){
                        if(record.sell_buy == '买入'){
                            this.calculator.buy.min = record.price*0.8;
                            this.calculator.buy.max = record.price*1.2;
                            this.calculator.base = record.num;
                            this.calculator.buy.value = record.price;
                        }
                    }
                    this.getStockDataEast(record.code,record.market,true);
                    this.currentCode = record.code;
                    this.currentMarket = record.market;
                }
            }
        },  
        //保留n位小数
        roundFun(value, n) {
        return Math.round(value*Math.pow(10,n))/Math.pow(10,n);
        },      
        /**
         * 绘制echarts 行情曲线图,东财数据
         */
         drawEchartsEast(response){
            let markPointData = [
                {type:'max',name:'最高'},
                {type:'min',name:'最低'}];
            if(this.calculator.show){
                this.calculator.buy.min = this.roundFun(response.preClose*0.8,3);
                this.calculator.buy.max = this.roundFun(response.preClose*1.2,3);
                
                this.calculator.sell.min = this.roundFun(response.preClose*0.8,3);
                this.calculator.sell.max = this.roundFun(response.preClose*1.2,3);
                
                this.calculator_buy = response.preClose;
                this.calculator_sell = response.preClose;
            }
            var x_Axis=[],y_data=[],i=0,y_data_bili=[],volumes=[];
            for ( var data in response.trends){               
                let datas = response.trends[data].split(',');
                x_Axis.push(datas[0]);                
                y_data.push(datas[2]); 
                if(i == response.trends.length -1 )               
                    this.calculator.sell.value = parseFloat(datas[2]);
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
                    text: response.name,
                    x: 'center'
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
                        left: '3%',
                        right: '3%',
                        height: '65%'
                    },
                    {
                        left: '3%',
                        right: '3%',
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
                    data:['股价','浮动比','交易量'],
                    top:'6%'
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
                        symbol:'none',
                        data: y_data,
                        markLine:{
                            data:[
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
            if(this.yAxisMaxAuto === false){
                option.yAxis[0].max = response.preClose*1.1;
                option.yAxis[0].min = response.preClose*0.9;
                option.yAxis[1].max = 10;
                option.yAxis[1].min = -10;
            }
            this.myChart.clear();
            this.myChart.setOption(option,true);
        },
        //刷新 实时图的option
        reSetTimeChart(){
            if(this.showTimeChart ){
                let option = this.myChart.getOption();
                let preClose = option.series[0].markLine.data[0].yAxis;
                if(this.yAxisMaxAuto === false){
                    option.yAxis[0].max = preClose*1.1;
                    option.yAxis[0].min = preClose*0.9;
                    option.yAxis[1].max = 10;
                    option.yAxis[1].min = -10;
                } else{
                    delete option.yAxis[0].max;
                    delete option.yAxis[0].min;
                    delete option.yAxis[1].max;
                    delete option.yAxis[1].min;
                }
                this.myChart.clear();
                this.myChart.setOption(option,true);
            }            
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

            let categoryData = [];
            let values = [];
            let volumes = [];
            let buy = [];
            let sell = [];
            let position = [];
            let pointmark = [];
            let buy_prices = [];
            let sell_prices = [];
            var position_his = 0;
            for (var item in response.data.klines) {
                var datas = response.data.klines[item].split(',');
                categoryData.push(datas[0]);
                var buy_num = 0;
                var sell_num = 0;
                var position_num = 0;

                for (var i in rawData) {
                    
                    if (rawData[i].date == datas[0]) {

                        if (rawData[i].sell_buy == '买入') {
                            buy_prices.push([rawData[i].date,rawData[i].price]);
                            buy_num += rawData[i].num; 
                        } else {
                            sell_prices.push([rawData[i].date,rawData[i].price]);
                            sell_num += rawData[i].num;
                        }
                    }
                    pointmark.push({
                        name: 'Mark',
                        coord: [rawData[i].date, rawData[i].price],
                        value: rawData[i].num,
                        itemStyle: {
                            color: rawData[i].sell_buy == '买入' ? 'rgb(41,60,85)' : 'rgb(220,10,10)'
                        },
                        symbol: "rect",
                        symbolRotate: 180,
                        symbolSize: 5,
                        label: {
                        show: true,
                        position: rawData[i].sell_buy == '买入' ? "top":"bottom",
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
                position: position,
                sell_prices:sell_prices,
                buy_prices:buy_prices,
            }
            var option = {
                title: {
                    text: response.data.name,
                    x: 'center'
                },
                animation: false,
                legend: {
                    bottom: 10,
                    left: 'center',
                    data: ['K值数据', 'MA5', 'MA10', 'MA20', 'MA30','买入价格','卖出价格'],
                    top:'6%'
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
                        left: '3%',
                        right: '3%',
                        height: '50%'
                    },
                    {
                        left: '3%',
                        right: '3%',
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
                        //markPoint:{
                        //    data:pointmark,
                        //},
                    },
                    {
                        name: '买入价格',
                        type: 'scatter',
                        symbol:'pin',
                        zlevel:100,
                        data: data.buy_prices,
                        itmeStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: '卖出价格',
                        type: 'scatter',
                        symbol:'pin',
                        zlevel:101,
                        symbolRotate:180,
                        data: data.sell_prices,
                        itmeStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: 'MA5',
                        type: 'line',
                        symbol:'none',
                        data: this.calculateMA(5, data),
                        smooth: false,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: 'MA10',
                        type: 'line',
                        symbol:'none',
                        data: this.calculateMA(10, data),
                        smooth: true,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: 'MA20',
                        type: 'line',
                        symbol:'none',
                        data: this.calculateMA(20, data),
                        smooth: true,
                        lineStyle: {
                            opacity: 0.5
                        }
                    },
                    {
                        name: 'MA30',
                        type: 'line',
                        symbol:'none',
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
                        symbol:'none',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        data: data.position
                    }
                ]
            };
            echarts.dispose(document.getElementById('kChart'));
            var myKChart = echarts.init(document.getElementById('kChart'));
            myKChart.setOption(option,true);
        },
    },
    mounted(){  
        this.getTableData(); 
        
        if (isOperation()){
            this.timer = setInterval(()=>{
                if(this.showTimeChart === true && this.currentCode != '' && this.currentMarket !='')
                {
                    this.getStockDataEast(this.currentCode,this.currentMarket,false);
                }                
            },10000); 
        }
            
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
            yAxisMaxAuto:true,
            columnsRadio,
            //收益计算器
            calculator:{
                show:false,
                sell:{
                    value:1,
                    min:0,
                    max:2,
                },
                buy:{
                    value:1,
                    min:0,
                    max:2,
                },
                base:100,
            },
        }
    }
    
});
</script>


