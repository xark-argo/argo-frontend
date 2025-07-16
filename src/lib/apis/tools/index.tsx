import {apiFetch} from '~/utils/fetch'

export const createTool = async (toolParams: object) => {
  return apiFetch('/tool/create_tool', toolParams)
}

export const deleteTool = async (toolParams: object) => {
  return apiFetch('/tool/delete_tool', toolParams)
}

export const getToolInfo = async (toolParams: object) => {
  return apiFetch('/tool/get_tool_info', toolParams)
}

export const getToolList = async (params) => {
  return apiFetch('/tool/get_tool_list', params)
}

export const getInternalInfo = async (toolParams: object) => {
  return apiFetch('/tool/get_internal_info', toolParams)
}

export const getInternalProvider = async (toolParams: object) => {
  return apiFetch('/tool/get_internal_provider', toolParams)
}

export const getInternalToolList = async () => {
  return apiFetch('/tool/get_internal_list', {})
}

export const updateToolInfo = async (toolParams: object) => {
  return apiFetch('/tool/update_tool_info', toolParams)
}

export const authExternalTool = async (toolParams: object) => {
  return apiFetch('/tool/auth_external_tool', toolParams)
}

export const authInternalTool = async (toolParams: object) => {
  return apiFetch('/tool/auth_internal_tool', toolParams)
}

export const exportTool = async (params) => {
  return apiFetch('/tool/tool_export', params)
}

export const importTool = async (tool) => {
  return apiFetch('/tool/tool_import', tool)
}
