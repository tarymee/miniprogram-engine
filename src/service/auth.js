import config from '../config'
import request from './request'
import get from 'lodash-es/get'
import cloneDeep from 'lodash-es/cloneDeep'
// import package from '../../package.json'
// console.error(package)

// 基于账号密码登录服务
function login ({
  account,
  password
}) {
  return loginStep1({
    account,
    password
  }).then(async (loginStep1Res) => {
    // console.log(loginStep1Res)
    // debugger
    const loginStep2Res = await loginStep2(loginStep1Res)
    return loginStep2Res
  }).then(async (loginStep2Res) => {
    // console.log(loginStep2Res)
    const loginStep3Res = await loginStep3(loginStep2Res)
    return loginStep3Res
  }).then(async (loginStep3Res) => {
    // console.log(loginStep3Res)
    const loginStep4Res = await loginStep4(loginStep3Res)
    return loginStep4Res
  }).catch((err) => {
    // console.error(err)
    throw Error(err)
  })
}

// 基于第1步登录结果 继续走登录流程
function loginFromStep1 (loginStep1Res) {
  return loginStep2(loginStep1Res).then(async (loginStep2Res) => {
    const loginStep3Res = await loginStep3(loginStep2Res)
    return loginStep3Res
  }).then(async (loginStep3Res) => {
    const loginStep4Res = await loginStep4(loginStep3Res)
    return loginStep4Res
  }).catch((err) => {
    // console.error(err)
    throw Error(err)
  })
}

// 登录第1步 基于账号密码登录
async function loginStep1 ({
  account,
  password
}) {
  return request({
    url: `${config.apiHost}/api/auth/login`,
    data: {
      clienttypecode: '6',
      username: account,
      password: password
    },
    isSendToken: false
  }).then(res => {
    return res.data.resp_data
  }).catch(err => {
    throw Error(err)
  })
}

// 登录第2步 选择租户 如果只有一个租户 直接进行下一步
async function loginStep2 (loginStep1Res) {
  let token = get(loginStep1Res, 'token', '')
  const refreshtoken = get(loginStep1Res, 'refreshtoken', '')
  const tokenexpires = get(loginStep1Res, 'tokenexpires', '')
  const tenants = get(loginStep1Res, 'tenants', [])
  if (!tenants.length) {
    wx.showModal({
      title: '提示',
      content: '暂无租户',
      showCancel: false
    })
    throw Error('暂无租户')
  } else {
    if (tenants.length === 1 && tenants[0].productversionlist && tenants[0].productversionlist.length === 1) {
      const cloudserv = cloneDeep(tenants[0].cloudserv)
      return {
        token: token,
        refreshtoken: refreshtoken,
        tokenexpires: tokenexpires,
        cloudserv: cloudserv
      }
    } else {
      try {
        let actionSheet = []
        tenants.forEach((item) => {
          if (item.productversionlist && item.productversionlist.length) {
            item.productversionlist.forEach((item2) => {
              actionSheet.push({
                ...item,
                productversion_name: item2.name,
                productversion_code: item2.code,
                productversion_productcode: item2.productcode
              })
            })
          }
        })
        let actionSheetResult = await actionSheetPromise('选择产品', actionSheet.map((item) => `${item.name}(${item.productversion_name})`))
        // console.log(actionSheetResult)
        let choosetenantResult = await choosetenantRequest({
          token: token,
          postData: {
            accountcode: actionSheet[actionSheetResult.tapIndex].accountcode,
            tenantcode: actionSheet[actionSheetResult.tapIndex].code,
            productcode: actionSheet[actionSheetResult.tapIndex].productversion_productcode,
            productversioncode: actionSheet[actionSheetResult.tapIndex].productversion_code
          }
        })
        // console.log(choosetenantResult)
        token = get(choosetenantResult, 'data.resp_data', '')
        const cloudserv = cloneDeep(actionSheet[actionSheetResult.tapIndex].cloudserv)
        return {
          token: token,
          refreshtoken: refreshtoken,
          tokenexpires: tokenexpires,
          cloudserv: cloudserv
        }
      } catch (e) {
        throw Error(e)
      }
    }
  }
}

