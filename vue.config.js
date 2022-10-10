const path = require('path');

module.exports = {
  devServer: {
    port: 8888,     // 端口号
  },
  assetsDir: './static',
  publicPath: '',
  publicPath: undefined,
  outputDir: path.resolve(__dirname, './dist'),
  runtimeCompiler: undefined,
  productionSourceMap: undefined,
  parallel: undefined,
  css: undefined,
  //lintOnSave: false,
};