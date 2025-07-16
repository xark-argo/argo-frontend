import {apiFetch} from '~/utils/fetch'

export const addNewModel = async (token: string, model: object) => {
  return apiFetch(`/models/add`, model)
}

export const getModelList = async (params = {}) => {
  return apiFetch(`/model/get_model_list`, params)
}

export const getHotModelList = async (model: object) => {
  return apiFetch(`/model/get_popular_model`, model)
}

export const parseModelUrl = async (model: object) => {
  return apiFetch(`/model/parse_model_url`, model)
}

export const downloadModel = async (model: object) => {
  return apiFetch(`/model/download_model`, model)
}

export const downloadHotModel = async (model: object) => {
  return apiFetch(`/model/download_model_ollama`, model)
}

export const deleteModel = async (model_name) => {
  return apiFetch(`/model/delete_model`, {model_name})
}

export const updateFailModel = async (model: object) => {
  return apiFetch(`/model/update_model_name`, model)
}

export const ollamaServiceCheck = async (url) => {
  return apiFetch(`/model/ollama_service_check`, {base_url: url})
}

export const providerVerify = async (
  workspacesId,
  provider,
  credentials,
  model_name
) => {
  return apiFetch(`/workspaces/${workspacesId}/provider_verify`, {
    provider,
    credentials,
    model_name,
  })
}

export const changeModelStatus = async (model_name, status) => {
  return apiFetch(`/model/change_model_status`, {model_name, status})
}

export const getCategoryList = async () => {
  return apiFetch(`/workspaces/get_category`, null, {method: 'GET'})
}

export const setModelCategory = async (params) => {
  return apiFetch(`/model/change_model_category`, params)
}
