import get from 'lodash-es/get'
import cloneDeep from 'lodash-es/cloneDeep'
import { fixLength } from '../../utils'

export default {
  properties: {
    viewRule: {
      type: Object,
      value: {}
    }
  },
  data: {
    type: '',
    title: '',
    value: '',
    eventlist: [],
    hidden: false,
    readonly: false,
    sence: 'horizontal' // vertical | horizontal
  },
  created () {
    // console.log('baseMixin')
    this.type = get(this.viewRule, 'type', '')
    this.title = get(this.viewRule, 'title', '')
    this.value = get(this.viewRule, 'value', '')
    this.hidden = get(this, 'viewRule.hidden') === '1'
    this.readonly = get(this, 'viewRule.readonly') === '1'
    this.required = get(this, 'viewRule.required') === '1'
    this.hiddenclearbtn = get(this, 'viewRule.hiddenclearbtn') === '1'
    this.placeholder = get(this.viewRule, 'placeholder', '')
    this.sence = this.viewRule.sence || 'horizontal'
  },
  computed: {
    viewStyle () {
      const style = this.createBaseStyle()
      return style
    }
  },
  ready () {
    this.executeEvent('onload')
  },
  methods: {
    createBaseStyle () {
      let styleObj = {
        // flex: this.viewRule.flex === '1' ? this.viewRule.flex + ' 0 auto' : '',
        flex: this.viewRule.flex,
        width: fixLength(this.viewRule.width),
        height: fixLength(this.viewRule.height)
      }
      if (this.viewRule.style) {
        styleObj = {
          ...styleObj,
          ...this.viewRule.style
        }
      }
      if (this.hidden) {
        styleObj.display = 'none'
      }
      return styleObj
    },
    executeEvent (triggerType, option = {}) {
      this.triggerEvent(triggerType, {
        eventTarget: this,
        ...option
      })
      // for (const event of this.eventlist) {
      //   if (event.trigger === triggerType && event.handler) {
      //     // console.log(triggerType)
      //     // console.log(this)
      //     // debugger
      //     console.log(`${this.type}【${this.title || this.name || this.code}】执行 ${triggerType} 事件`)
      //     // 兼容作为普通组件被引用时触发事件
      //     // this.$emit(triggerType)
      //     this.$parent[event.handler]({
      //       eventTarget: this,
      //       ...option
      //     })
      //     break
      //   }
      // }
    },
    getValue (getter) {
      return cloneDeep(this.value)
    },
    setValue (value, setter) {
      // debugger
      this.value = cloneDeep(value)
    },
    getProp (type, getter) {
      return type === 'value' ? this.getValue(getter) : cloneDeep(this[type])
    },
    setProp (type, value, setter) {
      type === 'value' ? this.setValue(value, setter) : this[type] = cloneDeep(value)
    },
    validata () {
      return true
    }
  }
}
