import {apiFetch} from '~/utils/fetch'

export const getModelProviders = async (workspaceId: string | number) => {
  return apiFetch(`/workspaces/${workspaceId}/model-providers`, null, {
    method: 'GET',
  })
}

export const updateModelProviders = async (
  workspaceId: string | number,
  params: any
) => {
  return apiFetch(`/workspaces/${workspaceId}/model-providers`, params)
}

export const addModelProviders = async (
  workspaceId: string | number,
  params: any
) => {
  return apiFetch(`/workspaces/${workspaceId}/model-providers`, params, {
    method: 'PUT',
  })
}

export const deleteModelProviders = async (
  workspaceId: string | number,
  params: any
) => {
  return apiFetch(`/workspaces/${workspaceId}/model-providers`, params, {
    method: 'DELETE',
  })
}

export const addModelInProviders = async (
  workspaceId: string | number,
  params: any
) => {
  return apiFetch(`/workspaces/${workspaceId}/model_of_provider`, params, {
    method: 'PUT',
  })
}

export const deleteModelInProviders = async (
  workspaceId: string | number,
  params: any
) => {
  return apiFetch(`/workspaces/${workspaceId}/model_of_provider`, params, {
    method: 'DELETE',
  })
}

export const updateModelOfProvider = async (
  workspaceId,
  provider,
  custom_name,
  enable
) => {
  return apiFetch(
    `/workspaces/${workspaceId}/model_of_provider`,
    {provider, custom_name, enable},
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Bearer ${localStorage.token}`,
      },
    }
  )
}

export const setLanguages = async (language) => {
  return apiFetch(`/workspaces/set_language`, {language})
}

export const getChangeLog = async () => {
  return apiFetch(`/workspaces/get_changelog`, null, {method: 'GET'})
}
