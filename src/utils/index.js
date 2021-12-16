
const isNumber = function (value) {
  return value ? (Number(value) === +Number(value)) : false
}

const fixLength = function (str) {
  if (str) {
    if (isNumber(str)) {
      return str + 'px'
    } else {
      return str
    }
  } else {
    return ''
  }
}

export {
  fixLength
}
