import {apiFetch} from '~/utils/fetch'

export const getWorkspaceList = async () => {
  return apiFetch('/workspace/list', null, {method: 'GET'})
}

export const switchWorkspace = async (params) => {
  return apiFetch('/workspaces/switch', params)
}

export const getWorkspaceMembers = async (workspaceId) => {
  return apiFetch(`/workspaces/${workspaceId}/members`, null, {method: 'GET'})
}

export const updateWorkspaceMembers = async (workspaceId, params) => {
  return apiFetch(`/workspaces/${workspaceId}/members`, params)
}

export const deleteWorkspaceMembers = async (workspaceId, params) => {
  return apiFetch(`/workspaces/${workspaceId}/members`, params, {
    method: 'DELETE',
  })
}

export const getAccountType = async () => {
  return apiFetch('/config', null, {method: 'GET'})
}
