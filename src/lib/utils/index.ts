/* eslint-disable no-restricted-syntax */

export const mergeObjects = (a, b) => {
  const merged = {...a}

  for (const key in b) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      if (
        typeof b[key] === 'object' &&
        !Array.isArray(b[key]) &&
        Object.prototype.hasOwnProperty.call(a, key) &&
        typeof a[key] === 'object'
      ) {
        merged[key] = mergeObjects(a[key], b[key])
      } else {
        merged[key] = b[key]
      }
    }
  }

  return merged
}

export const formatSize = (size) => {
  const kbSize = size / 1024
  if (size < 1024) {
    return `${size}b`
  }
  if (kbSize < 1024) {
    return `${kbSize.toFixed(2)}kb`
  }
  const mbSize = kbSize / 1024
  if (mbSize < 1024) {
    return `${mbSize.toFixed(2)}MB`
  }
  const gbSize = mbSize / 1024
  return `${gbSize.toFixed(2)}G`
}

export const obj2String = (obj) => {
  // for (const item in obj) {
  //   arr[idx++] = [item, obj[item]]
  // }
  return new URLSearchParams(Object.entries(obj)).toString()
}

// 判断时区
export const inChina = () => {
  const timeTranslate = 0 - new Date().getTimezoneOffset() / 60
  return timeTranslate === 8
}

// 区分操作系统
export const platForm = () => {
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'macOS']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']

  const platform =
    (window.navigator as any)?.userAgentData?.platform ||
    window.navigator.platform

  let system
  if (macosPlatforms.indexOf(platform) !== -1) {
    system = 'MacOS'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    system = 'Windows'
  }
  return system
}
