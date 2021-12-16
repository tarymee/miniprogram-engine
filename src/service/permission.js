function checkFunc (functioncode) {
  if (!functioncode) return true
  const FunctionCodes = wx.getStorageSync('user').functioncodes || []
  let check = FunctionCodes.includes(functioncode)
  return !!check
}

export default {
  checkFunc
}
