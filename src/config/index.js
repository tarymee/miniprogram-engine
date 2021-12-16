const config = {
  apiHost: '',
  apiHostIsprod: false,
  amapKey: 'f7bea879d20284b2f29781adfd5272a6',
  request: {
    whenTokenIsInvalid: null,
    jumpToLoginPageWhenTokenIsInvalid: false,
    loginPage: '',
    interceptor: {
      response: {
        success: null,
        fail: null
      }
    }
  },
  interceptor: {
    response: {
      success: null,
      fail: null
    }
  }
}
export default config
