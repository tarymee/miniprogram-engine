// import api from './api'
import config from '../config'
import auth from './auth'
// import mockData from './mock'
// import cloneDeep from 'lodash-es/cloneDeep'
import get from 'lodash-es/get'


let loadingCount = 0

// 封装wx.request方法
async function request ({
  url = '',
  method = 'POST',
  data = {},
  header = {},
  // header = {
  //   'content-type': 'application/x-www-form-urlencoded',
  //   // 'content-type': 'application/json'
  // },
  // dataType = 'json',
  responseType = 'text',
  // success,
  // fail,
  // complete,
  isShowLoading = true,
  loadingText = '',
  isSendToken = true
  // isCheckToken = false
}) {
  if (isShowLoading) {
    loadingCount++
    wx.showLoading({
      title: loadingText,
      mask: true
    })
  }

  const token = wx.getStorageSync('token')
  if (isSendToken && token) {
    header.token = token
  }
  function fainFn (err, reject) {
    let errorMsg = '网络异常，请稍后重试。'
    if (err.data) {
      if (typeof err.data === 'string') {
        errorMsg = err.data
      } else {
        errorMsg = get(err, 'data.error_code', '网络异常，请稍后重试。')
      }
    }
    wx.showModal({
      title: '提示',
      content: errorMsg,
      showCancel: false,
      success (e) {
        if (e.confirm) {
          if (errorMsg.indexOf('token is invalid(decode).') !== -1 || errorMsg.indexOf('token is invalid(null).') !== -1 || errorMsg === 'token无效，请重新登录') {
            if (config.request.jumpToLoginPageWhenTokenIsInvalid && config.request.loginPage) {
              auth.loginOut()
              // debugger
              wx.navigateTo({
                url: config.request.loginPage
              })
            }
            // if (!currentPageIsLogin()) {
            //   utils.jumpLogin()
            // }
          }
        }
      }
    })
    reject(err)
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: method,
      header: header,
      // dataType: dataType,
      responseType: responseType,
      data: data,
      success (res) {
        if (res.statusCode === 200) {
          resolve(res)
        } else {
          fainFn(res, reject)
        }
        // if (config.interceptor.response.success) {
        //   res = config.interceptor.response.success(res)
        // }
        // if (Object.prototype.toString.call(res) === '[object Promise]') {
        //   res.then((res) => {
        //     resolve(res)
        //   }).catch(err => {
        //     reject(err)
        //   })
        // } else {
        //   resolve(res)
        // }
      },
      fail (err) {
        fainFn(err, reject)
        // if (config.interceptor.response.fail) {
        //   err = config.interceptor.response.fail(err)
        // }
        // if (Object.prototype.toString.call(err) === '[object Promise]') {
        //   err.then((res) => {
        //     resolve(res)
        //   }).catch(err => {
        //     reject(err)
        //   })
        // } else {
        //   reject(err)
        // }
      },
      complete (res) {
        if (isShowLoading) {
          loadingCount--
          if (loadingCount <= 0) {
            loadingCount = 0
            wx.hideLoading()
          }
        }
      }
    })
  })
}

export default request
// if (~request.url.indexOf('/api/teapi/') || request.url === '/api/auth/choosetenant') {
//   XtionWebService.TokenService.updateRefreshToken(this)
// }
// export const updateRefreshToken = (vm) => {
//   let expires = Token.getTokenExpires()
//   let now = new Date().getTime()
//   // 剩下4分钟的时候，去刷新一下refreshtoken 有问题，如果是这样子的话，在距离超时5分钟之前操作，因为这时候没有去请求跟新token
//   // 操作后，再等一阵子，就有问题了。
//   // 改为15分钟更新一次
//   if (expires - now < 1000 * 45 * 60) {
//     // 刷新
//     // TODO 这里可能多次异步调用，需要做处理
//     if (isRun) {
//       return
//     }
//     refreshToken(vm, null, (error) => {
//       console.error(error)
//       // vm.$responseHandler.error(vm, error, null, 'error')
//     })
//   }
// }
