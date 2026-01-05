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

/**
 * 检查工具列表中是否有启用的工具
 * @param tools 工具列表
 * @returns 是否有启用的工具
 */
export const hasEnabledTools = (tools: any[] = []): boolean => {
  return tools.some((tool) => tool.enabled === true)
}

/**
 * 检查模型是否支持工具调用
 * @param model 模型对象
 * @returns 是否支持工具调用
 */
export const modelSupportsTools = (model: any): boolean => {
  if (!model?.category) {
    return false
  }
  const category = model.category
  if (!category?.category_label?.category || category.category_label.category.length === 0) {
    return false
  }
  return category.category_label.category.some(
    (item: any) => item?.category === 'tools'
  )
}

/**
 * 根据工具列表更新 agent_mode 的状态
 * @param agentMode agent_mode 对象
 * @param tools 工具列表
 * @returns 更新后的 agent_mode 对象
 */
export const updateAgentModeByTools = (
  agentMode: any,
  tools: any[] = []
): any => {
  const enabled = hasEnabledTools(tools)
  const isDeepResearch = agentMode?.strategy === 'react_deep_research'

  return {
    ...agentMode,
    enabled,
    strategy: enabled && isDeepResearch ? 'react_deep_research' : 'tool_call',
  }
}
