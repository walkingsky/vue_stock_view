<template>
    <a-table 
        class="ant-table-my" 
        :data-source="data" 
        :columns="columns"        
        :loading="loading"
        :pagination=false
        @expand="expandCustomRow" 
        :expandedRowKeys="expandedRowKeys"
        :scroll="{ y:`calc(100vh - 130px)` }"
     >
    <!--
        套用自定义样式，压缩行高
        bug:子表的上下会和主表重叠一部分
    -->
        <template #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }">
            <div style="padding: 8px">
                <a-input
                    ref="searchInput"
                    :placeholder="`Search ${column.dataIndex}`"
                    :value="selectedKeys[0]"
                    style="width: 188px; margin-bottom: 8px; display: block"
                    @change="e => setSelectedKeys(e.target.value ? [e.target.value] : [])"
                    @pressEnter="handleSearch(selectedKeys, confirm, column.dataIndex)"
                />
                <a-button
                    type="primary"
                    size="small"
                    style="width: 90px; margin-right: 8px"
                    @click="handleSearch(selectedKeys, confirm, column.dataIndex)"
                >
                    <template #icon><SearchOutlined /></template>
                    查找
                </a-button>
                <a-button size="small" style="width: 90px" @click="handleReset(clearFilters)">
                    复位
                </a-button>
            </div>
        </template>
        <template #customFilterIcon="{ filtered }">
            <search-outlined :style="{ color: filtered ? '#108ee9' : undefined }" />
        </template>
        <template #bodyCell="{ text, column }">
            <span v-if="searchText && searchedColumn === column.dataIndex">
                <template
                v-for="(fragment, i) in text
                    .toString()
                    .split(new RegExp(`(?<=${searchText})|(?=${searchText})`, 'i'))"
                >
                    <mark
                        v-if="fragment.toLowerCase() === searchText.toLowerCase()"
                        :key="i"
                        class="highlight"
                    >
                    {{ fragment }}
                    </mark>
                <template v-else>{{ fragment }}</template>
                </template>
            </span>
        </template>

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
import { reqGetHoldStocks ,reqGetStockHistory} from '@/apis/stock';
import { SearchOutlined } from '@ant-design/icons-vue';
import { reactive, ref, toRefs } from 'vue';



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
    components: {
        SearchOutlined,
    },
    setup(){
        const state = reactive({
            searchText: '',
            searchedColumn: '',
        });
        const columns = [{
            title: '证券名称',
            dataIndex: 'name',
            //sorter: true,
            customFilterDropdown: true,
            onFilter: (value, record) => record.name.toString().toLowerCase().includes(value.toLowerCase()),
            onFilterDropdownVisibleChange: visible => {
                if (visible) {
                setTimeout(() => {
                    searchInput.value.focus();
                }, 100);
                }
            },
        }, {
            title: '证券代码',
            dataIndex: 'code',
            customFilterDropdown: true,
            onFilter: (value, record) => record.name.toString().toLowerCase().includes(value.toLowerCase()),
            onFilterDropdownVisibleChange: visible => {
                if (visible) {
                setTimeout(() => {
                    searchInput.value.focus();
                }, 100);
                }
            },
        },{
            title: '市场',
            dataIndex: 'market',
        },{
            title: '当前数量',
            dataIndex: 'num',
            sorter: (a,b)=>a.num-b.num,
        },{
            title: '市值价',
            dataIndex: 'price',
            defaultSortOrder:'descend',
            sorter: (a,b)=>a.price-b.price,
        }];
        const searchInput = ref();
        const handleSearch = (selectedKeys, confirm, dataIndex) => {
            confirm();
            state.searchText = selectedKeys[0];
            state.searchedColumn = dataIndex;
        };

        const handleReset = clearFilters => {
            clearFilters({
                confirm: true,
            });
            state.searchText = '';
        };
        return {
            //data,
            columns,
            handleSearch,
            handleReset,
            searchInput,
            ...toRefs(state),
        };
    },
    methods:{
        /**
         * 获取表格数据
         */
        async getTableData(){
            this.loading = true;
            const res = await reqGetHoldStocks({history:'1'});
            console.log(res);
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
        
    },
    mounted(){
        //this.drawEtharts();  
        this.getTableData();      
    },
    data(){
        return{
            data: [],
            innerData:[],
            //columns,
            innerColumns,
            loading:false,
            innerLoading:false,
            expandedRowKeys:[],
        }
    }
    
});
</script>

<style scoped>
    .highlight {
      background-color: rgb(255, 192, 105);
      padding: 0px;
    }
    .ant-table-my :deep( .ant-table-tbody > tr > td ) {
        padding: 6px 2px;
    }
</style>