<template>
  <div>
    app
    <!-- <Demo /> -->
    <DemoJSX />
    <KyeBadge :value="10" />
    <Demo1 />
  </div>
</template>

<script>
// import Demo from './src/demo.js'
import DemoJSX from './src/demo-jsx.js'
import KyeBadge from './src/test/demo.vue'
import Demo1 from './src/test/demo1.vue'

export default {
  components: {
    // Demo,
    DemoJSX,
    KyeBadge,
    Demo1
  },
  data() {
    return {
        
      }
    }
  }
</script>
