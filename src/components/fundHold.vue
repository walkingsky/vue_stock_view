<template>
  <div id="timeChart" ref="timeChart" style="width: 100%;height:450px" v-if="showChart"></div>
  <a-space align="end">
    <a-button @click="closeHistory()">关闭历史行情</a-button>    
  </a-space>
  <a-table
    size="small"
    :row-selection="rowSelection"
    :rowKey="(record)=>{return record.code}" 
    :data-source="data" 
    :custom-row="customRow"
    :columns="columns"        
    :loading="loading"
    :scroll="{ y: windowHeight }"
    :pagination="false"
    :row-class-name="(_record) => (_record.gzzf <= 0 ? 'row-green':'row-red')"
  >
    <template #bodyCell="{ column }">
        <template v-if="column.key === 'action'">
                <a-typography-link @click="showTransactions()">详细交易</a-typography-link>            
        </template>
    </template>      
  </a-table>
  <a-drawer
    v-model:visible="visible"
    class="custom-class"
    style="color: red"
    title="详细交易记录"
    placement="right"
    @close="visible=false"
  >
    <a-timeline >
      <template v-for="(item,key) in transactions" :key="key">
        <a-timeline-item v-if="item.type == '买入' || item.type == '转入'" color="green">{{item.tradedate}} {{item.type}} 份额：{{item.shares}} 价值：{{item.amount}} 退回金额：{{item.returned}}</a-timeline-item>
        <a-timeline-item v-if="item.type == '卖出' || item.type == '转出'" color="blue">{{item.tradedate}} {{item.type}} 份额：{{item.shares}} 价值：{{item.amount}} 退回金额：{{item.returned}}</a-timeline-item>
        <a-timeline-item v-if="item.type == '分红'" color="red">{{item.tradedate}} {{item.type}} 价值：{{item.amount}} </a-timeline-item>
      </template>
    </a-timeline>
  </a-drawer>
