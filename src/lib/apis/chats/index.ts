import {apiFetch} from '~/utils/fetch'

export const stopBotSay = async (params) => {
  return apiFetch('/chat/message/stop', params)
  // let error = null

  // const res = await fetch(`${WEBUI_API_BASE_URL}`, {
  //   method: 'POST',
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/json',
  //     authorization: `Bearer ${localStorage.token}`,
  //   },
  //   body: JSON.stringify(params),
  // })
  //   .then(async (result) => {
  //     if (!result.ok) throw await result.json()
  //     return result.json()
  //   })
  //   .then((json) => {
  //     return json
  //   })
  //   .catch((err) => {
  //     error = err
  //     return null
  //   })

  // if (error) {
  //   throw error
  // }

  // return res
}

export const getMessageInfoById = async (message_id: string) => {
  return apiFetch(`/chat/message/${message_id}/get`, null, {method: 'GET'})
}
