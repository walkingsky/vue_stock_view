<template>
    <div id="myEchart" ref="myEchart" style="width: 100%;height:450px" ></div>
    <a-space style="width: 100%">
        <a-button type="primary" :loading="loadingButton" @click="getIndustryData()">刷新</a-button>
        <a-radio-group v-model:value="kind" @change="getIndustryData()"  :disabled="loadingButton">
            <a-radio-button value="fluctuate">涨跌幅</a-radio-button>
            <a-radio-button value="capital">资金流入</a-radio-button>
        </a-radio-group>
    </a-space>
    <a-table 
        size="small"
        :data-source="data" 
        :columns="columns"        
        :loading="loading"
        :pagination=false
        :customRow="clickRow"
        :scroll="{ y:`calc(100vh - 500px)` }"
     >    
        <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
                <span>
                    <a-typography-link @click.stop="openUrl(record,'1')">资金流</a-typography-link>
                <a-divider type="vertical" />
                    <a-typography-link @click.stop="openUrl(record,'2')">详情页</a-typography-link>
                </span>
            </template>
        </template> 
    </a-table>
</template>
<style scoped>
</style>
<script>
import { reqGetIndustryData,reqGetIndustryHistoryData} from '@/apis/stock';
import * as echarts from 'echarts';

const columns = [{
        title: '板块名称',
        dataIndex: 'f14',
        key:'name',
        //sorter: true,
    },{
        title: '板块代码',
        dataIndex: 'f12',
        key:'code',
        //sorter: true,
    }, {
        title: '最新价',
        dataIndex: 'f2',
        align:'right',
    }, {
        title: '涨跌额',
        dataIndex: 'f4',
        sorter: (a,b)=>a.f4-b.f4,
        align:'right',
    },{
        title: '涨跌幅%',
        dataIndex: 'f3',
        defaultSortOrder:'descend',
        sorter: (a,b)=>a.f3-b.f3,
        customRender:(text)=>{
            if (text.text != null) {
                return text.text + '%'
            }
        },
        align:'right',
    },{
        title: '总市值',
        dataIndex: 'f20',        
        sorter: (a,b)=>a.f20-b.f20,
        customRender:(text)=>{
            if (text.text != null) {
                return Math.floor((parseInt(text.text) /100000000) * 100) / 100 + '亿'
            }
        },
        align:'right',
    },{
        title: '换手率%',
        dataIndex: 'f8',
        sorter: (a,b)=>a.f8-b.f8,
        customRender:(text)=>{
            if (text.text != null) {
                return text.text + '%'
            }
        },
        align:'right',
    },{
        title: '上涨家数',
        dataIndex: 'f104',
        sorter: (a,b)=>a.f104-b.f104,
    },{
        title: '下跌家数',
        dataIndex: 'f105',
        sorter: (a,b)=>a.f105-b.f105,
    },{
        title: '相关链接',
        key: 'action',
    }
];
export default {
    methods:{
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
        openUrl(record,kind){
            if(kind === '1')
                window.open("https://data.eastmoney.com/bkzj/"+record.f12+".html","_blank");
            if(kind ==='2')
                window.open("https://quote.eastmoney.com/bk/90."+record.f12+".html","_blank");
        },
        clickRow(record){
            return {
                onClick:()=> {                   
                    //console.log(record.f12);
                    //console.log(index);
                    this.getIndustryHistoryData(record.f12);
                }
            }
        },
        /**
         * 绘制行业日K曲线图
         */
         drawEcharts(response){
            const upColor = '#ec0000';
            const upBorderColor = '#8A0000';
            const downColor = '#00da3c';
            const downBorderColor = '#008F28';

            //console.log(response);
            let categoryData = [];
            let values = [];
            let volumes = [];
            for (var item in response.data.klines) {
                //console.log(response.data.klines[item]);
                var datas = response.data.klines[item].split(',');
                //console.log(datas);
                categoryData.push(datas[0]);
                //var jiaoyi = false;                

                values.push([parseFloat(datas[1]), parseFloat(datas[2]), parseFloat(datas[3]), parseFloat(datas[4])]);
                volumes.push(datas[0]);

            }

            var data = {
                categoryData,
                values,
                volumes,                
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
                    // extraCssText: 'width: 170px'
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
                        height: '65%'
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
                    
                ],
                yAxis: [
                    {
                        scale: true,
                        splitArea: {
                            show: true
                        }
                    },
                    
                ],
                dataZoom: [
                    
                    {
                        show: true,
                        xAxisIndex: [0],
                        type: 'slider',
                        top: '85%',
                        start: 80,
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
                        tooltip: {
                            show: true,
                            formatter: function (param) {
                            
                                param = param[0];
                                var param_ =
                                    [
                                        'Date: ' + param.name + '<hr size=1 style="margin: 3px 0">',
                                        '开盘: ' + param.data[0] + '<br/>',
                                        '收盘: ' + param.data[1] + '<br/>',
                                        '最低: ' + param.data[2] + '<br/>',
                                        '最高: ' + param.data[3] + '<br/>'
                                    ].join('');
                                return param_;
                            }
                        },
                        //dimensions: [ '日期','开盘', '收盘', '最高', '最低'],
                        markPoint: {

                            //data: pointmark
                        }

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
                    }
                ]
            };
            //console.log(option);
            echarts.dispose(document.getElementById('myEchart'));
            var myChart = echarts.init(document.getElementById('myEchart'));
            myChart.setOption(option);
        },
        /**
         * 按照行业code获取行业日K曲线数据
         */
         async getIndustryHistoryData(code){
            var res = await reqGetIndustryHistoryData({industryCode:code});
            //console.log(res.data);
            this.drawEcharts(res);
         },
        /**
         * 获取行业数据
         */
        async getIndustryData(){
            this.loading = true;
            const res = await reqGetIndustryData({kind:this.kind,sort:this.sort,pz:100});
            //console.log(res.data);
            this.data = res.data.diff;
            this.loading = false;
        },
    },
    mounted(){
        this.getIndustryData();
    },
    data(){
        return{
            data: [],
            loading:false,
            kind:'fluctuate',
            sort:'asc',
            columns,
            loadingButton:false,
        }
    },
    
}
</script>