</template>
<script>
  import {reqFundHoldGetAll,reqFundGz,reqFundLsjz,reqFundTradeGetByICode} from '@/apis/fund';
  import * as echarts from 'echarts';
  import { isOperation } from '@/units/common';

  const columns = [
    /*
    {
        title: 'id',
        dataIndex: 'id',
        sorter: (a,b)=>a.id-b.id,
        defaultSortOrder:'ascend',
        width:60,
        key:'id',
    },*/
    {
        title: '基金名称',
        dataIndex: 'name',
        width:280,
        sorter: (a, b) => a.name.localeCompare(b.name),
    }, {
        title: '基金代码',
        dataIndex: 'code',
        sorter: (a,b)=>a.code-b.code,
    }, {
        title: '份额',
        dataIndex: 'shares',
        sorter: (a,b)=>a.shares-b.shares,
    },{
        title: '持仓成本',
        dataIndex: 'costprice',
        sorter: (a,b)=>a.costprice-b.costprice,
    },{
        title: '实时估值',
        dataIndex: 'gz',
        sorter: (a,b)=>a.gz-b.gz,
    },{
        title: '估算值涨幅',
        dataIndex: 'gzzf',
        sorter: (a,b)=>a.gzzf-b.gzzf,
        defaultSortOrder:'descend',
        sortOrder:true,
        customRender:(text)=>{
            if (text.text != null && text.text != '--') {
                return text.text + '%'
            }
        },
    },{
        title:'操作',
        key:'action'
    }
  ]
  
  export default {
    setup(){
      return {
        
      }
    },
    methods:{
      /**
       * 获取持仓记录数据
       */
      async getRecord(){
            this.loading = true;            
            let res = await reqFundHoldGetAll();
            this.data = res.data;            
            this.loading = false;
            this.getFundsGz();
      },
      /**
       * 获取所有基金估值
       */
      async getFundsGz(){
        var codes = '';
        for(var da in this.data){         
          codes += this.data[da]['code'] +',';
        }
        codes = codes.substring(0, codes.length - 1);
        var res = await reqFundGz({codes:codes});
        for( da in this.data){         
          //this.data[da]['gz'] =  res;
          this.data[da]['code']
          for(var  item in res.data ){
            if(this.data[da]['code'] == res.data[item].fundcode){
              this.data[da].gz = res.data[item].gsz;
              this.data[da].gzzf = res.data[item]['gszzl'];
              break;
            }
          }
        }
      },
      /**
       * 绘制echart
       * @param {*} response ，数据
       * @param {*} name ，图表名称
       * @param {*} his ，历史买入卖出的数据记录
       */
      drawEcharts(response,name,his){
          let markPointData = [
              {type:'max',name:'最高'},
              {type:'min',name:'最低'}];
          for(let po in his){
            if (his[po].type == '卖出' || his[po].type == '转出'){
              markPointData.push({  value: his[po].type +':'+ his[po].shares, xAxis: his[po].tradedate, yAxis: his[po].nav,itemStyle: {color:'#ff6611'} })
            }else if(his[po].type == '买入' || his[po].type == '转入'){
              markPointData.push({  value: his[po].type +':'+ his[po].shares, xAxis: his[po].tradedate, yAxis: his[po].nav,itemStyle: {color:'#66ff11'} })
            }
          }
          echarts.dispose(document.getElementById('timeChart'));
          let myChart = echarts.init(document.getElementById("timeChart"));
          var x_Axis=[],y_data=[];
          for ( var data in response.Data.LSJZList){               
              let datas = response.Data.LSJZList[data];
              x_Axis.push(datas.FSRQ);                
              y_data.push(datas.DWJZ);					
          }
          var colors = ['#5470C6', '#91CC75', '#EE6666'];
          var option = {
              title: {
                  text: name,
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
                      height: '80%'
                  }
              ],
              xAxis: [
                  {
                      data: x_Axis,
                      inverse:true
                  }
              ],
              legend:{
                  data:['单位净值'],
                  top:'6%'
              },
                           
              yAxis: [
                  {
                      type:'value',
                      scale:true,
                      name:"单位净值",
                      axisLine: {
                          show: true,
                          lineStyle: {
                              color: colors[0]
                          }
                      },
                      axisLabel: {
                          formatter: '{value} 元'
                      }
                  }
              ],
              series: [
                  {
                      name: '单位净值',
                      smooth: 0.2,
                      type: 'line',
                      data: y_data,
                      markPoint:{
                          symbol: "pin",
                          symbolsise:30,
                          data:markPointData
                      }
                  }
              ]
          };
          // 使用刚指定的配置项和数据显示图表。
          myChart.setOption(option);
      },
      /**
       * 展示历史曲线图
       * @param {*} record 
       */
      async showHistory(record){
        this.showChart = true;
        this.windowHeight =  document.documentElement.clientHeight - 160 -450;
        var res = await reqFundLsjz({code:record.code,size:300});
        var his = await reqFundTradeGetByICode({code:record.code});
        this.drawEcharts(res,record.name,his.data);
        this.transactions = his.data;

      },
      /**
       * 关闭历史曲线图
       */
      closeHistory(){
        this.showChart = false;
        this.windowHeight =  document.documentElement.clientHeight - 160 ;
      }, 
      /**
       * 自定义的行点击事件
       * @param {*} record 
       */
      customRow(record){
        return{
          onClick:()=>{
            this.selectedRowKeys[0] = record.code;
            this.showHistory(record);
          }          
        }
      },
      /**
       * 展示详细历史交易记录
       */
      showTransactions(){
        this.visible = true;
      },
    },
    computed:{
      /**
       * 行选择
       */
      rowSelection(){
        return {
          selectedRowKeys: this.selectedRowKeys,
          onChange: (selectedRowKeys) => {                       
            this.selectedRowKeys = selectedRowKeys; 
            this.showHistory({code:selectedRowKeys[0]});           
          },
          type:'radio',
        };
      },
    },
    mounted(){
        this.getRecord();
        if(isOperation()){
          this.timer = setInterval(()=>{
            this.getFundsGz();
          },30000); 
        }          
    },
    beforeUnmount(){
        //释放定时器
        clearInterval(this.timer);
    },
    data(){
      return{
        loading:false,
        columns,
        data:[],
        timer:null,
        showChart:false,
        windowHeight: document.documentElement.clientHeight - 160 -(this.showChart===true?450:0),
        selectedRowKeys:[],
        visible:false,
        transactions:[],
      }
    }

  }
</script>

<style scoped>
  :deep(.row-green) td {
      background-color: #bcf9aa;
  }
  :deep(.row-red) td {
    background-color: #fab9b9;
  }
</style>