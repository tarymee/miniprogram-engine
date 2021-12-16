import get from 'lodash-es/get'
import baseMixin from './baseMixin'

export default {
  mixins: [
    baseMixin
  ],
  data: {
    isInputCtrl: true,
    required: false,
    placeholder: '',
    hiddenclearbtn: false,
    errmsg: ''
  },
  watch: {
    value (newValue, oldValue) {
      // console.log('watch value')
      this.errmsg = this.requiredValidata()
    }
    // todo
    // 1 如果监听 required 的话 create 时会改变 required 导致刚开始就出现提示
    // 2 如果不监听那么在用户自行更改 required 时则不会自己触发更新 errmsg
    // required (newValue, oldValue) {
    //   console.error('watch required')
    //   this.errmsg = this.requiredValidata()
    // }
  },
  created () {
    // console.log('baseInputMixin')
    this.required = get(this, 'viewRule.required') === '1'
    this.placeholder = get(this.viewRule, 'placeholder', '')
    this.hiddenclearbtn = get(this, 'viewRule.hiddenclearbtn') === '1'
  },
  methods: {
    requiredValidata () {
      let res = ''
      if (this.required && !this.hidden && (this.value === '' || (Array.isArray(this.value) && !this.value.length))) {
        res = `${this.title}不能为空`
      }
      return res
    },
    // 输入型控件校验方法
    validata () {
      this.errmsg = this.requiredValidata()
      return this.errmsg
    }
  }
}
