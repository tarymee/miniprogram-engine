import config from '../config'
const amapFile = require('../lib/amap-wx.js').default
const aMap = new amapFile.AMapWX({ key: config.amapKey })

export default aMap
