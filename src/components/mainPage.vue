<template>
    <a-config-provider :locale="locale">
      <a-layout style="min-height: 100vh">
        <a-layout-sider v-model:collapsed="collapsed" collapsible>      
          <a-menu 
            theme="dark" 
            v-model:selectedKeys="selectedKey" 
            v-model:openKeys="openKey" 
            mode="inline"
            @select="menuSelect"
          >
            <a-sub-menu key="sub1">
              <template #title>
                <span>
                  <SlidersOutlined />
                  <span>股票</span>
                </span>
              </template>
              <a-menu-item key="0">持仓股票</a-menu-item>
              <a-menu-item key="1">历史持仓股票</a-menu-item>
              <a-menu-item key="2">行业排名分析</a-menu-item>
              <a-menu-item key="3">行业行情分析</a-menu-item>
            </a-sub-menu>
            
            <a-sub-menu key="sub2">
              <template #title>
                <span>
                  <PieChartOutlined />
                  <span>基金</span>
                </span>
              </template>
              <a-menu-item key="4">持仓基金</a-menu-item>
              <a-menu-item key="5">交易记录</a-menu-item>
            </a-sub-menu>
          </a-menu>
        </a-layout-sider>
        <a-layout>
          <!--
          <a-layout-header style="background: #fff; padding: 0" />
          -->
          <a-layout-content style="margin: 0 16px">
            
            <component :is="currentMain"></component>
          </a-layout-content>
          <a-layout-footer style="text-align: center">
            Ant Design ©2018 Created by Ant UED
          </a-layout-footer>
        </a-layout>
      </a-layout>
    </a-config-provider>
  </template>
  <script>
  import {
    SlidersOutlined,
    PieChartOutlined,
  } from '@ant-design/icons-vue';
  import { defineComponent, ref } from 'vue';
  import zhCN from 'ant-design-vue/es/locale/zh_CN';
  
  import fundHold from '@/components/fundHold.vue';
  import stockHold from '@/components/stockHold.vue';
  import stockHistory from '@/components/stockHistory.vue';
  import stockIndustryInfo from '@/components/stockIndustryInfo.vue';
  import stockIndustry from '@/components/stockIndustry.vue';
  import fundTrades from '@/components/fundTrades.vue';
  
  export default defineComponent({
    components: {
      SlidersOutlined,
      PieChartOutlined,
      fundHold,
      fundTrades,
      stockHold,
      stockHistory,
      stockIndustry,
      stockIndustryInfo,
    },
  
    data() {
      return {
        collapsed: ref(false),
        openKey: ref(['sub1','sub2']),
        selectedKey: ref(['0']), 
        currentMain:  'stockHold',
        mainComponents:['stockHold','stockHistory','stockIndustry','stockIndustryInfo','fundHold','fundTrades'],
        locale:zhCN,   
      };
    },
    methods: {
      menuSelect( {key} ){ 
        this.currentMain = this.mainComponents[key]
      },
    }
  });
  </script>
  <style>
  #components-layout-demo-side .logo {
    height: 32px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.3);
  }
  
  .site-layout .site-layout-background {
    background: #fff;
  }
  [data-theme='dark'] .site-layout .site-layout-background {
    background: #141414;
  }
  </style>