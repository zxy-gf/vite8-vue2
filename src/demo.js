export default {
  data() {
    return {
      msg: 'hello vue2',
    }
  },
  render(h) {
    return h('div', this.msg)
  }
}