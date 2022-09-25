<template>
  <div id="timeChart" ref="timeChart" style="width: 100%;height:450px" v-if="showChart"></div>
  <a-table
    size="small"
    :data-source="data" 
    :columns="columns"        
    :loading="loading"
    :scroll="{ y: windowHeight }"
    :pagination="false"
    :row-class-name="(_record) => (_record.gzzf <= 0 ? 'row-green':'row-red')"
  >
  
  <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'action'">
          <span>
              <a-typography-link @click.stop="showHistory(record)">历史行情</a-typography-link>
          <a-divider type="vertical" />
              <a-typography-link @click.stop="closeHistory()">关闭历史行情</a-typography-link>
          </span>
      </template>
  </template>        
  </a-table>
</template>
<script>
  import {reqFundHoldGetAll,reqFundGz,reqFundLsjz,reqFundTradeGetByICode} from '@/apis/fund';
  import * as echarts from 'echarts';

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
        title: '操作',
        dataIndex: 'op',
        key:'action',
    }];
  function isOperation(){
      var today = new Date();
      
      var day = today.getDay();
      if ( day == 0 || day == 6 )
        return false;      
      var hour = today.getHours();
      var minute = today.getMinutes();
      var time = hour * 100 + minute;
      if ( ( time > 920 && time < 1135 ) || ( time > 1255 && time < 1505 ) ) {
        return true;
      }

      return false;
  }
  export default {
    setup(){
      return {
        
      }
    },
    methods:{
      async getRecord(){
            this.loading = true;            
            let res = await reqFundHoldGetAll();
            this.data = res.data;            
            this.loading = false;
            this.getFundsGz();
      },
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
              //console.log(typeof(temp_string));
              x_Axis.push(datas.FSRQ);                
              y_data.push(datas.DWJZ);					
          }
          var colors = ['#5470C6', '#91CC75', '#EE6666'];
          var option = {
              title: {
                  text: name
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
                  data:['单位净值']
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
      async showHistory(record){
        this.showChart = true;
        this.windowHeight =  document.documentElement.clientHeight - 160 -450;
        var res = await reqFundLsjz({code:record.code,size:300});
        var his = await reqFundTradeGetByICode({code:record.code});
        this.drawEcharts(res,record.name,his.data);

      },
      closeHistory(){
        this.showChart = false;
        this.windowHeight =  document.documentElement.clientHeight - 160 ;
      }, 
    },
    mounted(){
        this.getRecord();
        this.timer = setInterval(()=>{
            if(isOperation())
            {
                this.getFundsGz();
            }                
        },20000); 
    },
    beforeUnmount(){
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