// 登录第3步 选择职位 如果只有一个职位 直接进行下一步
async function loginStep3 (loginStep2Res) {
  let accountInfoResult = await getAccountInfoRequest({
    token: loginStep2Res.token,
    positionid: ''
  })
  // console.log(accountInfoResult)
  let positions = get(accountInfoResult, 'data.resp_data.positions', [])
  if (positions.length === 0) {
    wx.showModal({
      title: '提示',
      content: '帐号已停用',
      showCancel: false
    })
    throw Error('帐号已停用')
  } else if (positions.length === 1) {
    return {
      ...loginStep2Res,
      user: accountInfoResult.data.resp_data,
      token: accountInfoResult.data.resp_data.token
    }
  } else {
    try {
      let actionSheetResult = await actionSheetPromise('选择岗位', positions.map((item) => `${item.positionname}(${item.orgname})`))
      // console.log(actionSheetResult)
      accountInfoResult = await getAccountInfoRequest({
        token: loginStep2Res.token,
        positionid: positions[actionSheetResult.tapIndex].positionid
      })
      return {
        ...loginStep2Res,
        user: accountInfoResult.data.resp_data,
        token: accountInfoResult.data.resp_data.token
      }
    } catch (e) {
      throw Error(e)
    }
  }
}

// 登录第4步 基于前面步骤 把token等用户信息存入localStorage
async function loginStep4 (loginStep3Res) {
  wx.setStorageSync('user', loginStep3Res.user)
  wx.setStorageSync('token', loginStep3Res.token)
  wx.setStorageSync('refreshtoken', loginStep3Res.refreshtoken)
  wx.setStorageSync('tokenexpires', loginStep3Res.tokenexpires)
  wx.setStorageSync('cloudserv', loginStep3Res.cloudserv)
  return loginStep3Res
}

function actionSheetPromise (alertText, itemList) {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      alertText: alertText,
      itemList: itemList,
      success (res) {
        resolve(res)
      },
      fail (err) {
        reject(err)
      }
    })
  })
}

function choosetenantRequest ({
  token,
  postData = {}
}) {
  return request({
    url: `${config.apiHost}/api/auth/choosetenant`,
    header: {
      token: token
    },
    data: postData,
    isSendToken: false
  })
}

function getAccountInfoRequest ({
  token,
  positionid
}) {
  let systemInfo
  try {
    systemInfo = wx.getSystemInfoSync()
    console.log(systemInfo)
  } catch (e) {
    // Do something when catch error
  }
  return request({
    url: `${config.apiHost}/api/teapi/rolepermission/account/getaccountinfo`,
    header: {
      token: token
    },
    data: {
      positionid: positionid || '',
      // 设备信息 在企业微信运行时，会额外返回一个environment字段并赋值为 “wxwork”，在微信里面运行时则不返回该字段
      deviceinfo: systemInfo.environment || 'wechat',
      // 设备信息版本
      sysversion: `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system} ${systemInfo.platform}`,
      // 正常应该是传引擎版本 但小程序暂时没引擎
      // 如果传小程序版本 但小程序版本目前定义很随意 而且没啥用
      // 综合考虑 传微信app版本
      clientversion: `${systemInfo.version}`
    },
    isSendToken: false
  })
}

const loginOut = function () {
  wx.removeStorageSync('user')
  wx.removeStorageSync('token')
  wx.removeStorageSync('refreshtoken')
  wx.removeStorageSync('tokenexpires')
  wx.removeStorageSync('cloudserv')
  wx.removeStorageSync('servtoken')
}

// 检测用户是否登录状态
function checkLogin ({
  success,
  fail
}) {
  const token = wx.getStorageSync('token')
  if (token) {
    success && success()
    // wx.checkSession({
    //   success () {
    //     success && success()
    //   },
    //   fail () {
    //     console.error('session_key 已经失效，需要重新执行登录流程')
    //     failFn()
    //   },
    // })
  } else {
    fail && fail()
  }
}

export default {
  login,
  loginFromStep1,
  loginOut,
  checkLogin
}
