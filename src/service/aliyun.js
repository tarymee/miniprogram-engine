import config from '../config'
import request from './request'
import dayjs from 'dayjs'
import cloneDeep from 'lodash-es/cloneDeep'
const Base64 = require('../lib/Base64.js').default
const OSS = require('../lib/ali.sdk.min.js')
require('../lib/hmac.js')
require('../lib/sha1.js')
const Crypto = require('../lib/crypto.js').default

// let last = 0
// let servtoken
let isRequesting = false
const getServToken = function () {
  let servtoken = wx.getStorageSync('servtoken')
  let last
  if (servtoken) {
    last = new Date(servtoken.expiration).getTime()
  }
  const now = Date.now()
  if (!servtoken || (last - now < (1000 * 60 * 5))) {
    wx.removeStorageSync('servtoken')
    if (!isRequesting) {
      isRequesting = true
      return request({
        url: `${config.apiHost}/api/teapi/auth/servtoken`,
        method: 'get',
        isShowLoading: false
      }).then((res) => {
        wx.setStorageSync('servtoken', res.data.resp_data)
        isRequesting = false
        return res.data.resp_data
      })
    } else {
      return new Promise((resolve, reject) => {
        const fn = setInterval(() => {
          let servtoken = wx.getStorageSync('servtoken')
          if (servtoken) {
            resolve(servtoken)
            clearInterval(fn)
          }
        }, 200)
      })
    }
  } else {
    return Promise.resolve(servtoken)
  }
}


const getPolicyBase64 = function () {
  const policyText = {
    'expiration': '2050-01-01T12:00:00.000Z',
    // 设置该Policy的失效时间，超过这个失效时间之后，就没有办法通过这个policy上传文件了 指定了Post请求必须发生在2020年01月01日12点之前("2020-01-01T12:00:00.000Z")。
    'conditions': [
      ['content-length-range', 0, 10 * 1024 * 1024] // 设置上传文件的大小限制,1048576000=1000mb
    ]
  }
  return Base64.encode(JSON.stringify(policyText))
}

const getSignature = function (accesskeysecret, policyBase64) {
  const bytes = Crypto.HMAC(Crypto.SHA1, policyBase64, accesskeysecret, {
    asBytes: true
  })
  return Crypto.util.bytesToBase64(bytes)
}

function imgUpload ({
  filename = '',
  filePath = '',
  isShowLoading = true,
  success,
  fail
}) {
  getServToken().then((cloud) => {
    const user = wx.getStorageSync('user')
    const cloudserv = wx.getStorageSync('cloudserv')
    const bucket = cloudserv.storage
    const timestamp = Date.now()
    const date = dayjs(timestamp).format('YYYYMMDD')
    // 文件名前三位/文件业务类型/年月日/租户code/文件名.扩展名
    const objectkey = `${filename.slice(0, 3)}/img/${date}/${user.tenantcode}/${filename}`
    const policyBase64 = getPolicyBase64()
    const signature = getSignature(cloud.accesskeysecret, policyBase64)
    let aliyunServerURL
    if (config.apiHostIsprod) {
      aliyunServerURL = `${bucket.storageurl}/${bucket.bucket}`
      // aliyunServerURL = `${bucket.storageurl}`
    } else {
      aliyunServerURL = `https://${bucket.storageurl}`
    }
    function failFn (err) {
      console.error('上传失败', err)
      wx.showModal({
        title: '提示',
        content: '上传失败，请重新上传。',
        showCancel: false,
        success (e) {
          if (e.confirm) {}
        }
      })
      fail && fail(err)
    }

    if (config.apiHostIsprod) {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        success: function (res) {
          // console.log(res)
          request({
            url: `${aliyunServerURL}/${objectkey}`,
            method: 'PUT',
            data: res.data,
            isShowLoading,
            loadingText: '上传中...',
            header: {
              'Content-Type': 'image/jpeg,image/jpg,image/png'
            },
            success: function (res) {
              const url = `${aliyunServerURL}/${objectkey}`
              console.log('上传图片成功', url)
              success && success({
                url,
                source: filename,
                datetime: timestamp.toString()
              })
            },
            fail: function (err) {
              failFn(err)
            }
          })
        }
      })
    } else {
      if (isShowLoading) {
        wx.showLoading({
          title: '上传中...',
          mask: true
        })
      }
      wx.uploadFile({
        url: aliyunServerURL,
        filePath: filePath,
        name: 'file',
        formData: {
          'authorization': 'OSS ' + cloud.accesskeyid + ':' + signature,
          'key': objectkey,
          'OSSAccessKeyId': cloud.accesskeyid,
          'policy': policyBase64,
          'Signature': signature,
          'success_action_status': '200',
          'x-oss-security-token': cloud.securitytoken
        },
        success: function (res) {
          if (isShowLoading) {
            wx.hideLoading()
          }
          if (res.statusCode === 200) {
            const url = `${aliyunServerURL}/${objectkey}`
            console.log('上传图片成功', url)
            // todo
            success && success({
              url,
              source: filename,
              datetime: timestamp.toString()
            })
          } else {
            failFn(res)
          }
        },
        fail: function (err) {
          if (isShowLoading) {
            wx.hideLoading()
          }
          failFn(err)
        },
        complete () {

        }
      })
    }
  })
}

