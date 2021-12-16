// import api from './api'
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
  success,
  fail,
  complete,
  isShowLoading = true,
  loadingText = '加载中...',
  isSendToken = true,
  // isCheckToken = false,
  isShowError = true
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

  return new Promise((resolve, reject) => {
    function failFn (result) {
      const errorCode = get(result, 'data.error_code', '网络异常 请稍后重试')
      if (errorCode === 'token无效，请重新登录') {
        wx.showModal({
          title: '提示',
          content: '登录超时，请重新登录',
          showCancel: false,
          success (e) {
            if (e.confirm) {
              auth.jumpLogin()
            }
          }
        })
      } else {
        if (isShowError) {
          wx.showModal({
            title: '提示',
            content: errorCode,
            showCancel: false
          })
        }
      }
      console.error({
        url: url,
        request: data,
        response: result
      })
      fail && fail(result)
      reject(result)
    }
    wx.request({
      url: url,
      method: method,
      header: header,
      // dataType: dataType,
      responseType: responseType,
      data: data,
      success (res) {
        // console.log('success', res)
        if (res.statusCode === 200) {
          /* console.log({
            url: url,
            request: data,
            response: res
          }) */
          if (isShowLoading) {
            loadingCount--
            if (loadingCount <= 0) {
              loadingCount = 0
              console.log('hideLoading')
              wx.hideLoading()
            }
          }
          success && success(res)
          resolve(res)
        } else {
          if (isShowLoading) {
            loadingCount--
            if (loadingCount <= 0) {
              loadingCount = 0
              wx.hideLoading()
            }
          }
          if (res.statusCode === 401) {
            const pages = getCurrentPages()
            var path = pages[pages.length - 1].route
            console.log(path)
            if (path !== 'pages/login/login') {
              wx.showToast({
                title: '登录超时，请重新登录',
                icon: 'none',
                duration: 1500
              })
              auth.jumpLogin()
            } else {
              wx.showToast({
                title: res.data.error_code,
                icon: 'none',
                duration: 1500
              })
            }
          } else {
            failFn(res)
          }
        }
      },
      fail (res) {
        console.log(res)
        // debugger
        failFn(res)
      },
      complete (res) {
        complete && complete(res)
      }
    })
  })

  // if (isCheckToken) {
  //   // console.log('有校验登录 发起请求')
  //   auth.checkLogin({
  //     success: function () {
  //       ajax()
  //     }
  //   })
  // } else {
  //   // console.log('没校验登录 发起请求')
  //   ajax()
  // }
}

export default request
