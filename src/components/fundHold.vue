<template>
  <div id="timeChart" ref="timeChart" style="width: 100%;height:450px" v-if="showChart"></div>
  <a-space align="end">
    <a-button @click="closeHistory()">关闭历史行情</a-button>     
    <a-button @click="handleAdd">添加持仓记录</a-button>   
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
      <template #bodyCell="{ column,text,record }"> 
        <template v-if="[ 'shares','costprice'].includes(column.dataIndex)">
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
        <template v-if="column.key === 'action'">
                  
                <span v-if="editableData[record.id]">
                        <a-typography-link @click.stop="save(record)">保存</a-typography-link>
                        <a-divider type="vertical" />
                        <a-typography-link @click.stop="cancel(record.id)">取消</a-typography-link>                       
                </span> 
                <span v-else>
                  <a-typography-link @click="showTransactions()">详细交易</a-typography-link>  
                  <a-divider type="vertical" />
                  <a-popconfirm
                      v-if="data.length"
                      title="确认删除?"
                      @confirm="onDelete(record.code)"
                      @click.stop=""
                      >
                          <a>删除记录</a>
                  </a-popconfirm> 
                </span>      
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
  import {reqFundHoldGetAll,reqFundGz,reqFundLsjz,reqFundSuggest,reqFundTradeGetByICode,reqFundHoldDelByCode,reqFundHoldAdd} from '@/apis/fund';
  import * as echarts from 'echarts';
  import { message } from 'ant-design-vue';
  import { isOperation } from '@/units/common';
  import { cloneDeep } from 'lodash-es';

  const columns = [
    
    {
        title: 'id',
        dataIndex: 'id',
        sorter: (a,b)=>a.id-b.id,
        defaultSortOrder:'ascend',
        width:60,
        key:'id',
    },
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
          if (this.data[da]['code'] =='')
            continue;        
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
       * 添充表格数据，从而实现表格添加行
       */
      handleAdd(){
          var newData = {
              id: `${this.countA}`,
              name:'',
              code: '',             
              shares:0,
              costprice:0,
              new:true,
          };
          this.data.push(newData);
          this.editableData[newData.id] = cloneDeep(this.data.filter(item => newData.id === item.id)[0]);
          this.currentId = newData.id;
      },
      /**
       * 保存新行数据
       */
      async save(record){
          //校验数据
          let recordData = {
              //id: parseInt( record.id),
              name: record.name,
              code: this.editableData[record.id].code,  
              shares: this.editableData[record.id].shares,           
              costprice:this.editableData[record.id].costprice,              
          };
          if(this.data.filter(item => record.id === item.id)[0].new === true)
              var res = await reqFundHoldAdd(recordData);
          else
              return
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
      /**
       * 退出行的编辑状态
       */
      cancel(id){
          delete this.editableData[id];
          this.currentId = null;
      },
      /**
       * 自动完成输入的选择确认动作
       */
      onSelect(value,option){
          for (let i in this.data){
              if(this.data[i].id == this.currentId){
                  this.data[i].name = option.NAME;
                  break;
              }                    
          }
      },
      /**
       * 自动完成后台搜索
       */
      async onSearch(searchText){
          let res = await reqFundSuggest({key:searchText});
          for(let i in res.Datas){
              res.Datas[i].value = res.Datas[i].CODE;
          }
          this.optionDatas = res.Datas;

      },
      /**
       * 删除按照code提交后台删除
       */
      async onDelete(code){
        let res = await reqFundHoldDelByCode({code:code});
        if(res.success === true)
        {
            this.getRecord();
            message.success('删除成功');
        }else{
            message.error('删除出错');
        }
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
            if(record.code ==='')
              return;
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
          getCheckboxProps:(record)=>{
            if(this.currentId != null && record.id == this.currentId){
              return {disabled:true};
            }else{
              return null;
            }
          },
          type:'radio',
        };
      },
      /**
       * 计数新增数据id
       */
       countA(){
          if(this.data.length == 0)
                  return 1 ;
          let c = this.data;
          let a = c.sort((a,b) => {return b.id-a.id })[0];
          return parseInt(a.id)  + 1 ;
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
        editableData:{},
        optionDatas:[],
        currentId:null,
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