const getCloudConfig = () => {
  return getServToken().then((cloud) => {
    const cloudserv = wx.getStorageSync('cloudserv')
    const bucket = cloudserv.storage
    let client = new OSS({
      endpoint: bucket.storageendpoint,
      accessKeyId: cloud.accesskeyid,
      accessKeySecret: cloud.accesskeysecret,
      stsToken: cloud.securitytoken,
      bucket: bucket.storagebucket
    })
    return client
  })
}


const getUrl = ({
  type,
  file,
  // https://help.aliyun.com/knowledge_detail/39530.html?spm=5176.21213303.J_6028563670.106.56613eda6XizEq&scm=20140722.S_help%40%40%E7%9F%A5%E8%AF%86%E7%82%B9%40%4039530.S_0.ID_39530-RL_%E6%9C%89%E6%95%88%E6%9C%9F-OR_s%2Bhelpproduct-V_1-P0_19
  // https://help.aliyun.com/document_detail/39607.htm?spm=a2c4g.11186623.2.6.275f46d5KfvnXR
  isPublicReading = true, // 是否公共读 是的话直接生成连接 否的话需要进行签名操作
  width,
  height,
  success
}) => {
  file = cloneDeep(file)
  const dealFile = cloneDeep(file)
  if (type === 'file') {
    dealFile.datetime = dealFile.date
    dealFile.source = dealFile.url
    delete dealFile.date
    delete dealFile.url
  } else if (type === 'rtxe') {

  } else if (type === 'img') {

  }
  const user = wx.getStorageSync('user')
  const cloudserv = wx.getStorageSync('cloudserv')
  const date = dayjs(Number(dealFile.datetime)).format('YYYYMMDD')
  let objectkey
  if (type === 'file') {
    objectkey = `${dealFile.source.slice(0, 3)}/att/${date}/${user.tenantcode}/${dealFile.source}`
  } else if (type === 'rtxe') {
    objectkey = `${dealFile.source.slice(0, 3)}/att/${date}/${user.tenantcode}/${dealFile.source}`
  } else if (type === 'img') {
    objectkey = `${dealFile.source.slice(0, 3)}/img/${date}/${user.tenantcode}/${dealFile.source}`
  }
  let process = ''
  // process = 'image/resize,m_fixed,h_100'
  if (type === 'img') {
    if (width || height) {
      process = `image/resize,m_fixed`
      if (width) {
        process += `,w_${width}`
      }
      if (height) {
        process += `,h_${height}`
      }
    }
  }

  if (isPublicReading) {
    let url
    if (config.apiHostIsprod) {
      url = `${cloudserv.storage.storageurl}/${cloudserv.storage.bucket}/${objectkey}?x-oss-process=${encodeURIComponent(process)}`
    } else {
      url = `https://${cloudserv.storage.storageurl}/${objectkey}?x-oss-process=${encodeURIComponent(process)}`
    }
    success && success(url)
  } else {
    getCloudConfig().then((client) => {
      let url = client.signatureUrl(objectkey, {
        process: process
      })
      url = url.replace('http://', 'https://')
      success && success(url)
    })
  }
}


const imgGetUrl = ({
  file,
  width,
  height,
  success
}) => {
  return getUrl({
    type: 'img',
    file,
    width,
    height,
    success
  })
}

const fileGetUrl = ({
  file,
  success
}) => {
  return getUrl({
    type: 'file',
    file,
    success
  })
}

const rtxeGetUrl = ({
  file,
  success
}) => {
  return getUrl({
    type: 'rtxe',
    file,
    success
  })
}



export default {
  getServToken,
  imgUpload,
  imgGetUrl,
  fileGetUrl,
  rtxeGetUrl
}
