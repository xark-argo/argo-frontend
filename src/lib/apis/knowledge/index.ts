import {apiFetch} from '~/utils/fetch'

export const getKnowledgeList = async () => {
  return apiFetch(`/knowledge/list_collections`, null, {
    method: 'GET',
  })
}

export const createKnowledge = async (params) => {
  return apiFetch(`/knowledge/create_knowledge_base`, params)
}

export const updateKnowledge = async (params) => {
  return apiFetch(`/knowledge/update_knowledge_base`, params)
}

export const deleteKnowledge = async (params) => {
  return apiFetch(`/knowledge/drop_knowledge_base`, params)
}

export const getListDatasets = async () => {
  return apiFetch(`/knowledge/list_datasets`, null, {method: 'GET'})
}

export const bindWorkspace = async (params) => {
  return apiFetch(`/knowledge/bind_workspace`, params)
}

export const unBindWorkspace = async (params) => {
  return apiFetch(`/knowledge/unbind_workspace`, params)
}

export const getKnowledgeDetailInfo = async (params) => {
  return apiFetch(`/knowledge/list_documents`, params)
}

export const getDatasetsList = async () => {
  return apiFetch(`/knowledge/list_datasets`, null, {method: 'GET'})
}

export const createTempKnowledge = async (params) => {
  return apiFetch(`/knowledge/create_temp_knowledge_base`, params)
}

export const getFolderPath = async () => {
  return apiFetch(`/knowledge/get_directory`, null, {method: 'GET'})
}
