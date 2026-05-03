import Vue from 'vue'
import App from './App.vue'
import ElementUi from 'element-ui'

Vue.use(ElementUi, { size: 'mini' })
new Vue({
  el: '#app',
  components: { App },
  render: (h) => h('App')
})
