<script>
export default {
  name: 'kye-badge',
  props: [ 'value' ],
  data () {
    return {
      currentValue: this.value
    }
  },
  watch: {
    value (val) {
      this.currentValue = val
    }
  },
  render (h) {
    return (
      <el-badge value={this.currentValue}>{this.$slots.default}</el-badge>
    )
  },
  methods: {
    update (val) {
      this.currentValue = val
    }
  }
}
</script>
