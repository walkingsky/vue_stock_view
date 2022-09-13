<template>
    <a-space style="width: 100%">
        <a-button type="primary" :loading="loading" @click="getIndustryData()">刷新</a-button>
        <a-radio-group v-model:value="kind" @change="getIndustryData()"  :disabled="loading">
            <a-radio-button value="fluctuate">涨跌幅</a-radio-button>
            <a-radio-button value="capital">资金流入</a-radio-button>
        </a-radio-group>
        <a-radio-group v-model:value="sort" @change="getIndustryData()" :disabled="loading">
            <a-radio-button value="asc" >显示靠前排名</a-radio-button>
            <a-radio-button value="desc" >显示靠后排名</a-radio-button>
        </a-radio-group>
    </a-space>
    <div id="myEchart" ref="myEchart" style="width: 100%;height:100%" ></div>
</template>


<script>
    import {  ref } from 'vue';
    import * as echarts from 'echarts';
    import {reqGetIndustryData,reqGetIndustryInfoData} from '@/apis/stock'

    export default ({
      
      setup() {
        const loading = ref(false);  
        const kind = ref('fluctuate');
        const sort = ref('asc');  

        const selectKind = ()=>{
            console.log(kind.value);
        }
        const enterIconLoading = () =>{
            
        }
        const selectSort = () =>{
            console.log(sort.value);
        }
    
        return {
          loading,
          enterIconLoading,
          selectKind,
          selectSort,
          kind,
          sort,
        };
      },
      methods:{ 
        sortData(data,sort){
            var i,j;
            if(sort == 'asc'){
                //pz=20 可调返回数据量
                //console.log(data[19].value);
                for( i in data){
                    data[i].value[0] = data[i].value[0] - data[data.length - 1].value[0]  ;
                    //data[i].max = Math.abs(data[i].value[0])>Math.abs( data[data.length - 1].value[0])?Math.abs(data[i].value[0]):Math.abs( data[data.length - 1].value[0]);
                    if (data[i].value[1] >0){
                        data[i].value[2] = 1; 
                        //data[i].color = ['#942e38'];
                        data[i].itemStyle = {"borderColor": '#CC3333'};
                    }else if(data[i].value[1] <0){
                        data[i].value[2] = -1;
                        //data[i].color = ['#269f3c'];
                        data[i].itemStyle = {"borderColor":  '#339933'};
                    }else{
                        data[i].value[2] = 0;
                        //data[i].color = ['#aaa'];
                        data[i].itemStyle = {"borderColor": '#bbb'};
                    }
                    for ( j in data[i].children) {         
                        //pz=10 可调返回数据量
                        data[i].children[j].value[0] =  data[i].children[j].value[0] - data[i].children[data[i].children.length - 1].value[0]  ; 
                        if (data[i].children[j].value[1] >0){
                        data[i].children[j].value[2] = 1; 
                        }else if(data[i].children[j].value[1] <0){
                        data[i].children[j].value[2] = -1;
                        }else{
                        data[i].children[j].value[2] = 0;
                        }                  
                    }
                }
            }else{
                //pz=20 可调返回数据量
                //console.log(data[19].value);
                for( i in data){
                    data[i].value[0] = data[data.length - 1].value[0] - data[i].value[0];
                    if (data[i].value[1] >0){
                        data[i].value[2] = 1; 
                        //data[i].color = ['#942e38'];
                        data[i].itemStyle = {"borderColor": '#CC3333'};
                    }else if(data[i].value[1] <0){
                        data[i].value[2] = -1;
                        //data[i].color = ['#269f3c'];
                        data[i].itemStyle = {"borderColor":  '#339933'};
                    }else{
                        data[i].value[2] = 0;
                        //data[i].color = ['#aaa'];
                        data[i].itemStyle = {"borderColor": '#bbb'};
                    }
                    for (j in data[i].children) {         
                        //pz=10 可调返回数据量
                        data[i].children[j].value[0] = data[i].children[data[i].children.length-1].value[0] - data[i].children[j].value[0];
                        if (data[i].children[j].value[1] >0){
                        data[i].children[j].value[2] = 1; 
                        }else if(data[i].children[j].value[1] <0){
                        data[i].children[j].value[2] = -1;
                        }else{
                        data[i].children[j].value[2] = 0;
                        }
                    }
                }
            }
            return data;
            //return  JSON.parse('[{"name":"test","value":1,"children":'+JSON.stringify( data)+'}]');
        },       
        /**
         * 获取行业数据
         */
        async getIndustryData(){
            this.loading = true;
            const myKind = this.kind;
            echarts.dispose(document.getElementById('myEchart'));
            var myEcharts = echarts.init(document.getElementById('myEchart'));
            const res = await reqGetIndustryData({kind:this.kind,sort:this.sort});
            console.log(res);
            //return res;
            let promises = res.data.diff.map((item, index) => {
                //console.log(item.f12);
                //let info = {};
                return this.getIndustryInfoData(item, index, this.kind, this.sort);
            });       
                   

            Promise.all(promises).then((allData) => {
            
                //正序的时候也有负值
                //if(sort != 'asc') allData = sortData(allData);
                //console.log(allData);
                allData = this.sortData(allData,this.sort);
                //console.log(allData);
                
                myEcharts.setOption(
                    {
                        title: {
                            text: this.kind == 'fluctuate'?'行业分析(涨跌幅)':'行业分析(主力流入净额)',
                            left: 'center'
                        },
                        tooltip: {
                            formatter: function (info) {
                                var value = info.data.value[1];
                                var treePathInfo = info.treePathInfo;
                                var treePath = [];
                                for (var i = 1; i < treePathInfo.length; i++) {
                                    treePath.push(treePathInfo[i].name);
                                }
                                return [
                                '<div class="tooltip-title">' +
                                    echarts.format.encodeHTML(treePath.join('/')) +
                                    '</div>',
                                    myKind == 'fluctuate'?'涨跌幅:' + echarts.format.addCommas(value) + '%':'流入净额:' + echarts.format.addCommas(value) + '￥'
                                ].join('');
                            }
                        },
                        series: [
                        {
                            name: this.kind == 'fluctuate'?'行业分析(涨跌幅)':'行业分析(主力流入净额)',
                            type: 'treemap',
                            //visibleMin: 300,
                            visualMin: -1,
                            visualMax: 1,
                            visualDimension: 2,
                            label: {
                            show: true,
                            formatter: '{b}'
                            },
                            upperLabel: {
                            show: true,
                            height: 30
                            },
                            itemStyle: {
                            borderColor: '#fff'
                            },
                            levels: this.getLevelOption(),
                            data: allData
                        }
                        ]
                    }
                );

                this.loading = false;
                // [0, 1, 2]
            }).catch((err) => {
                console.log(err);
            })
        },
        /**
         * 获得行业内的股票排行
         */
        async getIndustryInfoData(info, index, kind, sort){
            var industryCode = info.f12;
            var industryName = info.f14;
            var industryValue = 0;

            if (kind != 'fluctuate') {
                industryValue =info.f62;
            }else{
                industryValue = info.f3;
            }

            var json = await reqGetIndustryInfoData({industryCode:info.f12,kind:kind,sort:sort});
            console.log(json);
            for(var item in json.data.diff){
                  json.data.diff[item].name = json.data.diff[item].f14;
                  if (kind != 'fluctuate') {
                     json.data.diff[item].value = [json.data.diff[item].f62,json.data.diff[item].f62];
                  }else{
                     json.data.diff[item].value = [json.data.diff[item].f3,json.data.diff[item].f3];
                  }
               }  
               //value_show  显示用的真实值   
               //value 图表用的数据，后期会被修改成全部正值          
               json = JSON.parse('{"index":'+index+',"name":"'+industryName+'","value":['+industryValue+','+industryValue+'],"industryCode":"'+industryCode+'","children":'+JSON.stringify(json.data.diff)+'}');
            return json;
        },
        getLevelOption() {
            return [
                {
                
                itemStyle: {
                    borderColor: '#777',
                    borderWidth: 0,
                    gapWidth: 0
                },
                upperLabel: {
                    show: false
                }
                },
                {
                color: ['#269f3c','#aaa','#942e38' ],
                colorMappingBy: 'value',
                itemStyle: {
                    borderColor: '#999',
                    borderWidth: 5,
                    gapWidth: 1
                },
                emphasis: {
                    itemStyle: {
                    borderColor: '#ddd'
                    }
                }
                },
                {
                
                itemStyle: {
                    borderColor: '#999',
                    borderWidth: 1,
                    gapWidth: 1
                },
                emphasis: {
                    itemStyle: {
                    borderColor: '#ddd'
                    }
                }
                }

            ];
        },
      },
      mounted(){
        this.getIndustryData();
      },
    
    });
    </script>