import {apiFetch} from '~/utils/fetch'

export const toolInstall = async () => {
  return apiFetch('/tool/mcp_tool_install', undefined, {
    method: 'GET',
  })
}

export const toolInstallStatus = async () => {
  return apiFetch('/tool/mcp_tool_install_status', undefined, {
    method: 'GET',
  })
}

export const addMCPTool = async (tool: object) => {
  return apiFetch('/tool/create_mcp_server', tool)
}

export const checkMCPTool = async (tool: object) => {
  return apiFetch('/tool/check_mcp_server', tool)
}

export const updateMCPTool = async (tool: object) => {
  return apiFetch('/tool/update_mcp_server', tool)
}

export const getMCPList = async () => {
  return apiFetch('/tool/get_mcp_list', undefined, {
    method: 'GET',
  })
}

export const deleteMCPList = async (id: object) => {
  return apiFetch('/tool/delete_mcp_server', id)
}
