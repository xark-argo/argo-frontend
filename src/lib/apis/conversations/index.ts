import {obj2String} from '~/lib/utils'
import {apiFetch} from '~/utils/fetch'

export const getConversations = async (params) => {
  const searchStr = obj2String(params)
  return apiFetch(`/conversations?${searchStr}`, {}, {method: 'GET'})
}

export const getConversationDetail = async (params) => {
  const searchStr = obj2String(params)
  return apiFetch(`/messages?${searchStr}`, {}, {method: 'GET'})
}

export const editConversationName = async (id, params) => {
  return apiFetch(`/conversation/${id}/name`, params)
}

export const deleteConversation = async (conversationId) => {
  return apiFetch(`/conversation/${conversationId}`, {}, {method: 'DELETE'})
}

export const createConversation = async () => {
  return apiFetch(`/conversations`, {})
}

export const deleteMessages = async (conversationId) => {
  const params = {conversation_id: conversationId}

  return apiFetch(`/conversation/${conversationId}/messages`, params, {
    method: 'DELETE',
  })
}

export const createBranch = async (id, params) => {
  return apiFetch(`/conversation/${id}/branch`, params)
}

export const editMessage = async (id, params) => {
  return apiFetch(`/message/${id}`, params)
}

export const deleteMessage = async (id, params) => {
  return apiFetch(`/message/${id}`, params, {method: 'DELETE'})
}
