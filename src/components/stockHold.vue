<template>
    <div id="myEchart" ref="myEchart" style="width: 100%;height:450px" ></div>
    <a-table 
        :dataSource="dataSource" 
        :columns="columns"
        
        :pagination="pagination"
        :loading="loading"
     />
    
</template>
<script>
import * as echarts from 'echarts';
//import { reqGetHoldStocks } from '@/apis/stock';
import { usePagination } from 'vue-request';
import {computed} from 'vue';
import axios from 'axios';

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
        sorter: (a,b)=>a.marketVule-b.marketVule,
    },{
        title: '市场',
        dataIndex: 'market',
    }];
const queryData = params => {
    return axios.get('http://localhost:5000/apis/stock/hold', {
        params,
    });
};

export default {
    setup(){ 
        const {
            data: dataSource,
            run,
            loading,
            current,
            pageSize,
        } = usePagination(queryData, {
            formatResult: res => res.data.results,
            pagination: {
                currentKey: 'page',
                pageSizeKey: 'results',
            },
        });
        const pagination = computed(() => ({
            total: pageSize.value,
            current: current.value,
            pageSize: pageSize.value,
        }));

        const handleTableChange = (pag, filters, sorter) => {
        run({
            results: pag.pageSize,
            page: pag?.current,
            sortField: sorter.field,
            sortOrder: sorter.order,
            ...filters,
        });
        };      
        return {
            dataSource,
            pagination,
            loading,
            columns,
            handleTableChange,
        };
    },
    methods:{
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
    },
    data(){
        return{
            //dataSource: this.getTableData(),
        }
    }
    
}
</script>

